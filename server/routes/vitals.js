const router = require('express').Router();
const auth = require('../middleware/auth');
const VitalLog = require('../models/VitalLog');

router.get('/', auth, async (req, res) => {
  try {
    const logs = await VitalLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(90)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { date, restingHR, systolic, diastolic, notes } = req.body;
    const log = await VitalLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { restingHR, systolic, diastolic, notes },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
