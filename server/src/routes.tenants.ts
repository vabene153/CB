import express from 'express';
import { prisma } from './prisma';
import { requireAuth, requireSuperAdmin } from './middleware/auth';

const router = express.Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

// GET /api/tenants – alle Mandanten
router.get('/', async (_req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(tenants);
  } catch (error) {
    console.error('Tenants list error', error);
    res.status(500).json({ message: 'Fehler beim Laden der Mandanten.' });
  }
});

// GET /api/tenants/:id – ein Mandant
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
    return;
  }
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
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

// POST /api/tenants – Mandant anlegen
router.post('/', async (req, res) => {
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
    contactPerson,
    billingName,
    billingStreet,
    billingPostalCode,
    billingCity,
    billingCountry,
    notes,
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
    contactPerson?: string;
    billingName?: string;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingCountry?: string;
    notes?: string;
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
        contactPerson: contactPerson?.trim() || null,
        billingName: billingName?.trim() || null,
        billingStreet: billingStreet?.trim() || null,
        billingPostalCode: billingPostalCode?.trim() || null,
        billingCity: billingCity?.trim() || null,
        billingCountry: billingCountry?.trim() || undefined,
        notes: notes?.trim() || null,
      },
    });
    res.status(201).json(tenant);
  } catch (error) {
    console.error('Tenant create error', error);
    res.status(500).json({ message: 'Fehler beim Anlegen des Mandanten.' });
  }
});

// PATCH /api/tenants/:id – Mandant aktualisieren
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!id || Number.isNaN(id)) {
    res.status(400).json({ message: 'Ungültige ID.' });
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
    contactPerson,
    billingName,
    billingStreet,
    billingPostalCode,
    billingCity,
    billingCountry,
    notes,
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
    contactPerson?: string;
    billingName?: string;
    billingStreet?: string;
    billingPostalCode?: string;
    billingCity?: string;
    billingCountry?: string;
    notes?: string;
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
      contactPerson?: string | null;
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
    if (contactPerson !== undefined) data.contactPerson = contactPerson?.trim() || null;
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

    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    });
    res.json(tenant);
  } catch (error) {
    console.error('Tenant update error', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Mandanten.' });
  }
});

export default router;
