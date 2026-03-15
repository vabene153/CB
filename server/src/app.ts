import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

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

// einfache Health-Route zum Testen
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

