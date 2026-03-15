import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { requireAuth, canManageTenant } from './middleware/auth';

const router = express.Router();

// GET /api/tenants/:id/users – Mitarbeiter eines Mandanten (SuperAdmin oder eigener Mandant)
router.get('/:id/users', requireAuth, async (req, res) => {
  const tenantId = Number(req.params.id);
  if (!tenantId || Number.isNaN(tenantId)) {
    res.status(400).json({ message: 'Ungültige Mandanten-ID.' });
    return;
  }
  const user = req.user!;
  if (!user.isSuperAdmin && user.tenantId !== tenantId) {
    res.status(403).json({ message: 'Zugriff nur auf den eigenen Mandanten.' });
    return;
  }
  try {
    const users = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        position: true,
        isSuperAdmin: true,
        createdAt: true,
        userRoles: { include: { role: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    const withRoles = users.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name, label: ur.role.label })),
    }));
    res.json(withRoles);
  } catch (error) {
    console.error('Tenant users list error', error);
    res.status(500).json({ message: 'Fehler beim Laden der Mitarbeiter.' });
  }
});

// POST /api/tenants/:id/users – Neuen Mitarbeiter anlegen (SuperAdmin oder Tenant-Admin für eigenen Mandanten)
router.post('/:id/users', requireAuth, async (req, res) => {
  const tenantId = Number(req.params.id);
  if (!tenantId || Number.isNaN(tenantId)) {
    res.status(400).json({ message: 'Ungültige Mandanten-ID.' });
    return;
  }
  if (!canManageTenant(req, tenantId)) {
    res.status(403).json({ message: 'Sie dürfen für diesen Mandanten keine Mitarbeiter anlegen.' });
    return;
  }
  const { email, password, firstName, lastName, position, roleIds } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    roleIds?: number[];
  };
  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
    return;
  }
  if (password.trim().length < 6) {
    res.status(400).json({ message: 'Das Passwort muss mindestens 6 Zeichen haben.' });
    return;
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    res.status(400).json({ message: 'Vorname und Nachname sind erforderlich.' });
    return;
  }
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ message: 'Mandant nicht gefunden.' });
      return;
    }
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
    });
    if (existing) {
      res.status(409).json({ message: 'Ein Benutzer mit dieser E-Mail existiert bereits bei diesem Mandanten.' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const newUser = await prisma.user.create({
      data: {
        tenantId,
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        position: position?.trim() || null,
        status: 'ACTIVE',
        isSuperAdmin: false,
      },
    });
    const roleIdsToAdd = Array.isArray(roleIds) ? roleIds.filter((r) => Number(r) > 0) : [];
    if (roleIdsToAdd.length > 0) {
      const rolesExist = await prisma.role.findMany({
        where: { id: { in: roleIdsToAdd } },
        select: { id: true },
      });
      const validIds = rolesExist.map((r) => r.id);
      await prisma.userRole.createMany({
        data: validIds.map((roleId) => ({ userId: newUser.id, roleId })),
        skipDuplicates: true,
      });
    }
    const created = await prisma.user.findUnique({
      where: { id: newUser.id },
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
    res.status(201).json(created);
  } catch (error) {
    console.error('Create user error', error);
    res.status(500).json({ message: 'Fehler beim Anlegen des Mitarbeiters.' });
  }
});

export default router;
