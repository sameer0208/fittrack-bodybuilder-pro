const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SleepLog = require('../models/SleepLog');
const DailyCheckIn = require('../models/DailyCheckIn');

// ── Sleep ──────────────────────────────────────────────────────────────────

router.post('/sleep', auth, async (req, res) => {
  try {
    const { date, bedtime, wakeTime, quality, notes } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    let durationHours = 0;
    if (bedtime && wakeTime) {
      const [bH, bM] = bedtime.split(':').map(Number);
      const [wH, wM] = wakeTime.split(':').map(Number);
      let diff = (wH * 60 + wM) - (bH * 60 + bM);
      if (diff < 0) diff += 24 * 60;
      durationHours = Math.round((diff / 60) * 10) / 10;
    }

    const log = await SleepLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { $set: { bedtime, wakeTime, durationHours, quality, notes } },
      { upsert: true, returnDocument: 'after' }
    );
    res.json(log);
  } catch (err) {
    console.error('[Health] Sleep error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/sleep', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const logs = await SleepLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(Number(days))
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Daily Check-In ─────────────────────────────────────────────────────────

router.post('/checkin', auth, async (req, res) => {
  try {
    const { date, mood, energy, soreness, notes } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });

    const log = await DailyCheckIn.findOneAndUpdate(
      { userId: req.user.id, date },
      { $set: { mood, energy, soreness, notes } },
      { upsert: true, returnDocument: 'after' }
    );
    res.json(log);
  } catch (err) {
    console.error('[Health] Check-in error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/checkin', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const logs = await DailyCheckIn.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(Number(days))
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
