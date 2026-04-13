const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const BodyMeasurement = require('../models/BodyMeasurement');
const ProgressPhoto = require('../models/ProgressPhoto');
const BuddyPair = require('../models/BuddyPair');

const ACHIEVEMENT_DEFS = [
  { key: 'first_workout', name: 'First Workout', desc: 'Complete your first workout', tier: 'bronze', check: (u) => u.totalWorkouts >= 1 },
  { key: 'workouts_10', name: 'Getting Serious', desc: 'Complete 10 workouts', tier: 'bronze', check: (u) => u.totalWorkouts >= 10 },
  { key: 'workouts_25', name: 'Committed', desc: 'Complete 25 workouts', tier: 'silver', check: (u) => u.totalWorkouts >= 25 },
  { key: 'workouts_50', name: 'Half Century', desc: 'Complete 50 workouts', tier: 'silver', check: (u) => u.totalWorkouts >= 50 },
  { key: 'workouts_100', name: 'Centurion', desc: 'Complete 100 workouts', tier: 'gold', check: (u) => u.totalWorkouts >= 100 },
  { key: 'workouts_200', name: 'Iron Veteran', desc: 'Complete 200 workouts', tier: 'platinum', check: (u) => u.totalWorkouts >= 200 },
  { key: 'streak_3', name: 'Hat Trick', desc: '3-day workout streak', tier: 'bronze', check: (u) => u.streak >= 3 },
  { key: 'streak_7', name: 'Week Warrior', desc: '7-day workout streak', tier: 'bronze', check: (u) => u.streak >= 7 },
  { key: 'streak_14', name: 'Fortnight Fire', desc: '14-day workout streak', tier: 'silver', check: (u) => u.streak >= 14 },
  { key: 'streak_30', name: 'Monthly Beast', desc: '30-day workout streak', tier: 'gold', check: (u) => u.streak >= 30 },
  { key: 'streak_100', name: 'Unstoppable', desc: '100-day workout streak', tier: 'platinum', check: (u) => u.streak >= 100 },
  { key: 'weight_gained_5', name: 'Bulk Started', desc: 'Gain 5kg from starting weight', tier: 'silver', check: (u) => (u.currentWeight - (u.weightHistory?.[0]?.weight || u.currentWeight)) >= 5 },
  { key: 'weight_gained_10', name: 'Mass Monster', desc: 'Gain 10kg from starting weight', tier: 'gold', check: (u) => (u.currentWeight - (u.weightHistory?.[0]?.weight || u.currentWeight)) >= 10 },
  { key: 'target_reached', name: 'Goal Crusher', desc: 'Reach your target weight', tier: 'platinum', check: (u) => u.currentWeight >= u.targetWeight },
];

const ASYNC_DEFS = [
  {
    key: 'volume_10k', name: 'Volume Beast', desc: 'Lift 10,000kg total volume in a single workout', tier: 'silver',
    check: async (userId) => {
      const log = await WorkoutLog.findOne({ userId, totalVolume: { $gte: 10000 }, completed: true }).lean();
      return !!log;
    },
  },
  {
    key: 'volume_50k', name: 'Iron Mountain', desc: 'Lift 50,000kg total volume in a single workout', tier: 'gold',
    check: async (userId) => {
      const log = await WorkoutLog.findOne({ userId, totalVolume: { $gte: 50000 }, completed: true }).lean();
      return !!log;
    },
  },
  {
    key: 'logged_food_7', name: 'Nutrition Tracker', desc: 'Log food for 7 different days', tier: 'bronze',
    check: async (userId) => {
      const count = await NutritionLog.countDocuments({ userId });
      return count >= 7;
    },
  },
  {
    key: 'logged_food_30', name: 'Diet Devotee', desc: 'Log food for 30 different days', tier: 'silver',
    check: async (userId) => {
      const count = await NutritionLog.countDocuments({ userId });
      return count >= 30;
    },
  },
  {
    key: 'first_measurement', name: 'Measured Up', desc: 'Log your first body measurement', tier: 'bronze',
    check: async (userId) => {
      const m = await BodyMeasurement.findOne({ userId }).lean();
      return !!m;
    },
  },
  {
    key: 'first_photo', name: 'Say Cheese', desc: 'Upload your first progress photo', tier: 'bronze',
    check: async (userId) => {
      const p = await ProgressPhoto.findOne({ userId }).lean();
      return !!p;
    },
  },
  {
    key: 'buddy_paired', name: 'Gym Buddy', desc: 'Pair up with a workout buddy', tier: 'bronze',
    check: async (userId) => {
      const p = await BuddyPair.findOne({
        $or: [{ userA: userId }, { userB: userId }],
        status: 'active',
      }).lean();
      return !!p;
    },
  },
];

router.get('/', auth, async (req, res) => {
  try {
    const unlocked = await Achievement.find({ userId: req.user.id }).lean();
    res.json(unlocked);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/check', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existing = await Achievement.find({ userId: req.user.id }).lean();
    const existingKeys = new Set(existing.map((a) => a.key));
    const newlyUnlocked = [];

    for (const def of ACHIEVEMENT_DEFS) {
      if (existingKeys.has(def.key)) continue;
      if (def.check(user)) {
        await Achievement.findOneAndUpdate(
          { userId: req.user.id, key: def.key },
          { $setOnInsert: { userId: req.user.id, key: def.key } },
          { upsert: true, returnDocument: 'after' }
        );
        newlyUnlocked.push({ key: def.key, name: def.name, desc: def.desc, tier: def.tier });
      }
    }

    for (const def of ASYNC_DEFS) {
      if (existingKeys.has(def.key)) continue;
      const passed = await def.check(req.user.id);
      if (passed) {
        await Achievement.findOneAndUpdate(
          { userId: req.user.id, key: def.key },
          { $setOnInsert: { userId: req.user.id, key: def.key } },
          { upsert: true, returnDocument: 'after' }
        );
        newlyUnlocked.push({ key: def.key, name: def.name, desc: def.desc, tier: def.tier });
      }
    }

    res.json({ newlyUnlocked, total: existing.length + newlyUnlocked.length });
  } catch (err) {
    console.error('[Achievements] Check error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
