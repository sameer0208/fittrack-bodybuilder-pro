const router = require('express').Router();
const auth = require('../middleware/auth');
const SupplementLog = require('../models/SupplementLog');

router.get('/:date', auth, async (req, res) => {
  try {
    const log = await SupplementLog.findOne({ userId: req.user.id, date: req.params.date }).lean();
    res.json(log || { date: req.params.date, supplements: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const logs = await SupplementLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { date, supplements } = req.body;
    const log = await SupplementLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { supplements },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
