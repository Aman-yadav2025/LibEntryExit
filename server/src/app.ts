import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import pushRoutes from './routes/push';
import notificationRoutes from './routes/notifications';

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://lib-entry-exit.vercel.app',   // update this after Vercel deploys
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim().replace(/\/$/, '')] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl / server-side Next.js rewrites)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// Cleaned up duplicate routes!
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;