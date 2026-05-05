import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, rollNumber, department } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = await User.create({ email, password, role, name, rollNumber, department });
    const token = signToken(user._id.toString());
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name, rollNumber: user.rollNumber, department: user.department },
    });
  } catch (err) {
    res.status(400).json({ message: 'Registration failed', error: err });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user._id.toString());
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role, name: user.name, rollNumber: user.rollNumber, department: user.department },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
