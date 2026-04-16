const router = require('express').Router();
const auth = require('../middleware/auth');
const DailyChallenge = require('../models/DailyChallenge');
const User = require('../models/User');
const dayjs = require('dayjs');

// Get today's challenge status for the user
router.get('/', auth, async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const challenges = await DailyChallenge.find({ userId: req.user.id, date: today }).lean();
    const user = await User.findById(req.user.id).select('xp').lean();
    res.json({ challenges, xp: user?.xp || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Complete a challenge (award XP)
router.post('/complete', auth, async (req, res) => {
  try {
    const { challengeId, xp } = req.body;
    const today = dayjs().format('YYYY-MM-DD');
    const xpAmount = Math.min(parseInt(xp, 10) || 0, 100);

    const existing = await DailyChallenge.findOne({
      userId: req.user.id,
      date: today,
      challengeId,
    });

    if (existing?.completed) {
      return res.json({ alreadyCompleted: true, xp: (await User.findById(req.user.id).select('xp').lean())?.xp || 0 });
    }

    await DailyChallenge.findOneAndUpdate(
      { userId: req.user.id, date: today, challengeId },
      {
        $set: { completed: true, xpAwarded: xpAmount, completedAt: new Date() },
        $setOnInsert: { userId: req.user.id, date: today, challengeId },
      },
      { upsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { $inc: { xp: xpAmount } });
    const user = await User.findById(req.user.id).select('xp').lean();

    res.json({ completed: true, xpAwarded: xpAmount, totalXP: user?.xp || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Manually mark a bonus challenge done (self-reported)
router.post('/self-report', auth, async (req, res) => {
  try {
    const { challengeId, xp } = req.body;
    const today = dayjs().format('YYYY-MM-DD');
    const xpAmount = Math.min(parseInt(xp, 10) || 0, 100);

    const existing = await DailyChallenge.findOne({
      userId: req.user.id,
      date: today,
      challengeId,
    });

    if (existing?.completed) {
      return res.json({ alreadyCompleted: true });
    }

    await DailyChallenge.findOneAndUpdate(
      { userId: req.user.id, date: today, challengeId },
      {
        $set: { completed: true, xpAwarded: xpAmount, completedAt: new Date() },
        $setOnInsert: { userId: req.user.id, date: today, challengeId },
      },
      { upsert: true }
    );

    await User.findByIdAndUpdate(req.user.id, { $inc: { xp: xpAmount } });
    const user = await User.findById(req.user.id).select('xp').lean();

    res.json({ completed: true, xpAwarded: xpAmount, totalXP: user?.xp || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Undo a challenge completion (deduct XP)
router.post('/undo', auth, async (req, res) => {
  try {
    const { challengeId } = req.body;
    const today = dayjs().format('YYYY-MM-DD');

    const existing = await DailyChallenge.findOne({
      userId: req.user.id,
      date: today,
      challengeId,
    });

    if (!existing || !existing.completed) {
      return res.json({ notFound: true });
    }

    const xpToDeduct = existing.xpAwarded || 0;

    await DailyChallenge.deleteOne({ _id: existing._id });

    if (xpToDeduct > 0) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { xp: -xpToDeduct },
      });
    }

    // Ensure XP never goes below 0
    const user = await User.findById(req.user.id).select('xp').lean();
    if ((user?.xp || 0) < 0) {
      await User.findByIdAndUpdate(req.user.id, { $set: { xp: 0 } });
    }

    const finalUser = await User.findById(req.user.id).select('xp').lean();
    res.json({ undone: true, xpDeducted: xpToDeduct, totalXP: finalUser?.xp || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get XP history / stats
router.get('/xp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('xp').lean();
    if (!user) return res.json({ xp: 0, last7: [] });
    const mongoose = require('mongoose');
    const last7 = await DailyChallenge.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          completed: true,
          date: { $gte: dayjs().subtract(7, 'day').format('YYYY-MM-DD') },
        },
      },
      { $group: { _id: '$date', totalXP: { $sum: '$xpAwarded' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ xp: user.xp || 0, last7 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
