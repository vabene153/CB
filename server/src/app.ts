import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes.auth';
import tenantRoutes from './routes.tenants';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json());

// API-Routen
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);

// einfache Health-Route zum Testen
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

