const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const BuddyPair = require('../models/BuddyPair');
const crypto = require('crypto');

// ── Leaderboard ────────────────────────────────────────────────────────────

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { type = 'streak' } = req.query;
    const users = await User.find({ leaderboardOptIn: true })
      .select('name streak totalWorkouts currentWeight programStartDate')
      .lean();

    let ranked;
    if (type === 'streak') {
      ranked = users.sort((a, b) => b.streak - a.streak);
    } else if (type === 'volume') {
      const volumeMap = {};
      for (const u of users) {
        const agg = await WorkoutLog.aggregate([
          { $match: { userId: u._id, completed: true } },
          { $group: { _id: null, total: { $sum: '$totalVolume' } } },
        ]);
        volumeMap[u._id] = agg[0]?.total || 0;
      }
      ranked = users.sort((a, b) => (volumeMap[b._id] || 0) - (volumeMap[a._id] || 0));
      ranked = ranked.map((u) => ({ ...u, totalVolume: volumeMap[u._id] || 0 }));
    } else {
      ranked = users.sort((a, b) => b.totalWorkouts - a.totalWorkouts);
    }

    const board = ranked.slice(0, 20).map((u, i) => ({
      rank: i + 1,
      displayName: u.name ? `${u.name.split(' ')[0]} ${u.name.split(' ')[1]?.[0] || ''}`.trim() : 'Athlete',
      streak: u.streak || 0,
      totalWorkouts: u.totalWorkouts || 0,
      totalVolume: u.totalVolume || undefined,
      isYou: u._id.toString() === req.user.id,
    }));

    res.json(board);
  } catch (err) {
    console.error('[Social] Leaderboard error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy System ───────────────────────────────────────────────────────────

router.post('/buddy/invite', auth, async (req, res) => {
  try {
    const existing = await BuddyPair.findOne({
      $or: [{ userA: req.user.id }, { userB: req.user.id }],
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      return res.json({ inviteCode: existing.inviteCode, status: existing.status });
    }
    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const pair = await BuddyPair.create({ userA: req.user.id, inviteCode });
    res.status(201).json({ inviteCode: pair.inviteCode, status: 'pending' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buddy/accept', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Invite code required' });

    const pair = await BuddyPair.findOne({ inviteCode: code.toUpperCase(), status: 'pending' });
    if (!pair) return res.status(404).json({ message: 'Invalid or expired invite code' });
    if (pair.userA.toString() === req.user.id) return res.status(400).json({ message: 'Cannot pair with yourself' });

    pair.userB = req.user.id;
    pair.status = 'active';
    await pair.save();
    res.json({ message: 'Buddy paired!', status: 'active' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/buddy', auth, async (req, res) => {
  try {
    const pair = await BuddyPair.findOne({
      $or: [{ userA: req.user.id }, { userB: req.user.id }],
      status: 'active',
    });
    if (!pair) return res.json({ paired: false });

    const buddyId = pair.userA.toString() === req.user.id ? pair.userB : pair.userA;
    const buddy = await User.findById(buddyId).select('name streak totalWorkouts currentWeight lastWorkoutDate').lean();
    if (!buddy) return res.json({ paired: false });

    res.json({
      paired: true,
      buddy: {
        name: buddy.name?.split(' ')[0] || 'Buddy',
        streak: buddy.streak || 0,
        totalWorkouts: buddy.totalWorkouts || 0,
        lastWorkoutDate: buddy.lastWorkoutDate,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/buddy', auth, async (req, res) => {
  try {
    await BuddyPair.updateMany(
      { $or: [{ userA: req.user.id }, { userB: req.user.id }], status: { $in: ['pending', 'active'] } },
      { $set: { status: 'removed' } }
    );
    res.json({ message: 'Buddy removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
