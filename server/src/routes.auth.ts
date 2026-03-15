import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
        status: 'ACTIVE',
      },
      include: { tenant: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Ungültige Zugangsdaten.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Ungültige Zugangsdaten.' });
    }

    const jwtSecret = process.env.JWT_ACCESS_SECRET || 'super-secret-access';
    const accessToken = jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,
      },
      jwtSecret,
      { expiresIn: 15 * 60 }, // 15 Minuten in Sekunden
    );

    return res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ message: 'Interner Serverfehler beim Login.' });
  }
});

export default router;

