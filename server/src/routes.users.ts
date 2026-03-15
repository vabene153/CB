import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { requireAuth, canManageTenant } from './middleware/auth';

const router = express.Router();

router.use(requireAuth);

function canManageUser(req: express.Request, targetTenantId: number): boolean {
  return canManageTenant(req, targetTenantId);
}

// GET /api/users/:id – ein Benutzer (SuperAdmin oder Tenant-Admin für Mitarbeiter des eigenen Mandanten)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  try {
    const u = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        position: true,
        tenantId: true,
        userRoles: { include: { role: true } },
      },
    });
    if (!u) {
      res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
      return;
    }
    if (!canManageUser(req, u.tenantId)) {
      res.status(403).json({ message: 'Sie dürfen diesen Mitarbeiter nicht ansehen.' });
      return;
    }
    res.json({
      ...u,
      userRoles: u.userRoles,
    });
  } catch (error) {
    console.error('Get user error', error);
    res.status(500).json({ message: 'Fehler beim Laden des Mitarbeiters.' });
  }
});

// PATCH /api/users/:id – Mitarbeiter bearbeiten inkl. Passwort (SuperAdmin oder Tenant-Admin für eigenen Mandanten)
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  const { firstName, lastName, position, status, roleIds, password: newPassword } = req.body as {
    firstName?: string;
    lastName?: string;
    position?: string;
    status?: string;
    roleIds?: number[];
    password?: string;
  };
  if (firstName !== undefined && !String(firstName).trim()) {
    res.status(400).json({ message: 'Vorname darf nicht leer sein.' });
    return;
  }
  if (lastName !== undefined && !String(lastName).trim()) {
    res.status(400).json({ message: 'Nachname darf nicht leer sein.' });
    return;
  }
  if (newPassword !== undefined && newPassword !== '' && String(newPassword).trim().length < 6) {
    res.status(400).json({ message: 'Das Passwort muss mindestens 6 Zeichen haben.' });
    return;
  }
  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: true },
    });
    if (!existing || existing.deletedAt) {
      res.status(404).json({ message: 'Mitarbeiter nicht gefunden.' });
      return;
    }
    if (!canManageUser(req, existing.tenantId)) {
      res.status(403).json({ message: 'Sie dürfen diesen Mitarbeiter nicht bearbeiten.' });
      return;
    }
    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName.trim();
    if (lastName !== undefined) data.lastName = lastName.trim();
    if (position !== undefined) data.position = position?.trim() || null;
    if (status === 'ACTIVE' || status === 'INACTIVE') data.status = status;
    if (newPassword !== undefined && String(newPassword).trim().length >= 6) {
      data.password = await bcrypt.hash(String(newPassword).trim(), 10);
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id }, data });
    }
    if (roleIds !== undefined && Array.isArray(roleIds)) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      const validIds = roleIds.filter((r) => Number(r) > 0);
      if (validIds.length > 0) {
        const rolesExist = await prisma.role.findMany({
          where: { id: { in: validIds } },
          select: { id: true },
        });
        await prisma.userRole.createMany({
          data: rolesExist.map((r) => ({ userId: id, roleId: r.id })),
          skipDuplicates: true,
        });
      }
    }
    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        position: true,
        userRoles: { include: { role: true } },
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('Update user error', error);
    res.status(500).json({ message: 'Fehler beim Speichern der Änderungen.' });
  }
});

export default router;
