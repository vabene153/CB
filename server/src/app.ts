import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import authRoutes from './routes.auth';
import tenantRoutes from './routes.tenants';
import tenantUsersRoutes from './routes.tenant-users';
import customerRoutes from './routes.customers';
import rolesRoutes from './routes.roles';
import usersRoutes from './routes.users';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.nodeEnv === 'production' ? true : 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// API-Routen
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantUsersRoutes); // :id/users vor tenant-Routen
app.use('/api/tenants', tenantRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/users', usersRoutes);

// Health-Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Produktion: gebautes Frontend aus server/public ausliefern (SPA-Fallback)
if (env.nodeEnv === 'production') {
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

export default app;

