const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const socialRoutes = require('./social');

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
      elapsedSeconds,
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
      log.exercises      = sanitisedExercises;
      log.duration       = duration        != null ? Number(duration)        : log.duration;
      log.elapsedSeconds = elapsedSeconds  != null ? Number(elapsedSeconds)  : log.elapsedSeconds;
      log.notes          = notes           != null ? String(notes)           : log.notes;
      log.completed      = completed       != null ? Boolean(completed)      : log.completed;
      log.bodyWeight     = bodyWeight      != null ? Number(bodyWeight)      : log.bodyWeight;
      log.mood           = mood            || log.mood;
    } else {
      log = new WorkoutLog({
        userId:    req.user.id,
        workoutDay,
        workoutName:    workoutName || '',
        exercises:      sanitisedExercises,
        duration:       duration        != null ? Number(duration)        : undefined,
        elapsedSeconds: elapsedSeconds  != null ? Number(elapsedSeconds)  : undefined,
        notes:          notes           != null ? String(notes)           : '',
        completed:      Boolean(completed),
        bodyWeight:     bodyWeight      != null ? Number(bodyWeight)      : undefined,
        mood:           mood            || 'good',
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

        // Log buddy activity to ALL buddies + update challenge scores (fire-and-forget)
        const vol = log.totalVolume ? `${Math.round(log.totalVolume).toLocaleString()}kg volume` : '';
        const dur = duration ? `${duration} min` : '';
        const detail = [workoutName, vol, dur].filter(Boolean).join(' · ');
        socialRoutes.logActivityToAllBuddies(req.user.id, 'workout_completed',
          `${user.name || 'Your buddy'} completed a workout! ${detail}`,
          { workoutName, totalVolume: log.totalVolume, duration }
        ).catch(() => {});

        if (user.streak > 0 && user.streak % 7 === 0) {
          socialRoutes.logActivityToAllBuddies(req.user.id, 'streak_milestone',
            `${user.name || 'Your buddy'} hit a ${user.streak}-day streak! 🔥`,
            { streak: user.streak }
          ).catch(() => {});
        }

        socialRoutes.updateBuddyChallengeScores(req.user.id).catch(() => {});
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

// Batch: get completion status for ALL sessions in a week
// ?weekOf=YYYY-MM-DD to query a specific week (defaults to current week)
router.get('/week-status', auth, async (req, res) => {
  try {
    const { weekStart, weekEnd } = getCurrentWeekRange(req.query.weekOf);

    const logs = await WorkoutLog.find({
      userId: req.user.id,
      date: { $gte: weekStart, $lt: weekEnd },
    }).lean();

    const sessions = {};
    for (const log of logs) {
      sessions[log.workoutDay] = {
        completed: log.completed,
        duration: log.duration,
        elapsedSeconds: log.elapsedSeconds,
        totalVolume: log.totalVolume,
        date: log.date,
        mood: log.mood,
        notes: log.notes,
        workoutName: log.workoutName,
        exercises: log.exercises,
      };
    }
    res.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalLogs: logs.length,
      sessions,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Earliest workout date (used to bound backward navigation)
router.get('/earliest', auth, async (req, res) => {
  try {
    const earliest = await WorkoutLog.findOne({ userId: req.user.id })
      .sort({ date: 1 })
      .select('date')
      .lean();
    res.json({ earliestDate: earliest?.date || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Calendar: get completed workout dates for a given month
router.get('/calendar/:year/:month', auth, async (req, res) => {
  try {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10); // 1-indexed

    // Use wide date boundaries: start from day 0 of the month (= last day of prev month)
    // and go up to day 1 of the next-next month, so timezone offsets never clip real data.
    // Then map dates to local calendar days on the server side.
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end   = new Date(year, month, 1, 0, 0, 0, 0);

    // Also search with UTC-based boundaries in case server & DB timezones differ
    const utcStart = new Date(Date.UTC(year, month - 1, 1));
    const utcEnd   = new Date(Date.UTC(year, month, 1));

    // Use the wider of the two ranges to ensure we capture all logs
    const qStart = utcStart < start ? utcStart : start;
    const qEnd   = utcEnd > end ? utcEnd : end;

    const logs = await WorkoutLog.find({
      userId: req.user.id,
      completed: true,
      date: { $gte: qStart, $lt: qEnd },
    }).select('date workoutDay workoutName totalVolume duration').lean();

    const days = {};
    for (const log of logs) {
      const d = new Date(log.date);
      // Use local date for grouping (matches what the user sees)
      const localDay = d.getDate();
      const localMonth = d.getMonth() + 1;
      const localYear = d.getFullYear();

      // Only include if the local date actually falls in the requested month
      if (localYear !== year || localMonth !== month) continue;

      if (!days[localDay]) days[localDay] = [];
      days[localDay].push({
        workoutDay: log.workoutDay,
        workoutName: log.workoutName,
        totalVolume: log.totalVolume,
        duration: log.duration,
      });
    }

    res.json({ year, month, days });
  } catch (err) {
    console.error('[Calendar] Error:', err.message);
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

// Returns { weekStart (Monday 00:00 local), weekEnd (next Monday 00:00 local) }
// Optional: pass a YYYY-MM-DD string to get that date's week instead of the current one.
function getCurrentWeekRange(ofDate) {
  let d;
  if (ofDate && typeof ofDate === 'string') {
    // Parse YYYY-MM-DD as LOCAL date (not UTC) by using the Date(y,m,d) constructor.
    // new Date('YYYY-MM-DD') creates UTC midnight which shifts getDay() in non-UTC zones.
    const parts = ofDate.split('-');
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = new Date();
  }

  const day = d.getDay(); // 0=Sun .. 6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday, 0, 0, 0, 0);
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
