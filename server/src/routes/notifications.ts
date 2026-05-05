import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { protect, restrictTo, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(protect);

// GET /api/notifications — Fetch logged-in student's notifications
router.get('/', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ student: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PUT /api/notifications/:id/read — Mark a specific notification as read
router.put('/:id/read', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, student: req.user!._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// PUT /api/notifications/read-all — Mark all unread notifications as read
router.put('/read-all', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { student: req.user!._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

export default router;