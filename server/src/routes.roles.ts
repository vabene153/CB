import express from 'express';
import { prisma } from './prisma';
import { requireAuth } from './middleware/auth';

const router = express.Router();

router.use(requireAuth);

// GET /api/roles – alle Rollen (für Rechtevergabe bei Mitarbeitern)
router.get('/', async (_req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(roles);
  } catch (error) {
    console.error('Roles list error', error);
    res.status(500).json({ message: 'Fehler beim Laden der Rollen.' });
  }
});

export default router;
