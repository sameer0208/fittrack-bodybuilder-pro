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
const { checkMessage } = require('../utils/contentFilter');

// ── Helper: get ALL active buddy pairs for a user ─────────────────────────
async function getActivePairs(userId) {
  const pairs = await BuddyPair.find({
    $or: [{ userA: userId }, { userB: userId }],
    status: 'active',
  });
  return pairs.map((pair) => {
    const buddyId = pair.userA.toString() === userId.toString() ? pair.userB : pair.userA;
    return { pair, buddyId };
  });
}

// Helper: get a specific active pair by pairId, verify user belongs to it
async function getPairById(pairId, userId) {
  const pair = await BuddyPair.findOne({ _id: pairId, status: 'active' });
  if (!pair) return null;
  const isA = pair.userA.toString() === userId.toString();
  const isB = pair.userB?.toString() === userId.toString();
  if (!isA && !isB) return null;
  const buddyId = isA ? pair.userB : pair.userA;
  return { pair, buddyId, isUserA: isA };
}

// Helper: log a buddy activity + push notify the target user
async function logBuddyActivity(userId, type, message, meta = {}) {
  try {
    await BuddyActivity.create({ userId, type, message, meta });
    const pushTitle = type === 'nudge' ? 'Buddy Nudge' : 'Buddy Activity';
    pushRoutes.sendPushToUser(userId, pushTitle, message).catch(() => {});
  } catch (e) {
    console.warn('[BuddyActivity] Failed to log:', e.message);
  }
}

// Helper: log activity to ALL buddies of a user
async function logActivityToAllBuddies(userId, type, message, meta = {}) {
  const pairs = await getActivePairs(userId);
  for (const { buddyId } of pairs) {
    await logBuddyActivity(buddyId, type, message, { ...meta, fromUserId: userId });
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

// ── Buddy: Invite (always generates a fresh code) ─────────────────────────

router.post('/buddy/invite', auth, async (req, res) => {
  try {
    const pending = await BuddyPair.findOne({ userA: req.user.id, status: 'pending' });
    if (pending) {
      return res.json({ inviteCode: pending.inviteCode, status: 'pending' });
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

    const alreadyPaired = await BuddyPair.findOne({
      $or: [
        { userA: req.user.id, userB: pair.userA, status: 'active' },
        { userA: pair.userA, userB: req.user.id, status: 'active' },
      ],
    });
    if (alreadyPaired) return res.status(400).json({ message: 'Already paired with this person' });

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

// ── Buddy: Get ALL buddies ────────────────────────────────────────────────

router.get('/buddy', auth, async (req, res) => {
  try {
    const results = await getActivePairs(req.user.id);
    if (results.length === 0) return res.json({ paired: false, buddies: [] });

    const { weekStart, weekEnd } = getWeekBounds();
    const me = await User.findById(req.user.id).select('streak totalWorkouts').lean();
    const myWeekWorkouts = await WorkoutLog.countDocuments({
      userId: req.user.id, completed: true, date: { $gte: weekStart, $lt: weekEnd },
    });

    const buddies = [];
    for (const { pair, buddyId } of results) {
      const buddy = await User.findById(buddyId)
        .select('name streak totalWorkouts currentWeight lastWorkoutDate fitnessGoal programStartDate')
        .lean();
      if (!buddy) continue;

      const lastWorkout = await WorkoutLog.findOne({ userId: buddyId, completed: true })
        .sort({ date: -1 }).select('workoutName totalVolume date duration').lean();

      const weekWorkouts = await WorkoutLog.countDocuments({
        userId: buddyId, completed: true, date: { $gte: weekStart, $lt: weekEnd },
      });

      buddies.push({
        pairId: pair._id,
        buddyId: buddyId,
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
      });
    }

    res.json({
      paired: buddies.length > 0,
      buddies,
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

// ── Buddy: Remove a specific pair ─────────────────────────────────────────

router.delete('/buddy/:pairId', auth, async (req, res) => {
  try {
    const { pairId } = req.params;
    await BuddyPair.updateOne(
      { _id: pairId, $or: [{ userA: req.user.id }, { userB: req.user.id }], status: 'active' },
      { $set: { status: 'removed' } }
    );
    res.json({ message: 'Buddy removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Keep legacy DELETE /buddy for backward compat (removes all)
router.delete('/buddy', auth, async (req, res) => {
  try {
    await BuddyPair.updateMany(
      { $or: [{ userA: req.user.id }, { userB: req.user.id }], status: { $in: ['pending', 'active'] } },
      { $set: { status: 'removed' } }
    );
    res.json({ message: 'All buddies removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Activity Feed (pair-specific) ──────────────────────────────────

router.get('/buddy/activity/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
    if (!result) return res.json([]);

    const activities = await BuddyActivity.find({ userId: result.buddyId })
      .sort({ createdAt: -1 }).limit(20).lean();

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Send Nudge (pair-specific) ─────────────────────────────────────

router.post('/buddy/nudge/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
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

// ── Buddy: Messages (pair-specific) ───────────────────────────────────────

router.get('/buddy/messages/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
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

router.post('/buddy/messages/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
    if (!result) return res.status(400).json({ message: 'No active buddy' });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message required' });

    const moderation = checkMessage(text.trim());
    if (!moderation.safe) {
      return res.status(422).json({ message: moderation.reason, blocked: true });
    }

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

router.get('/buddy/unread', auth, async (req, res) => {
  try {
    const results = await getActivePairs(req.user.id);
    if (results.length === 0) return res.json({ total: 0, perPair: {} });

    const perPair = {};
    let total = 0;
    for (const { pair, buddyId } of results) {
      const count = await BuddyMessage.countDocuments({
        pairId: pair._id, senderId: buddyId, read: false,
      });
      perPair[pair._id.toString()] = count;
      total += count;
    }

    res.json({ total, perPair });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Buddy: Weekly Challenge (pair-specific) ───────────────────────────────

router.get('/buddy/challenge/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
    if (!result) return res.json({ active: false });

    const { weekStart } = getWeekBounds();

    const challenge = await BuddyChallenge.findOne({
      pairId: result.pair._id, status: 'active',
      weekStart: { $gte: weekStart },
    });

    if (!challenge) return res.json({ active: false });

    res.json({
      active: true,
      challenge: {
        id: challenge._id,
        type: challenge.type,
        weekStart: challenge.weekStart,
        weekEnd: challenge.weekEnd,
        myScore: result.isUserA ? challenge.scoreA : challenge.scoreB,
        buddyScore: result.isUserA ? challenge.scoreB : challenge.scoreA,
        winner: challenge.winner,
        status: challenge.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/buddy/challenge/:pairId', auth, async (req, res) => {
  try {
    const result = await getPairById(req.params.pairId, req.user.id);
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

// ── Update challenge scores for ALL pairs (called internally after workout)

async function updateAllBuddyChallengeScores(userId) {
  try {
    const pairs = await getActivePairs(userId);
    if (pairs.length === 0) return;

    const { weekStart, weekEnd } = getWeekBounds();

    for (const { pair, buddyId } of pairs) {
      const challenge = await BuddyChallenge.findOne({
        pairId: pair._id, status: 'active',
        weekStart: { $gte: weekStart },
      });
      if (!challenge) continue;

      const isUserA = pair.userA.toString() === userId.toString();

      if (challenge.type === 'weekly_workouts') {
        const myCount = await WorkoutLog.countDocuments({ userId, completed: true, date: { $gte: weekStart, $lt: weekEnd } });
        const bCount = await WorkoutLog.countDocuments({ userId: buddyId, completed: true, date: { $gte: weekStart, $lt: weekEnd } });
        if (isUserA) { challenge.scoreA = myCount; challenge.scoreB = bCount; }
        else { challenge.scoreB = myCount; challenge.scoreA = bCount; }
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

      if (new Date() >= weekEnd) {
        challenge.status = 'completed';
        if (challenge.scoreA > challenge.scoreB) challenge.winner = pair.userA;
        else if (challenge.scoreB > challenge.scoreA) challenge.winner = pair.userB;
      }

      await challenge.save();
    }
  } catch (e) {
    console.warn('[BuddyChallenge] Score update error:', e.message);
  }
}

// Export helpers for use in other routes
router.logBuddyActivity = logBuddyActivity;
router.logActivityToAllBuddies = logActivityToAllBuddies;
router.updateBuddyChallengeScores = updateAllBuddyChallengeScores;
router.getActivePairs = getActivePairs;

module.exports = router;
