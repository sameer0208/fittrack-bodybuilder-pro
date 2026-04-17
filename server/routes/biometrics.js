const router = require('express').Router();
const auth = require('../middleware/auth');
const BiometricScan = require('../models/BiometricScan');
const VitalLog = require('../models/VitalLog');
const DailyCheckIn = require('../models/DailyCheckIn');
const SleepLog = require('../models/SleepLog');
const dayjs = require('dayjs');

// Save a new biometric scan
router.post('/', auth, async (req, res) => {
  try {
    const scan = await BiometricScan.create({ userId: req.user.id, ...req.body });

    // Also update VitalLog with the heart rate
    if (scan.heartRate) {
      await VitalLog.findOneAndUpdate(
        { userId: req.user.id, date: scan.date },
        { restingHR: scan.heartRate },
        { upsert: true, new: true }
      );
    }

    res.json(scan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get scan history
router.get('/history', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 60, 120);
    const scans = await BiometricScan.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(scans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get the latest scan
router.get('/latest', auth, async (req, res) => {
  try {
    const scan = await BiometricScan.findOne({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(scan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get comprehensive wellness report
router.get('/report', auth, async (req, res) => {
  try {
    const scans = await BiometricScan.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(90)
      .lean();

    if (!scans.length) return res.json(null);

    const last7 = scans.filter((s) => dayjs(s.createdAt).isAfter(dayjs().subtract(7, 'day')));
    const last30 = scans.filter((s) => dayjs(s.createdAt).isAfter(dayjs().subtract(30, 'day')));
    const prev30 = scans.filter(
      (s) => dayjs(s.createdAt).isAfter(dayjs().subtract(60, 'day')) &&
             dayjs(s.createdAt).isBefore(dayjs().subtract(30, 'day'))
    );

    const avg = (arr, key) => {
      const vals = arr.filter((s) => s[key] != null).map((s) => s[key]);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };

    const trend = (current, previous) => {
      if (current == null || previous == null) return 'stable';
      const diff = current - previous;
      if (Math.abs(diff) < 2) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    // Autonomic balance score (0-100) derived from HRV + stress
    const avgHRV = avg(last7, 'hrvRMSSD');
    const avgStress = avg(last7, 'stressIndex');
    const avgSpO2 = avg(last7, 'spo2');
    const avgRR = avg(last7, 'respiratoryRate');
    const avgHR = avg(last7, 'heartRate');

    let autonomicScore = 50;
    if (avgHRV != null) {
      // Higher HRV = better (max around 80-100ms for healthy adults)
      autonomicScore = Math.min(100, Math.round((avgHRV / 80) * 50));
    }
    if (avgStress != null) {
      // Lower stress = better
      autonomicScore = Math.round((autonomicScore + (100 - avgStress)) / 2);
    }

    // Cardiovascular fitness indicator
    let cardioScore = 50;
    if (avgHR) {
      // Lower resting HR = fitter (50-60 excellent, 60-70 good, 70-80 average, 80+ poor)
      if (avgHR < 55) cardioScore = 95;
      else if (avgHR < 65) cardioScore = 80;
      else if (avgHR < 75) cardioScore = 65;
      else if (avgHR < 85) cardioScore = 45;
      else cardioScore = 30;
    }

    // Respiratory health indicator
    let respScore = 50;
    if (avgRR) {
      // Normal 12-20 breaths/min
      if (avgRR >= 12 && avgRR <= 18) respScore = 90;
      else if (avgRR > 18 && avgRR <= 22) respScore = 65;
      else if (avgRR < 12) respScore = 60;
      else respScore = 40;
    }

    // Oxygen score
    let oxygenScore = 50;
    if (avgSpO2) {
      if (avgSpO2 >= 97) oxygenScore = 95;
      else if (avgSpO2 >= 95) oxygenScore = 80;
      else if (avgSpO2 >= 93) oxygenScore = 60;
      else oxygenScore = 35;
    }

    // Overall wellness score (weighted composite)
    const weights = { cardio: 0.3, autonomic: 0.3, resp: 0.2, oxygen: 0.2 };
    const overallScore = Math.round(
      cardioScore * weights.cardio +
      autonomicScore * weights.autonomic +
      respScore * weights.resp +
      oxygenScore * weights.oxygen
    );

    // Correlate with sleep/checkin data
    const recentCheckIns = await DailyCheckIn.find({
      userId: req.user.id,
      date: { $gte: dayjs().subtract(7, 'day').format('YYYY-MM-DD') },
    }).lean();

    const recentSleep = await SleepLog.find({
      userId: req.user.id,
      date: { $gte: dayjs().subtract(7, 'day').format('YYYY-MM-DD') },
    }).lean();

    const avgMood = recentCheckIns.length
      ? Math.round((recentCheckIns.reduce((s, c) => s + (c.mood || 3), 0) / recentCheckIns.length) * 10) / 10
      : null;
    const avgSleep = recentSleep.length
      ? Math.round((recentSleep.reduce((s, c) => s + (c.hours || 0), 0) / recentSleep.length) * 10) / 10
      : null;

    // Build insights
    const insights = [];
    if (avgHRV != null && avgHRV < 25) {
      insights.push({ type: 'warning', text: 'Your HRV is low — consider more rest days, meditation, or reducing caffeine.' });
    } else if (avgHRV != null && avgHRV > 60) {
      insights.push({ type: 'success', text: 'Your HRV is excellent — your autonomic nervous system is well-balanced.' });
    }

    if (avgStress != null && avgStress > 70) {
      insights.push({ type: 'warning', text: 'High stress detected. Deep breathing exercises and better sleep can help.' });
    }

    if (avgSpO2 != null && avgSpO2 < 95) {
      insights.push({ type: 'warning', text: `Your SpO2 (${avgSpO2}%) is below the optimal range. Practice deep breathing or consult a doctor if persistent.` });
    }

    if (avgRR != null && avgRR > 20) {
      insights.push({ type: 'info', text: 'Your respiratory rate is slightly elevated. This may indicate stress or an oncoming cold.' });
    }

    if (avgHR != null && avgHR < 60) {
      insights.push({ type: 'success', text: `Resting HR of ${avgHR} bpm indicates strong cardiovascular fitness.` });
    } else if (avgHR != null && avgHR > 85) {
      insights.push({ type: 'warning', text: 'Elevated resting HR — check sleep quality and hydration.' });
    }

    // Trends
    const hrTrend = trend(avg(last7, 'heartRate'), avg(last30.slice(7), 'heartRate'));
    const hrvTrend = trend(avg(last7, 'hrvRMSSD'), avg(last30.slice(7), 'hrvRMSSD'));
    const stressTrend = trend(avg(last7, 'stressIndex'), avg(last30.slice(7), 'stressIndex'));
    const spo2Trend = trend(avg(last7, 'spo2'), avg(last30.slice(7), 'spo2'));

    res.json({
      totalScans: scans.length,
      latest: scans[0],
      overallScore,
      scores: { cardio: cardioScore, autonomic: autonomicScore, respiratory: respScore, oxygen: oxygenScore },
      averages: {
        week: { heartRate: avgHR, hrvRMSSD: avgHRV, stressIndex: avgStress, spo2: avgSpO2, respiratoryRate: avgRR },
        month: {
          heartRate: avg(last30, 'heartRate'),
          hrvRMSSD: avg(last30, 'hrvRMSSD'),
          stressIndex: avg(last30, 'stressIndex'),
          spo2: avg(last30, 'spo2'),
          respiratoryRate: avg(last30, 'respiratoryRate'),
        },
      },
      trends: { heartRate: hrTrend, hrvRMSSD: hrvTrend, stressIndex: stressTrend, spo2: spo2Trend },
      insights,
      correlations: { avgMood, avgSleep },
      chartData: last30.map((s) => ({
        date: dayjs(s.createdAt).format('M/D'),
        hr: s.heartRate,
        hrv: s.hrvRMSSD,
        stress: s.stressIndex,
        spo2: s.spo2,
        rr: s.respiratoryRate,
      })).reverse(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a scan
router.delete('/:id', auth, async (req, res) => {
  try {
    await BiometricScan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
