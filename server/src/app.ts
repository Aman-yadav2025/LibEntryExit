import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import pushRoutes from './routes/push';
import notificationRoutes from './routes/notifications';

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://lib-entry-exit.vercel.app' // ✨ Your exact Vercel URL
  ],
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