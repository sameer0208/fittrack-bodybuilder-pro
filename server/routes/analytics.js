const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NutritionLog = require('../models/NutritionLog');
const SleepLog = require('../models/SleepLog');
const dayjs = require('dayjs');

// ── Weekly Report ──────────────────────────────────────────────────────────

router.get('/weekly-report', auth, async (req, res) => {
  try {
    const { weekOffset = 0 } = req.query;
    const weekStart = dayjs().subtract(Number(weekOffset), 'week').startOf('week');
    const weekEnd = weekStart.endOf('week');
    const prevStart = weekStart.subtract(1, 'week');
    const prevEnd = weekStart.subtract(1, 'day').endOf('day');

    const user = await User.findById(req.user.id).lean();

    const [workouts, prevWorkouts] = await Promise.all([
      WorkoutLog.find({
        userId: req.user.id,
        completed: true,
        date: { $gte: weekStart.toDate(), $lte: weekEnd.toDate() },
      }).lean(),
      WorkoutLog.find({
        userId: req.user.id,
        completed: true,
        date: { $gte: prevStart.toDate(), $lte: prevEnd.toDate() },
      }).lean(),
    ]);

    const dates = [];
    for (let d = weekStart; d.isBefore(weekEnd); d = d.add(1, 'day')) {
      dates.push(d.format('YYYY-MM-DD'));
    }

    const [nutritionLogs, sleepLogs] = await Promise.all([
      NutritionLog.find({ userId: req.user.id, date: { $in: dates } }).lean(),
      SleepLog.find({ userId: req.user.id, date: { $in: dates } }).lean(),
    ]);

    const totalCals = nutritionLogs.reduce((s, n) => {
      const mealCals = (n.meals || []).reduce((ms, m) =>
        ms + (m.foods || []).reduce((fs, f) => fs + (f.calories || 0), 0), 0);
      return s + mealCals;
    }, 0);
    const daysWithFood = nutritionLogs.filter((n) => (n.meals || []).some((m) => m.foods?.length)).length;
    const avgCals = daysWithFood ? Math.round(totalCals / daysWithFood) : 0;

    const waterDays = nutritionLogs.filter((n) => n.waterMl >= (n.waterGoalMl || 3000)).length;

    const avgSleep = sleepLogs.length
      ? Math.round((sleepLogs.reduce((s, l) => s + (l.durationHours || 0), 0) / sleepLogs.length) * 10) / 10
      : null;

    const totalVolume = workouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
    const prevVolume = prevWorkouts.reduce((s, w) => s + (w.totalVolume || 0), 0);

    res.json({
      weekStart: weekStart.format('YYYY-MM-DD'),
      weekEnd: weekEnd.format('YYYY-MM-DD'),
      workoutsCompleted: workouts.length,
      prevWorkoutsCompleted: prevWorkouts.length,
      avgCalories: avgCals,
      waterAdherenceDays: waterDays,
      totalDays: dates.length,
      totalVolume,
      prevVolume,
      avgSleepHours: avgSleep,
      currentWeight: user?.currentWeight,
      streak: user?.streak || 0,
    });
  } catch (err) {
    console.error('[Analytics] Weekly report error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── Volume Progression ─────────────────────────────────────────────────────

router.get('/volume-progression', auth, async (req, res) => {
  try {
    const { exerciseId } = req.query;
    if (!exerciseId) return res.status(400).json({ message: 'exerciseId required' });

    const logs = await WorkoutLog.find({ userId: req.user.id, completed: true })
      .sort({ date: 1 })
      .lean();

    const dataPoints = [];
    for (const log of logs) {
      const ex = (log.exercises || []).find((e) => e.exerciseId === exerciseId);
      if (!ex) continue;
      const vol = (ex.sets || [])
        .filter((s) => s.completed)
        .reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
      const maxWeight = Math.max(...(ex.sets || []).filter((s) => s.completed).map((s) => s.weight || 0), 0);
      dataPoints.push({
        date: dayjs(log.date).format('MMM D'),
        fullDate: dayjs(log.date).format('YYYY-MM-DD'),
        volume: vol,
        maxWeight,
      });
    }

    res.json(dataPoints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Muscle Balance ─────────────────────────────────────────────────────────

router.get('/muscle-balance', auth, async (req, res) => {
  try {
    const weekStart = dayjs().startOf('week').toDate();
    const logs = await WorkoutLog.find({
      userId: req.user.id,
      completed: true,
      date: { $gte: weekStart },
    }).lean();

    const muscleHits = {};
    for (const log of logs) {
      for (const ex of log.exercises || []) {
        if (!ex.completed) continue;
        const name = ex.exerciseName || ex.exerciseId;
        muscleHits[name] = (muscleHits[name] || 0) + 1;
      }
    }

    res.json(muscleHits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Goal Forecasting ───────────────────────────────────────────────────────

router.get('/forecast', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const history = user.weightHistory || [];
    if (history.length < 2) {
      return res.json({ message: 'Need at least 2 weight entries to forecast', data: null });
    }

    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const daysDiff = dayjs(last.date).diff(dayjs(first.date), 'day') || 1;
    const weightChange = last.weight - first.weight;
    const ratePerDay = weightChange / daysDiff;
    const ratePerWeek = Math.round(ratePerDay * 7 * 100) / 100;

    const remaining = user.targetWeight - user.currentWeight;
    let projectedDate = null;
    if (ratePerDay > 0 && remaining > 0) {
      const daysNeeded = Math.ceil(remaining / ratePerDay);
      projectedDate = dayjs().add(daysNeeded, 'day').format('YYYY-MM-DD');
    }

    res.json({
      startWeight: first.weight,
      currentWeight: user.currentWeight,
      targetWeight: user.targetWeight,
      ratePerWeek,
      projectedDate,
      weightHistory: sorted.map((w) => ({
        date: dayjs(w.date).format('MMM D'),
        weight: w.weight,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
