const router = require('express').Router();
const auth = require('../middleware/auth');
const StepLog = require('../models/StepLog');
const User = require('../models/User');

router.use(auth);

function estimateDistance(steps, heightCm) {
  const strideM = (heightCm || 170) * 0.00415;
  return parseFloat(((steps * strideM) / 1000).toFixed(2));
}

function estimateCalories(steps, weightKg) {
  return Math.round(steps * 0.04 * ((weightKg || 70) / 70));
}

// Save / update today's step log
router.post('/', async (req, res) => {
  try {
    const { date, steps, goal, hourly, activeMinutes, source } = req.body;
    const user = await User.findById(req.user.id).select('height currentWeight');
    const totalSteps = steps || 0;
    const distanceKm = estimateDistance(totalSteps, user?.height);
    const caloriesBurned = estimateCalories(totalSteps, user?.currentWeight);

    let peakHour = null;
    if (Array.isArray(hourly)) {
      const max = Math.max(...hourly);
      if (max > 0) peakHour = hourly.indexOf(max);
    }

    const log = await StepLog.findOneAndUpdate(
      { userId: req.user.id, date },
      {
        steps: totalSteps,
        goal: goal || 10000,
        distanceKm,
        caloriesBurned,
        activeMinutes: activeMinutes || 0,
        hourly: hourly || new Array(24).fill(0),
        peakHour,
        source: source || 'manual',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get today's log
router.get('/today/:date', async (req, res) => {
  try {
    const log = await StepLog.findOne({ userId: req.user.id, date: req.params.date }).lean();
    res.json(log || { steps: 0, goal: 10000, hourly: new Array(24).fill(0), distanceKm: 0, caloriesBurned: 0, activeMinutes: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// History (last N days)
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 90);
    const logs = await StepLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Weekly stats summary
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const d7 = new Date(now); d7.setDate(d7.getDate() - 7);
    const d30 = new Date(now); d30.setDate(d30.getDate() - 30);
    const fmt = (d) => d.toISOString().split('T')[0];

    const [week, month] = await Promise.all([
      StepLog.find({ userId: req.user.id, date: { $gte: fmt(d7) } }).lean(),
      StepLog.find({ userId: req.user.id, date: { $gte: fmt(d30) } }).lean(),
    ]);

    const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, l) => s + (l[key] || 0), 0) / arr.length) : 0;
    const total = (arr, key) => arr.reduce((s, l) => s + (l[key] || 0), 0);
    const best = (arr, key) => arr.length ? Math.max(...arr.map((l) => l[key] || 0)) : 0;
    const daysGoalMet = (arr) => arr.filter((l) => l.steps >= l.goal).length;

    res.json({
      week: {
        avgSteps: avg(week, 'steps'),
        totalSteps: total(week, 'steps'),
        totalDistance: parseFloat(total(week, 'distanceKm').toFixed(1)),
        totalCalories: total(week, 'caloriesBurned'),
        bestDay: best(week, 'steps'),
        daysGoalMet: daysGoalMet(week),
        totalDays: week.length,
      },
      month: {
        avgSteps: avg(month, 'steps'),
        totalSteps: total(month, 'steps'),
        totalDistance: parseFloat(total(month, 'distanceKm').toFixed(1)),
        totalCalories: total(month, 'caloriesBurned'),
        bestDay: best(month, 'steps'),
        daysGoalMet: daysGoalMet(month),
        totalDays: month.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
