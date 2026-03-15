import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { requireAuth } from './middleware/auth';

const router = express.Router();

router.use(requireAuth);

function getEffectiveTenantId(req: express.Request): number | null {
  const user = req.user!;
  if (user.isSuperAdmin && typeof req.query.tenantId === 'string') {
    const id = parseInt(req.query.tenantId, 10);
    if (!Number.isNaN(id)) return id;
  }
  return user.tenantId;
}

// GET /api/customers – Liste, optional ?tenantId= (nur SuperAdmin) und ?q= Suche
router.get('/', async (req, res) => {
  const tenantId = getEffectiveTenantId(req);
  if (tenantId === null) {
    res.status(400).json({ message: 'tenantId erforderlich.' });
    return;
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  try {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { type: { contains: q } },
        { city: { contains: q } },
        { street: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        {
          contacts: {
            some: {
              deletedAt: null,
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
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        contacts: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
    res.json(customers);
  } catch (error) {
    console.error('Customers list error', error);
    res.status(500).json({ message: 'Fehler beim Laden der Kunden.' });
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  const tenantId = getEffectiveTenantId(req);
  if (tenantId === null) {
    res.status(400).json({ message: 'tenantId erforderlich.' });
    return;
  }
  try {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contacts: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!customer) {
      res.status(404).json({ message: 'Kunde nicht gefunden.' });
      return;
    }
    res.json(customer);
  } catch (error) {
    console.error('Customer get error', error);
    res.status(500).json({ message: 'Fehler beim Laden des Kunden.' });
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

// POST /api/customers
router.post('/', async (req, res) => {
  const tenantIdParam = req.user!.isSuperAdmin && req.body.tenantId != null
    ? Number(req.body.tenantId)
    : null;
  const tenantId = tenantIdParam != null && !Number.isNaN(tenantIdParam)
    ? tenantIdParam
    : req.user!.tenantId;

  const { name, type, street, postalCode, city, country, phone, email, notes, contacts: contactsInput } = req.body as {
    name?: string;
    type?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    notes?: string;
    contacts?: ContactInput[];
  };

  if (!name?.trim()) {
    res.status(400).json({ message: 'Name ist erforderlich.' });
    return;
  }
  if (!type?.trim()) {
    res.status(400).json({ message: 'Kundentyp ist erforderlich (z. B. Privat, Gewerblich).' });
    return;
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: name.trim(),
        type: type.trim(),
        street: street?.trim() || null,
        postalCode: postalCode?.trim() || null,
        city: city?.trim() || null,
        country: country?.trim() || undefined,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        notes: notes?.trim() || null,
        createdById: req.user!.id,
        updatedById: req.user!.id,
      },
    });

    const contacts = Array.isArray(contactsInput) ? contactsInput : [];
    if (contacts.length > 0) {
      await prisma.customerContact.createMany({
        data: contacts.map((c, i) => ({
          tenantId,
          customerId: customer.id,
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

    const created = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: { contacts: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
    });
    res.status(201).json(created ?? customer);
  } catch (error) {
    console.error('Customer create error', error);
    res.status(500).json({ message: 'Fehler beim Anlegen des Kunden.' });
  }
});

// PATCH /api/customers/:id
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  const tenantId = req.user!.tenantId;
  try {
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!existing) {
      res.status(404).json({ message: 'Kunde nicht gefunden.' });
      return;
    }

    const { name, type, street, postalCode, city, country, phone, email, notes, contacts: contactsInput } = req.body as {
      name?: string;
      type?: string;
      street?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      phone?: string;
      email?: string;
      notes?: string;
      contacts?: ContactInput[];
    };

    const data: Record<string, unknown> = { updatedById: req.user!.id };
    if (name !== undefined) data.name = name.trim();
    if (type !== undefined) data.type = type.trim();
    if (street !== undefined) data.street = street?.trim() || null;
    if (postalCode !== undefined) data.postalCode = postalCode?.trim() || null;
    if (city !== undefined) data.city = city?.trim() || null;
    if (country !== undefined) data.country = country?.trim();
    if (phone !== undefined) data.phone = phone?.trim() || null;
    if (email !== undefined) data.email = email?.trim() || null;
    if (notes !== undefined) data.notes = notes?.trim() || null;

    await prisma.$transaction(async (tx) => {
      await tx.customer.update({ where: { id }, data });
      await tx.customerContact.deleteMany({ where: { customerId: id, tenantId } });
      const contacts = Array.isArray(contactsInput) ? contactsInput : [];
      if (contacts.length > 0) {
        await tx.customerContact.createMany({
          data: contacts.map((c, i) => ({
            tenantId,
            customerId: id,
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { contacts: { where: { deletedAt: null }, orderBy: { order: 'asc' } } },
    });
    res.json(customer);
  } catch (error) {
    console.error('Customer update error', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Kunden.' });
  }
});

export default router;
