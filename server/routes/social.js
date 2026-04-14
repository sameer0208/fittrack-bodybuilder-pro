const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const BuddyPair = require('../models/BuddyPair');
const BuddyActivity = require('../models/BuddyActivity');
const BuddyMessage = require('../models/BuddyMessage');
const BuddyChallenge = require('../models/BuddyChallenge');
const crypto = require('crypto');
const pushRoutes = require('./push');

// ── Helper: get active buddy pair + buddy user ────────────────────────────
async function getActivePair(userId) {
  const pair = await BuddyPair.findOne({
    $or: [{ userA: userId }, { userB: userId }],
    status: 'active',
  });
  if (!pair) return null;
  const buddyId = pair.userA.toString() === userId.toString() ? pair.userB : pair.userA;
  return { pair, buddyId };
}

// Helper: log a buddy activity + push notify the target user
async function logBuddyActivity(userId, type, message, meta = {}) {
  try {
    await BuddyActivity.create({ userId, type, message, meta });
    // Fire push notification to the buddy (userId = the receiver)
    const pushTitle = type === 'nudge' ? 'Buddy Nudge' : 'Buddy Activity';
    pushRoutes.sendPushToUser(userId, pushTitle, message).catch(() => {});
  } catch (e) {
    console.warn('[BuddyActivity] Failed to log:', e.message);
  }
}

// Helper: current week boundaries (Mon 00:00 → Sun 23:59)
function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { weekStart: start, weekEnd: end };
}

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

// ── Buddy: Invite ─────────────────────────────────────────────────────────

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

// ── Buddy: Accept ─────────────────────────────────────────────────────────

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

    const userA = await User.findById(pair.userA).select('name').lean();
    const userB = await User.findById(req.user.id).select('name').lean();
    await logBuddyActivity(pair.userA, 'nudge', `${userB?.name || 'Your buddy'} accepted your invite! You're now paired.`);
    await logBuddyActivity(req.user.id, 'nudge', `You paired with ${userA?.name || 'a buddy'}! Let's crush it together.`);

    res.json({ message: 'Buddy paired!', status: 'active' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Get info (enhanced) ────────────────────────────────────────────

router.get('/buddy', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.json({ paired: false });

    const { pair, buddyId } = result;
    const buddy = await User.findById(buddyId)
      .select('name streak totalWorkouts currentWeight lastWorkoutDate fitnessGoal programStartDate')
      .lean();
    if (!buddy) return res.json({ paired: false });

    const lastWorkout = await WorkoutLog.findOne({ userId: buddyId, completed: true })
      .sort({ date: -1 }).select('workoutName totalVolume date duration').lean();

    const { weekStart, weekEnd } = getWeekBounds();
    const weekWorkouts = await WorkoutLog.countDocuments({
      userId: buddyId, completed: true, date: { $gte: weekStart, $lt: weekEnd },
    });

    const myWeekWorkouts = await WorkoutLog.countDocuments({
      userId: req.user.id, completed: true, date: { $gte: weekStart, $lt: weekEnd },
    });

    const me = await User.findById(req.user.id).select('streak totalWorkouts').lean();

    res.json({
      paired: true,
      pairId: pair._id,
      buddy: {
        name: buddy.name?.split(' ')[0] || 'Buddy',
        fullName: buddy.name || 'Buddy',
        streak: buddy.streak || 0,
        totalWorkouts: buddy.totalWorkouts || 0,
        lastWorkoutDate: buddy.lastWorkoutDate,
        fitnessGoal: buddy.fitnessGoal || 'bulk',
        lastWorkout: lastWorkout ? {
          name: lastWorkout.workoutName,
          volume: lastWorkout.totalVolume,
          date: lastWorkout.date,
          duration: lastWorkout.duration,
        } : null,
        weekWorkouts,
      },
      you: {
        streak: me?.streak || 0,
        totalWorkouts: me?.totalWorkouts || 0,
        weekWorkouts: myWeekWorkouts,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Remove ─────────────────────────────────────────────────────────

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

// ── Buddy: Activity Feed ──────────────────────────────────────────────────

router.get('/buddy/activity', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.json([]);

    const activities = await BuddyActivity.find({ userId: result.buddyId })
      .sort({ createdAt: -1 }).limit(20).lean();

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Send Nudge ─────────────────────────────────────────────────────

router.post('/buddy/nudge', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.status(400).json({ message: 'No active buddy' });

    const me = await User.findById(req.user.id).select('name').lean();
    const { type = 'general' } = req.body;

    const nudges = {
      workout: `${me?.name || 'Your buddy'} says: "Let's go! Time to hit the gym!" 💪`,
      motivation: `${me?.name || 'Your buddy'} sends motivation: "You've got this! Stay consistent!" 🔥`,
      competition: `${me?.name || 'Your buddy'} challenges you: "Bet I outwork you this week!" 🏆`,
      general: `${me?.name || 'Your buddy'} sent you a nudge! 👊`,
    };

    await logBuddyActivity(result.buddyId, 'nudge', nudges[type] || nudges.general, { fromUserId: req.user.id, nudgeType: type });
    res.json({ message: 'Nudge sent!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Messages ───────────────────────────────────────────────────────

router.get('/buddy/messages', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.json([]);

    const messages = await BuddyMessage.find({ pairId: result.pair._id })
      .sort({ createdAt: -1 }).limit(50).lean();

    await BuddyMessage.updateMany(
      { pairId: result.pair._id, senderId: result.buddyId, read: false },
      { $set: { read: true } }
    );

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buddy/messages', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.status(400).json({ message: 'No active buddy' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' });

    const msg = await BuddyMessage.create({
      pairId: result.pair._id,
      senderId: req.user.id,
      text: text.trim().slice(0, 500),
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/buddy/messages/unread', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.json({ count: 0 });

    const count = await BuddyMessage.countDocuments({
      pairId: result.pair._id, senderId: result.buddyId, read: false,
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Weekly Challenge ───────────────────────────────────────────────

router.get('/buddy/challenge', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.json({ active: false });

    const { weekStart, weekEnd } = getWeekBounds();

    let challenge = await BuddyChallenge.findOne({
      pairId: result.pair._id, status: 'active',
      weekStart: { $gte: weekStart },
    });

    if (!challenge) return res.json({ active: false });

    const isUserA = result.pair.userA.toString() === req.user.id;

    res.json({
      active: true,
      challenge: {
        id: challenge._id,
        type: challenge.type,
        weekStart: challenge.weekStart,
        weekEnd: challenge.weekEnd,
        myScore: isUserA ? challenge.scoreA : challenge.scoreB,
        buddyScore: isUserA ? challenge.scoreB : challenge.scoreA,
        winner: challenge.winner,
        status: challenge.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buddy/challenge', auth, async (req, res) => {
  try {
    const result = await getActivePair(req.user.id);
    if (!result) return res.status(400).json({ message: 'No active buddy' });

    const { weekStart, weekEnd } = getWeekBounds();

    const existing = await BuddyChallenge.findOne({
      pairId: result.pair._id, status: 'active',
      weekStart: { $gte: weekStart },
    });
    if (existing) return res.json({ message: 'Challenge already active', challenge: existing });

    const { type = 'weekly_workouts' } = req.body;

    const challenge = await BuddyChallenge.create({
      pairId: result.pair._id, type, weekStart, weekEnd,
    });

    const me = await User.findById(req.user.id).select('name').lean();
    const typeLabels = { weekly_workouts: 'Most Workouts', weekly_volume: 'Most Volume', weekly_streak: 'Longest Streak' };
    await logBuddyActivity(result.buddyId, 'nudge',
      `${me?.name || 'Your buddy'} started a weekly challenge: ${typeLabels[type] || type}! Game on! 🏆`,
      { challengeId: challenge._id }
    );

    res.status(201).json({ message: 'Challenge started!', challenge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Update challenge scores (called internally after workout) ──────

async function updateBuddyChallengeScores(userId) {
  try {
    const result = await getActivePair(userId);
    if (!result) return;

    const { weekStart, weekEnd } = getWeekBounds();
    const challenge = await BuddyChallenge.findOne({
      pairId: result.pair._id, status: 'active',
      weekStart: { $gte: weekStart },
    });
    if (!challenge) return;

    const isUserA = result.pair.userA.toString() === userId.toString();

    if (challenge.type === 'weekly_workouts') {
      const count = await WorkoutLog.countDocuments({
        userId, completed: true, date: { $gte: weekStart, $lt: weekEnd },
      });
      if (isUserA) challenge.scoreA = count; else challenge.scoreB = count;
    } else if (challenge.type === 'weekly_volume') {
      const agg = await WorkoutLog.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(userId.toString()), completed: true, date: { $gte: weekStart, $lt: weekEnd } } },
        { $group: { _id: null, total: { $sum: '$totalVolume' } } },
      ]);
      const vol = agg[0]?.total || 0;
      if (isUserA) challenge.scoreA = vol; else challenge.scoreB = vol;
    } else if (challenge.type === 'weekly_streak') {
      const user = await User.findById(userId).select('streak').lean();
      if (isUserA) challenge.scoreA = user?.streak || 0; else challenge.scoreB = user?.streak || 0;
    }

    // Also update buddy's score
    const buddyId = isUserA ? result.pair.userB : result.pair.userA;
    if (challenge.type === 'weekly_workouts') {
      const bCount = await WorkoutLog.countDocuments({
        userId: buddyId, completed: true, date: { $gte: weekStart, $lt: weekEnd },
      });
      if (isUserA) challenge.scoreB = bCount; else challenge.scoreA = bCount;
    }

    // Check if week ended
    if (new Date() >= weekEnd) {
      challenge.status = 'completed';
      if (challenge.scoreA > challenge.scoreB) challenge.winner = result.pair.userA;
      else if (challenge.scoreB > challenge.scoreA) challenge.winner = result.pair.userB;
    }

    await challenge.save();
  } catch (e) {
    console.warn('[BuddyChallenge] Score update error:', e.message);
  }
}

// Export helpers for use in other routes
router.logBuddyActivity = logBuddyActivity;
router.updateBuddyChallengeScores = updateBuddyChallengeScores;
router.getActivePair = getActivePair;

module.exports = router;
