const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');

let webpush;
try {
  webpush = require('web-push');
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:fittrack@sameerproduction.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
} catch {
  console.warn('[Push] web-push not available');
}

router.get('/vapid-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY || '' });
});

router.post('/subscribe', auth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await PushSubscription.findOneAndUpdate(
      { userId: req.user.id, endpoint },
      { $set: { keys } },
      { upsert: true, returnDocument: 'after' }
    );
    res.json({ message: 'Subscribed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/unsubscribe', auth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteMany({ userId: req.user.id, ...(endpoint ? { endpoint } : {}) });
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Utility: send push to a user (used by reminder engine)
router.sendPushToUser = async function (userId, title, body) {
  if (!webpush) return;
  const subs = await PushSubscription.find({ userId }).lean();
  const payload = JSON.stringify({ title, body, icon: '/logo-icon.svg' });
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await PushSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
};

module.exports = router;
