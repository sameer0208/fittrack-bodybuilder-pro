const router = require('express').Router();
const auth = require('../middleware/auth');
const PostureAssessment = require('../models/PostureAssessment');

router.get('/', auth, async (req, res) => {
  try {
    const logs = await PostureAssessment.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(12)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const fields = [
      'forwardHead', 'roundedShoulders', 'anteriorPelvicTilt',
      'touchToes', 'overheadSquat', 'ankleDorsiflexion',
    ];
    let score = 0;
    const negativeFields = ['forwardHead', 'roundedShoulders', 'anteriorPelvicTilt'];
    for (const f of fields) {
      const v = req.body[f];
      if (negativeFields.includes(f)) {
        if (v === 'no') score += 16.67;
        else if (v === 'unsure') score += 8;
      } else {
        if (v === 'yes') score += 16.67;
        else if (v === 'almost' || v === 'partial') score += 8;
        else if (v === 'unsure') score += 4;
      }
    }
    const log = await PostureAssessment.create({
      ...req.body,
      userId: req.user.id,
      overallScore: Math.round(score),
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
