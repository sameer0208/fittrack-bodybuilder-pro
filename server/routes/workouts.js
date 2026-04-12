const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fittrack_secret_2024';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Save / update workout log
router.post('/log', auth, async (req, res) => {
  try {
    const { workoutDay, workoutName, exercises, duration, notes, completed, bodyWeight, mood } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let log = await WorkoutLog.findOne({
      userId: req.user.id,
      workoutDay,
      date: { $gte: today, $lt: tomorrow },
    });

    if (log) {
      log.exercises = exercises;
      log.duration = duration;
      log.notes = notes;
      log.completed = completed;
      log.bodyWeight = bodyWeight;
      log.mood = mood;
    } else {
      log = new WorkoutLog({
        userId: req.user.id,
        workoutDay, workoutName, exercises,
        duration, notes, completed, bodyWeight, mood,
      });
    }

    await log.save();

    if (completed) {
      const user = await User.findById(req.user.id);
      user.totalWorkouts += 1;

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (user.lastWorkoutDate >= yesterday) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastWorkoutDate = new Date();
      await user.save();
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all logs for user
router.get('/logs', auth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    const logs = await WorkoutLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get today's workout log
router.get('/today/:workoutDay', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const log = await WorkoutLog.findOne({
      userId: req.user.id,
      workoutDay: req.params.workoutDay,
      date: { $gte: today, $lt: tomorrow },
    });
    res.json(log || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get workout stats / progress
router.get('/stats', auth, async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ userId: req.user.id, completed: true }).sort({ date: 1 });

    const weeklyVolume = {};
    const completionByDay = {};
    let totalVolume = 0;

    logs.forEach((log) => {
      const week = getWeekNumber(log.date);
      if (!weeklyVolume[week]) weeklyVolume[week] = { week, volume: 0, workouts: 0, date: log.date };
      weeklyVolume[week].volume += log.totalVolume || 0;
      weeklyVolume[week].workouts += 1;
      totalVolume += log.totalVolume || 0;

      const day = log.workoutDay;
      if (!completionByDay[day]) completionByDay[day] = 0;
      completionByDay[day] += 1;
    });

    res.json({
      totalWorkouts: logs.length,
      totalVolume,
      weeklyVolume: Object.values(weeklyVolume).slice(-12),
      completionByDay,
      recentLogs: logs.slice(-5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return `${d.getFullYear()}-W${String(1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`;
}

module.exports = router;
