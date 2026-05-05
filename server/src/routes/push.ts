import { Router, Response } from 'express';
import PushSubscription from '../models/PushSubscription';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);

// POST /api/push/subscribe
router.post('/subscribe', async (req: AuthRequest, res: Response) => {
  try {
    const { subscription } = req.body;
    await PushSubscription.findOneAndUpdate(
      { user: req.user!._id },
      { subscription },
      { upsert: true, new: true }
    );
    res.json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', async (req: AuthRequest, res: Response) => {
  try {
    await PushSubscription.deleteOne({ user: req.user!._id });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

// GET /api/push/vapid-public-key — client needs this to subscribe
router.get('/vapid-public-key', (_req, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

export default router;
