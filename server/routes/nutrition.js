const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const NutritionLog = require('../models/NutritionLog');

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

// Get or create today's nutrition log
router.get('/today', auth, async (req, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    let log = await NutritionLog.findOne({ userId: req.user.id, date });
    if (!log) {
      log = new NutritionLog({
        userId: req.user.id,
        date,
        meals: [],
        waterMl: 0,
      });
      await log.save();
    }
    res.json({ ...log.toObject(), totals: log.totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get log for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const log = await NutritionLog.findOne({ userId: req.user.id, date: req.params.date });
    if (!log) return res.json(null);
    res.json({ ...log.toObject(), totals: log.totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save full nutrition log for today (upsert)
router.post('/save', auth, async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const update = {
      meals: req.body.meals || [],
      waterMl: req.body.waterMl || 0,
      waterGoalMl: req.body.waterGoalMl || 3000,
      notes: req.body.notes || '',
      bodyWeight: req.body.bodyWeight,
    };
    const log = await NutritionLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { $set: update },
      { upsert: true, new: true }
    );
    res.json({ ...log.toObject(), totals: log.totals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get last 30 days of nutrition history
router.get('/history', auth, async (req, res) => {
  try {
    const logs = await NutritionLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(30);
    res.json(logs.map((l) => ({ date: l.date, totals: l.totals, waterMl: l.waterMl })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
