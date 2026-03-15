import express from 'express';
import { prisma } from './prisma';
import { requireAuth, requireSuperAdmin, canManageTenant } from './middleware/auth';

const router = express.Router();

router.use(requireAuth);

// GET /api/tenants – alle Mandanten (nur SuperAdmin), optional ?q= Suchbegriff
router.get('/', requireSuperAdmin, async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  try {
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { slug: { contains: q } },
            { city: { contains: q } },
            { street: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            {
              contacts: {
                some: {
                  OR: [
                    { firstName: { contains: q } },
                    { lastName: { contains: q } },
                    { email: { contains: q } },
                    { phone: { contains: q } },
                    { mobile: { contains: q } },
                  ],
                },
              },
            },
          ],
        }
      : {};
    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { contacts: { orderBy: { order: 'asc' } } },
    });
    res.json(tenants);
  } catch (error) {
    console.error('Tenants list error', error);
    res.status(500).json({ message: 'Fehler beim Laden der Mandanten.' });
  }
});

// GET /api/tenants/:id – ein Mandant inkl. Kontakte (SuperAdmin oder eigener Mandant)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  const user = req.user!;
  if (!user.isSuperAdmin && user.tenantId !== id) {
    res.status(403).json({ message: 'Zugriff nur auf den eigenen Mandanten.' });
    return;
  }
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { contacts: { orderBy: { order: 'asc' } } },
    });
    if (!tenant) {
      res.status(404).json({ message: 'Mandant nicht gefunden.' });
      return;
    }
    res.json(tenant);
  } catch (error) {
    console.error('Tenant get error', error);
    res.status(500).json({ message: 'Fehler beim Laden des Mandanten.' });
  }
});

type ContactInput = {
  firstName?: string;
  lastName?: string;
  role?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  isPrimary?: boolean;
  notes?: string;
  order?: number;
};

// POST /api/tenants – Mandant anlegen (nur SuperAdmin)
router.post('/', requireSuperAdmin, async (req, res) => {
  const {
    name,
    slug,
    isActive,
    street,
    postalCode,
    city,
    country,
    phone,
    email,
    billingName,
    billingStreet,
    billingPostalCode,
    billingCity,
    billingCountry,
    notes,
    contacts: contactsInput,
  } = req.body as {
    name?: string;
    slug?: string;
    isActive?: boolean;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    billingName?: string;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingCountry?: string;
    notes?: string;
    contacts?: ContactInput[];
  };

  if (!name?.trim()) {
    res.status(400).json({ message: 'Name ist erforderlich.' });
    return;
  }

  const slugValue = (slug?.trim() || name.trim())
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  if (!slugValue) {
    res.status(400).json({ message: 'Slug konnte nicht aus dem Namen erzeugt werden.' });
    return;
  }

  try {
    const existing = await prisma.tenant.findUnique({
      where: { slug: slugValue },
    });
    if (existing) {
      res.status(409).json({ message: 'Ein Mandant mit diesem Slug existiert bereits.' });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: name.trim(),
        slug: slugValue,
        isActive: isActive ?? true,
        street: street?.trim() || null,
        postalCode: postalCode?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || undefined,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        billingName: billingName?.trim() || null,
        billingStreet: billingStreet?.trim() || null,
        billingPostalCode: billingPostalCode?.trim() || null,
        billingCity: billingCity?.trim() || null,
        billingCountry: billingCountry?.trim() || undefined,
        notes: notes?.trim() || null,
      },
    });

    const contacts = Array.isArray(contactsInput) ? contactsInput : [];
    if (contacts.length > 0) {
      await prisma.tenantContact.createMany({
        data: contacts.map((c, i) => ({
          tenantId: tenant.id,
          firstName: (c.firstName ?? '').trim() || 'Kontakt',
          lastName: (c.lastName ?? '').trim() || '',
          role: c.role?.trim() || null,
          phone: c.phone?.trim() || null,
          mobile: c.mobile?.trim() || null,
          email: c.email?.trim() || null,
          isPrimary: !!c.isPrimary,
          notes: c.notes?.trim() || null,
          order: c.order ?? i,
        })),
      });
    }
    const created = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { contacts: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json(created ?? tenant);
  } catch (error) {
    console.error('Tenant create error', error);
    res.status(500).json({ message: 'Fehler beim Anlegen des Mandanten.' });
  }
});

// PATCH /api/tenants/:id – Mandant aktualisieren (SuperAdmin oder Tenant-Admin nur eigener Mandant)
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  if (!canManageTenant(req, id)) {
    res.status(403).json({ message: 'Sie dürfen diesen Mandanten nicht bearbeiten.' });
    return;
  }

  const {
    name,
    slug,
    isActive,
    street,
    postalCode,
    city,
    country,
    phone,
    email,
    billingName,
    billingStreet,
    billingPostalCode,
    billingCity,
    billingCountry,
    notes,
    contacts: contactsInput,
  } = req.body as {
    name?: string;
    slug?: string;
    isActive?: boolean;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    billingName?: string;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingCountry?: string;
    notes?: string;
    contacts?: ContactInput[];
  };

  try {
    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Mandant nicht gefunden.' });
      return;
    }

    const data: {
      name?: string;
      slug?: string;
      isActive?: boolean;
      street?: string | null;
      postalCode?: string | null;
      city?: string | null;
      country?: string;
      phone?: string | null;
      email?: string | null;
      billingName?: string | null;
      billingStreet?: string | null;
      billingPostalCode?: string | null;
      billingCity?: string | null;
      billingCountry?: string;
      notes?: string | null;
    } = {};
    if (name !== undefined) data.name = name.trim();
    if (isActive !== undefined) data.isActive = isActive;
    if (street !== undefined) data.street = street?.trim() || null;
    if (postalCode !== undefined) data.postalCode = postalCode?.trim() || null;
    if (city !== undefined) data.city = city?.trim() || null;
    if (country !== undefined) data.country = country?.trim();
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (billingName !== undefined) data.billingName = billingName?.trim() || null;
    if (billingStreet !== undefined) data.billingStreet = billingStreet?.trim() || null;
    if (billingPostalCode !== undefined) data.billingPostalCode = billingPostalCode?.trim() || null;
    if (billingCity !== undefined) data.billingCity = billingCity?.trim() || null;
    if (billingCountry !== undefined) data.billingCountry = billingCountry?.trim();
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (slug !== undefined) {
      const slugValue = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!slugValue) {
        res.status(400).json({ message: 'Ungültiger Slug.' });
        return;
      }
      const duplicate = await prisma.tenant.findFirst({
        where: { slug: slugValue, id: { not: id } },
      });
      if (duplicate) {
        res.status(409).json({ message: 'Ein anderer Mandant hat bereits diesen Slug.' });
        return;
      }
      data.slug = slugValue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({ where: { id }, data });
      await tx.tenantContact.deleteMany({ where: { tenantId: id } });
      const contacts = Array.isArray(contactsInput) ? contactsInput : [];
      if (contacts.length > 0) {
        await tx.tenantContact.createMany({
          data: contacts.map((c, i) => ({
            tenantId: id,
            firstName: (c.firstName ?? '').trim() || 'Kontakt',
            lastName: (c.lastName ?? '').trim() || '',
            role: c.role?.trim() || null,
            phone: c.phone?.trim() || null,
            mobile: c.mobile?.trim() || null,
            email: c.email?.trim() || null,
            isPrimary: !!c.isPrimary,
            notes: c.notes?.trim() || null,
            order: c.order ?? i,
          })),
        });
      }
    });

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { contacts: { orderBy: { order: 'asc' } } },
    });
    res.json(tenant);
  } catch (error) {
    console.error('Tenant update error', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Mandanten.' });
  }
});

export default router;
