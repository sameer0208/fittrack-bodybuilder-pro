const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CustomWorkout = require('../models/CustomWorkout');

// Get all customizations for the current user
router.get('/', auth, async (req, res) => {
  try {
    const docs = await CustomWorkout.find({ userId: req.user.id }).lean();
    const map = {};
    docs.forEach((d) => { map[d.sessionKey] = { added: d.added, removed: d.removed, customName: d.customName || '' }; });
    res.json(map);
  } catch (err) {
    console.error('[CustomWorkout] GET error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get customization for a single session
router.get('/:sessionKey', auth, async (req, res) => {
  try {
    const doc = await CustomWorkout.findOne({ userId: req.user.id, sessionKey: req.params.sessionKey }).lean();
    res.json(doc ? { added: doc.added, removed: doc.removed, customName: doc.customName || '' } : { added: [], removed: [], customName: '' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save customization for a session (full replace of added/removed arrays)
router.put('/:sessionKey', auth, async (req, res) => {
  try {
    const { added = [], removed = [], customName } = req.body;
    const update = { added, removed };
    if (customName !== undefined) update.customName = customName;
    const doc = await CustomWorkout.findOneAndUpdate(
      { userId: req.user.id, sessionKey: req.params.sessionKey },
      { $set: update },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ added: doc.added, removed: doc.removed, customName: doc.customName || '' });
  } catch (err) {
    console.error('[CustomWorkout] PUT error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Reset a session back to default
router.delete('/:sessionKey', auth, async (req, res) => {
  try {
    await CustomWorkout.deleteOne({ userId: req.user.id, sessionKey: req.params.sessionKey });
    res.json({ message: 'Reset to default' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
