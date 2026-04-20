const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ZumbaLog = require('../models/ZumbaLog');

// POST /api/zumba/log — save a completed Zumba session
router.post('/log', auth, async (req, res) => {
  try {
    const { sessionId, sessionName, difficulty, duration, caloriesBurned, movesCompleted, totalMoves, completionPct, rating, styles, date } = req.body;

    const log = await ZumbaLog.findOneAndUpdate(
      { userId: req.user.id, date, sessionId },
      {
        userId: req.user.id,
        date,
        sessionId,
        sessionName,
        difficulty,
        duration,
        caloriesBurned,
        movesCompleted,
        totalMoves,
        completionPct,
        rating,
        styles,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, returnDocument: 'after' }
    );

    res.json(log);
  } catch (err) {
    console.error('Zumba log error:', err);
    res.status(500).json({ message: 'Failed to save Zumba session' });
  }
});

// GET /api/zumba/history — get recent session logs
router.get('/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await ZumbaLog.find({ userId: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// GET /api/zumba/stats — aggregated stats
router.get('/stats', auth, async (req, res) => {
  try {
    const logs = await ZumbaLog.find({ userId: req.user.id }).lean();

    if (!logs.length) {
      return res.json({
        totalSessions: 0,
        totalMinutes: 0,
        totalCalories: 0,
        avgRating: 0,
        favoriteStyle: null,
        streak: 0,
        byDifficulty: {},
        byStyle: {},
      });
    }

    const totalSessions = logs.length;
    const totalMinutes = logs.reduce((s, l) => s + (l.duration || 0), 0);
    const totalCalories = logs.reduce((s, l) => s + (l.caloriesBurned || 0), 0);
    const rated = logs.filter((l) => l.rating);
    const avgRating = rated.length ? +(rated.reduce((s, l) => s + l.rating, 0) / rated.length).toFixed(1) : 0;

    // Favorite style
    const styleCounts = {};
    logs.forEach((l) => (l.styles || []).forEach((s) => { styleCounts[s] = (styleCounts[s] || 0) + 1; }));
    const favoriteStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // By difficulty
    const byDifficulty = {};
    logs.forEach((l) => {
      if (!byDifficulty[l.difficulty]) byDifficulty[l.difficulty] = { count: 0, minutes: 0, calories: 0 };
      byDifficulty[l.difficulty].count++;
      byDifficulty[l.difficulty].minutes += l.duration || 0;
      byDifficulty[l.difficulty].calories += l.caloriesBurned || 0;
    });

    // Streak (consecutive days)
    const uniqueDates = [...new Set(logs.map((l) => l.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const exp = expected.toISOString().split('T')[0];
      if (uniqueDates[i] === exp) streak++;
      else break;
    }

    res.json({
      totalSessions,
      totalMinutes,
      totalCalories,
      avgRating,
      favoriteStyle,
      streak,
      byDifficulty,
      byStyle: styleCounts,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
