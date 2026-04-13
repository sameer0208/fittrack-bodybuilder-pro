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
    // Destructure only the fields the schema accepts — ignore extra client fields
    // (e.g. exerciseLogs, savedAt, sessionKey) that can confuse Mongoose casting
    const {
      workoutDay,
      workoutName,
      exercises,
      duration,
      notes,
      completed,
      bodyWeight,
      mood,
    } = req.body;

    // Sanitise each set so types always match the schema (strings → numbers)
    const sanitisedExercises = Array.isArray(exercises)
      ? exercises.map((ex, ei) => ({
          exerciseId: String(ex.exerciseId || `exercise_${ei}`),
          exerciseName: String(ex.exerciseName || ex.exerciseId || 'Unknown'),
          completed: Boolean(ex.completed),
          notes: ex.notes || '',
          sets: Array.isArray(ex.sets)
            ? ex.sets.map((s, si) => ({
                setNumber: parseInt(s.setNumber, 10) || si + 1,
                weight: parseFloat(s.weight) || 0,
                reps: parseInt(s.reps, 10) || 0,
                completed: Boolean(s.completed),
              }))
            : [],
        }))
      : [];

    const { weekStart, weekEnd } = getCurrentWeekRange();

    let log = await WorkoutLog.findOne({
      userId: req.user.id,
      workoutDay,
      date: { $gte: weekStart, $lt: weekEnd },
    });

    if (log) {
      log.exercises  = sanitisedExercises;
      log.duration   = duration   != null ? Number(duration)   : log.duration;
      log.notes      = notes      != null ? String(notes)      : log.notes;
      log.completed  = completed  != null ? Boolean(completed) : log.completed;
      log.bodyWeight = bodyWeight != null ? Number(bodyWeight) : log.bodyWeight;
      log.mood       = mood       || log.mood;
    } else {
      log = new WorkoutLog({
        userId:    req.user.id,
        workoutDay,
        workoutName: workoutName || '',
        exercises:   sanitisedExercises,
        duration:    duration   != null ? Number(duration)   : undefined,
        notes:       notes      != null ? String(notes)      : '',
        completed:   Boolean(completed),
        bodyWeight:  bodyWeight != null ? Number(bodyWeight) : undefined,
        mood:        mood       || 'good',
      });
    }

    await log.save();

    // Update streak & total workouts when workout is marked complete
    if (completed) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.totalWorkouts = (user.totalWorkouts || 0) + 1;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        user.streak = user.lastWorkoutDate >= yesterday
          ? (user.streak || 0) + 1
          : 1;
        user.lastWorkoutDate = now;
        await user.save();
      }
    }

    res.json(log);
  } catch (err) {
    // Log full error on the server so it appears in Render logs
    console.error('[POST /workouts/log] Error:', err);
    res.status(500).json({ message: err.message, stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined });
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

// Get this week's workout log for a given session
router.get('/today/:workoutDay', auth, async (req, res) => {
  try {
    const { weekStart, weekEnd } = getCurrentWeekRange();

    const log = await WorkoutLog.findOne({
      userId: req.user.id,
      workoutDay: req.params.workoutDay,
      date: { $gte: weekStart, $lt: weekEnd },
    });
    res.json(log || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Batch: get completion status for ALL sessions this week
router.get('/week-status', auth, async (req, res) => {
  try {
    const { weekStart, weekEnd } = getCurrentWeekRange();

    const logs = await WorkoutLog.find({
      userId: req.user.id,
      date: { $gte: weekStart, $lt: weekEnd },
    }).lean();

    const status = {};
    for (const log of logs) {
      status[log.workoutDay] = {
        completed: log.completed,
        duration: log.duration,
        totalVolume: log.totalVolume,
        date: log.date,
      };
    }
    res.json(status);
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

// Returns { weekStart (Monday 00:00), weekEnd (next Monday 00:00) } for the current week
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun .. 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  return { weekStart: monday, weekEnd: nextMonday };
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return `${d.getFullYear()}-W${String(1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0')}`;
}

module.exports = router;
