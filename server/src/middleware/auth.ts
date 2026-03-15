import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: number;
  tenantId: number;
  email: string;
}

export interface AuthUser {
  id: number;
  tenantId: number;
  email: string;
  isSuperAdmin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Nicht angemeldet.' });
    return;
  }

  const secret = process.env.JWT_ACCESS_SECRET || 'super-secret-access';
  try {
    const decoded = jwt.verify(token, secret) as unknown as (JwtPayload & { isSuperAdmin?: boolean });
    req.user = {
      id: Number(decoded.sub),
      tenantId: Number(decoded.tenantId),
      email: decoded.email,
      isSuperAdmin: Boolean(decoded.isSuperAdmin),
    };
    next();
  } catch {
    res.status(401).json({ message: 'Ungültiger oder abgelaufener Token.' });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: 'Nur für Oberadministratoren.' });
    return;
  }
  next();
}
