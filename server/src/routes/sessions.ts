import { Router, Response } from 'express';
import Session from '../models/Session';
import Notification from '../models/Notification';
import { protect, restrictTo, AuthRequest } from '../middleware/authMiddleware';
import { sendPush } from '../services/pushService';

const router = Router();
router.use(protect);

// POST /api/sessions — Student creates pre-visit request
router.post('/', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const { belongings } = req.body;
    const session = await Session.create({
      student: req.user!._id,
      belongings: belongings || [],
      status: 'pending',
    });
    await session.populate('student', 'name email rollNumber department');
    res.status(201).json({ session });
  } catch (err) {
    res.status(400).json({ message: 'Failed to create session', error: err });
  }
});

// GET /api/sessions/mine — Student's own sessions
router.get('/mine', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ student: req.user!._id })
      .populate('guard', 'name')
      .sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/pending — Guard: pending entry requests
router.get('/pending', restrictTo('guard'), async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ status: 'pending' })
      .populate('student', 'name email rollNumber department')
      .sort({ createdAt: 1 });
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending sessions' });
  }
});

// GET /api/sessions/active — Guard: live occupancy
router.get('/active', restrictTo('guard'), async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ status: { $in: ['active', 'exiting'] } })
      .populate('student', 'name email rollNumber department')
      .sort({ entryTime: -1 });
    res.json({ sessions, count: sessions.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch active sessions' });
  }
});

// GET /api/sessions — Guard: all records (searchable)
router.get('/', restrictTo('guard'), async (req: AuthRequest, res: Response) => {
  try {
    const { q, status, date } = req.query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date as string);
      const end = new Date(date as string);
      end.setDate(end.getDate() + 1);
      filter.createdAt = { $gte: start, $lt: end };
    }

    let sessions = await Session.find(filter)
      .populate('student', 'name email rollNumber department')
      .populate('guard', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    if (q) {
      const qs = (q as string).toLowerCase();
      sessions = sessions.filter((s) => {
        const st = s.student as any;
        return (
          st?.name?.toLowerCase().includes(qs) ||
          st?.rollNumber?.toLowerCase().includes(qs) ||
          st?.email?.toLowerCase().includes(qs)
        );
      });
    }
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch records' });
  }
});

// GET /api/sessions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('student', 'name email rollNumber department')
      .populate('guard', 'name');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch session' });
  }
});

// PUT /api/sessions/:id/entry — Guard approves entry
router.put('/:id/entry', restrictTo('guard'), async (req: AuthRequest, res: Response) => {
  try {
    // Find first to capture studentId before populate replaces the ObjectId
    const raw = await Session.findById(req.params.id);
    if (!raw) return res.status(404).json({ message: 'Session not found' });
    const studentId = raw.student.toString();

    raw.status = 'active';
    raw.entryTime = new Date();
    raw.guard = req.user!._id as any;
    await raw.save();
    await raw.populate('student', 'name email rollNumber department');

    // CREATE IN-APP NOTIFICATION
    await Notification.create({
      student: studentId,
      title: '✅ Library Entry Confirmed',
      body: 'Your entry has been approved. Welcome to the library!',
      type: 'entry'
    });

    // Send push in background — never let it fail the response
    sendPush(studentId, '✅ Library Entry Confirmed', 'Your entry has been approved. Tap to acknowledge.').catch(console.error);
    res.json({ session: raw });
  } catch (err) {
    console.error('Entry error:', err);
    res.status(500).json({ message: 'Failed to approve entry' });
  }
});

// PUT /api/sessions/:id/belongings — Student edits belongings list
router.put('/:id/belongings', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, student: req.user!._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!['pending', 'active'].includes(session.status)) {
      return res.status(400).json({ message: 'Cannot edit belongings at this stage' });
    }

    console.log("--- START BELONGINGS UPDATE ---");

    // Map over incoming items from the frontend editing panel
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedBelongings = req.body.belongings.map((incomingItem: any) => {
      // SAFE CHECK: Ensure the incoming _id exists and is a valid 24-hex-character MongoDB ObjectId string
      const isValidObjectId = incomingItem._id && /^[0-9a-fA-F]{24}$/.test(incomingItem._id);
      
      const existingItem = isValidObjectId ? session.belongings.id(incomingItem._id) : null;

      if (existingItem) {
        // Strict matching: Trim spaces and ignore casing differences
        const oldDesc = existingItem.description.trim().toLowerCase();
        const newDesc = incomingItem.description.trim().toLowerCase();
        const oldType = existingItem.type;
        const newType = incomingItem.type;

        const isEdited = oldDesc !== newDesc || oldType !== newType;

        console.log(`Matching Item ID [${existingItem._id}]:`);
        console.log(`  - Old: "${oldDesc}" (${oldType})`);
        console.log(`  - New: "${newDesc}" (${newType})`);
        console.log(`  - Result: ${isEdited ? "EDITED (Reset to Red)" : "UNTOUCHED (Preserve Status)"}`);

        return {
          _id: existingItem._id, // Retain the same MongoDB Object ID
          description: incomingItem.description,
          type: incomingItem.type,
          // If edited, reset to unchecked. If untouched, preserve existing status (Yellow/Green).
          status: isEdited ? 'unchecked' : (existingItem.status || 'unchecked')
        };
      } else {
        console.log(`New Item Added (No ID or Invalid ID Match): "${incomingItem.description}" (Set to Red)`);
        return {
          description: incomingItem.description,
          type: incomingItem.type,
          status: 'unchecked'
        };
      }
    });

    console.log("Final array to save:", updatedBelongings);
    console.log("--- END BELONGINGS UPDATE ---");

    session.belongings = updatedBelongings as any;
    await session.save();
    res.json({ session });
  } catch (err) {
    console.error('Failed to update belongings:', err);
    res.status(500).json({ message: 'Failed to update belongings' });
  }
});

// PUT /api/sessions/:id/exit — Guard initiates exit check
router.put('/:id/exit', restrictTo('guard'), async (req: AuthRequest, res: Response) => {
  try {
    const raw = await Session.findById(req.params.id);
    if (!raw) return res.status(404).json({ message: 'Session not found' });
    const studentId = raw.student.toString();

    raw.status = 'exiting';
    await raw.save();
    await raw.populate('student', 'name email rollNumber department');

    // CREATE IN-APP NOTIFICATION
    await Notification.create({
      student: studentId,
      title: '🚪 Library Exit Request',
      body: 'The guard is checking your exit. Tap to confirm your belongings and exit.',
      type: 'exit'
    });

    sendPush(studentId, '🚪 Library Exit Request', 'The guard is checking your exit. Tap to confirm your belongings and exit.').catch(console.error);
    res.json({ session: raw });
  } catch (err) {
    console.error('Exit error:', err);
    res.status(500).json({ message: 'Failed to initiate exit' });
  }
});

// PUT /api/sessions/:id/exit-confirm — Student confirms exit
router.put('/:id/exit-confirm', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, student: req.user!._id, status: 'exiting' },
      { status: 'completed', exitTime: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'Session not found or not in exiting state' });

    // NEW FEATURE: SEND BULK NOTIFICATION CONFIRMING ALL ITEMS HAVE BEEN TAKEN OUT
    await Notification.create({
      student: req.user!._id,
      title: '🚪 Safe Library Exit',
      body: 'All checked belongings have been successfully taken out of the library. Session closed!',
      type: 'exit'
    });

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm exit' });
  }
});

// PUT /api/sessions/:id/flag — Guard flags mismatch
router.put('/:id/flag', restrictTo('guard'), async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'flagged', flagNotes: req.body.flagNotes || 'Belongings mismatch' },
      { new: true }
    ).populate('student', 'name email rollNumber department');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const studentId = (session.student as any)._id || session.student;

    // CREATE IN-APP NOTIFICATION
    await Notification.create({
      student: studentId,
      title: '⚠️ Library Session Flagged',
      body: `Your library session has been flagged. Notes: ${req.body.flagNotes || 'Belongings mismatch'}`,
      type: 'flag'
    });

    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: 'Failed to flag session' });
  }
});

// PUT /api/sessions/:id/belongings/approve-all — Guard approves all unchecked items at once
router.put('/:id/belongings/approve-all', restrictTo('guard'), async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let updatedCount = 0;
    const studentId = session.student.toString();

    // Map through and update all unchecked/new items to 'checked_by_guard'
    session.belongings.forEach((item) => {
      if (item.status === 'unchecked' || !item.status) {
        item.status = 'checked_by_guard';
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await session.save();
      
      // Dispatch batch-check warning notification
      await Notification.create({
        student: studentId,
        title: '⚠️ Multi-Item Verification Check',
        body: `The guard has verified all ${updatedCount} of your declared belongings. Tap to acknowledge them.`,
        type: 'entry'
      });
    }

    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to approve all items', error: err.message });
  }
});

// PUT /api/sessions/:id/belongings/acknowledge-all — Student acknowledges all checked items at once
router.put('/:id/belongings/acknowledge-all', restrictTo('student'), async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, student: req.user!._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    let updatedCount = 0;

    // Map through and update all guard-checked items to 'acknowledged'
    session.belongings.forEach((item) => {
      if (item.status === 'checked_by_guard') {
        item.status = 'acknowledged';
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await session.save();

      // Dispatch batch-approved notification
      await Notification.create({
        student: req.user!._id,
        title: '🎒 Belongings Secured',
        body: `All ${updatedCount} checked items have been successfully acknowledged and taken into the library.`,
        type: 'entry'
      });
    }

    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to acknowledge all items', error: err.message });
  }
});

// PUT /api/sessions/:id/belongings/:itemId/status — Update individual status + Dispatch Item Specific Notification
router.put('/:id/belongings/:itemId/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body; // Expects 'checked_by_guard' or 'acknowledged'
    
    if (!['checked_by_guard', 'acknowledged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' });
    }

    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const item = session.belongings.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Role-based security checks
    if (status === 'checked_by_guard' && req.user!.role !== 'guard') {
      return res.status(403).json({ message: 'Only guards can mark items as checked' });
    }

    if (status === 'acknowledged' && req.user!.role !== 'student') {
      return res.status(403).json({ message: 'Only the student can acknowledge items' });
    }

    // Apply individual item status update
    item.status = status;
    await session.save();

    const studentId = session.student.toString();

    // DYNAMIC IN-APP NOTIFICATIONS FOR APPROVAL/ACKNOWLEDGEMENT OF INDIVIDUAL ITEMS
    if (status === 'checked_by_guard') {
      await Notification.create({
        student: studentId,
        title: '✔️ Item Verification',
        body: `The ${item.type} named "${item.description}" has been verified by the guard.`,
        type: 'entry'
      });
    } else if (status === 'acknowledged') {
      await Notification.create({
        student: studentId,
        title: '🎒 Belonging Secured',
        body: `The item named "${item.description}" has been taken into the library.`,
        type: 'entry'
      });
    }

    res.json({ session });
  } catch (err: any) {
    console.error('Error updating item status:', err);
    res.status(500).json({ message: 'Failed to update item status', error: err.message });
  }
});

export default router;