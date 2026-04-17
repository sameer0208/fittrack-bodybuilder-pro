const router = require('express').Router();
const auth = require('../middleware/auth');
const InjuryLog = require('../models/InjuryLog');

router.get('/', auth, async (req, res) => {
  try {
    const logs = await InjuryLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(100)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/active', auth, async (req, res) => {
  try {
    const logs = await InjuryLog.find({
      userId: req.user.id,
      status: { $in: ['new', 'improving', 'chronic'] },
    })
      .sort({ date: -1 })
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const log = await InjuryLog.create({ ...req.body, userId: req.user.id });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const log = await InjuryLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await InjuryLog.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
