const router = require('express').Router();
const auth = require('../middleware/auth');
const SleepLog = require('../models/SleepLog');
const DailyCheckIn = require('../models/DailyCheckIn');
const WorkoutLog = require('../models/WorkoutLog');
const VitalLog = require('../models/VitalLog');
const User = require('../models/User');
const NutritionLog = require('../models/NutritionLog');
const dayjs = require('dayjs');

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ── Recovery Readiness Score ───────────────────────────────────────────────
router.get('/readiness', auth, async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const past7 = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    const [sleepLogs, checkins, workoutLogs, user] = await Promise.all([
      SleepLog.find({ userId: req.user.id, date: { $gte: past7 } }).sort({ date: -1 }).lean(),
      DailyCheckIn.find({ userId: req.user.id, date: { $gte: past7 } }).sort({ date: -1 }).lean(),
      WorkoutLog.find({ userId: req.user.id, completed: true, createdAt: { $gte: new Date(past7) } }).sort({ createdAt: -1 }).lean(),
      User.findById(req.user.id).select('streak').lean(),
    ]);

    const todaySleep = sleepLogs.find((s) => s.date === today) || sleepLogs[0];
    const todayCheckin = checkins.find((c) => c.date === today) || checkins[0];

    const avgSleepHrs = mean(sleepLogs.filter((s) => s.durationHours > 0).map((s) => s.durationHours)) || 7;
    const sleepDuration = todaySleep?.durationHours || 0;
    const sleepQuality = todaySleep?.quality || 3;

    // Sleep score (0-30): compare to personal avg
    const sleepRatio = sleepDuration > 0 ? Math.min(sleepDuration / avgSleepHrs, 1.2) : 0;
    const sleepScore = Math.round(sleepRatio * 15 + (sleepQuality / 5) * 15);

    // Subjective score (0-30): mood + energy + inverse soreness
    const mood = todayCheckin?.mood || 3;
    const energy = todayCheckin?.energy || 3;
    const soreness = todayCheckin?.soreness || 1;
    const subjectiveScore = Math.round(((mood / 5) * 10) + ((energy / 5) * 10) + (((6 - soreness) / 5) * 10));

    // Training load score (0-25): penalize high recent volume
    const recentVolumes = workoutLogs.map((w) => w.totalVolume || 0);
    const avgVolume = mean(recentVolumes) || 1;
    const yesterdayLogs = workoutLogs.filter((w) => dayjs(w.createdAt).format('YYYY-MM-DD') === dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const yesterdayVolume = yesterdayLogs.reduce((s, w) => s + (w.totalVolume || 0), 0);
    const loadRatio = avgVolume > 0 ? yesterdayVolume / avgVolume : 0;
    const trainingScore = Math.round(Math.max(0, 25 - (loadRatio * 12)));

    // Streak fatigue (0-15): penalty if 7+ consecutive days
    const streak = user?.streak || 0;
    const streakScore = streak >= 10 ? 3 : streak >= 7 ? 8 : 15;

    const totalScore = Math.min(100, Math.max(0, sleepScore + subjectiveScore + trainingScore + streakScore));

    let label, color, advice;
    if (totalScore >= 80) { label = 'Excellent'; color = '#22c55e'; advice = 'Great day to push for a PR or go heavy!'; }
    else if (totalScore >= 60) { label = 'Good'; color = '#84cc16'; advice = 'Solid recovery — train normally.'; }
    else if (totalScore >= 40) { label = 'Moderate'; color = '#eab308'; advice = 'Consider moderate intensity today.'; }
    else { label = 'Low'; color = '#ef4444'; advice = 'Consider active recovery or a deload session.'; }

    const breakdown = { sleepScore, subjectiveScore, trainingScore, streakScore };
    const history = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const sl = sleepLogs.find((s) => s.date === d);
      const ci = checkins.find((c) => c.date === d);
      const slRatio = sl?.durationHours > 0 ? Math.min(sl.durationHours / avgSleepHrs, 1.2) : 0;
      const slS = Math.round(slRatio * 15 + ((sl?.quality || 3) / 5) * 15);
      const m = ci?.mood || 3; const e = ci?.energy || 3; const so = ci?.soreness || 1;
      const subS = Math.round(((m / 5) * 10) + ((e / 5) * 10) + (((6 - so) / 5) * 10));
      history.push({ date: d, label: dayjs(d).format('ddd'), score: Math.min(100, Math.max(0, slS + subS + 20)) });
    }

    res.json({ score: totalScore, label, color, advice, breakdown, history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Overtraining Detection ─────────────────────────────────────────────────
router.get('/overtraining', auth, async (req, res) => {
  try {
    const past28 = dayjs().subtract(28, 'day').format('YYYY-MM-DD');
    const past7 = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    const [workouts, sleepLogs, checkins] = await Promise.all([
      WorkoutLog.find({ userId: req.user.id, completed: true, createdAt: { $gte: new Date(past28) } }).lean(),
      SleepLog.find({ userId: req.user.id, date: { $gte: past28 } }).lean(),
      DailyCheckIn.find({ userId: req.user.id, date: { $gte: past28 } }).lean(),
    ]);

    // Acute (7d) vs Chronic (28d) workload ratio
    const now = dayjs();
    const acuteWorkouts = workouts.filter((w) => dayjs(w.createdAt).isAfter(now.subtract(7, 'day')));
    const acuteVolume = acuteWorkouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
    const chronicVolume = workouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
    const weeklyChronicAvg = chronicVolume / 4;
    const acwr = weeklyChronicAvg > 0 ? (acuteVolume / weeklyChronicAvg).toFixed(2) : 0;

    // Trend signals
    const recentSleep = sleepLogs.filter((s) => s.date >= past7);
    const olderSleep = sleepLogs.filter((s) => s.date < past7);
    const recentSleepAvg = mean(recentSleep.map((s) => s.quality));
    const olderSleepAvg = mean(olderSleep.map((s) => s.quality));
    const sleepDeclining = recentSleepAvg < olderSleepAvg - 0.5;

    const recentCheckins = checkins.filter((c) => c.date >= past7);
    const olderCheckins = checkins.filter((c) => c.date < past7);
    const recentMood = mean(recentCheckins.map((c) => c.mood));
    const olderMood = mean(olderCheckins.map((c) => c.mood));
    const moodDeclining = recentMood < olderMood - 0.5;

    const recentSoreness = mean(recentCheckins.map((c) => c.soreness));
    const sorenessElevated = recentSoreness >= 3.5;

    const flags = [];
    if (Number(acwr) > 1.5) flags.push('Training volume spiked >50% above your 4-week average');
    if (sleepDeclining) flags.push('Sleep quality trending downward this week');
    if (moodDeclining) flags.push('Mood has declined compared to prior weeks');
    if (sorenessElevated) flags.push('Sustained elevated soreness (avg ≥3.5/5)');
    if (Number(acwr) > 1.3 && sorenessElevated) flags.push('High load + high soreness — classic overreaching pattern');

    let risk, recommendation;
    if (flags.length >= 3) { risk = 'high'; recommendation = 'Strong signs of overreaching. Take a deload week — reduce volume by 40-50%.'; }
    else if (flags.length >= 1) { risk = 'moderate'; recommendation = 'Some warning signs. Monitor closely and consider reducing intensity.'; }
    else { risk = 'low'; recommendation = 'No overtraining signals detected. Keep up the great work!'; }

    // Weekly volume for chart
    const weeklyVolumes = [];
    for (let w = 3; w >= 0; w--) {
      const start = now.subtract((w + 1) * 7, 'day');
      const end = now.subtract(w * 7, 'day');
      const vol = workouts
        .filter((wk) => dayjs(wk.createdAt).isAfter(start) && dayjs(wk.createdAt).isBefore(end))
        .reduce((s, wk) => s + (wk.totalVolume || 0), 0);
      weeklyVolumes.push({ week: `W${4 - w}`, volume: vol });
    }

    res.json({ acwr: Number(acwr), risk, flags, recommendation, weeklyVolumes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Sleep Insights ─────────────────────────────────────────────────────────
router.get('/sleep-insights', auth, async (req, res) => {
  try {
    const past30 = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
    const [sleepLogs, workoutLogs, nutritionLogs] = await Promise.all([
      SleepLog.find({ userId: req.user.id, date: { $gte: past30 } }).sort({ date: 1 }).lean(),
      WorkoutLog.find({ userId: req.user.id, completed: true, createdAt: { $gte: new Date(past30) } }).lean(),
      NutritionLog.find({ userId: req.user.id, date: { $gte: past30 } }).lean(),
    ]);

    // Consistency: std deviation of bedtime
    const bedtimes = sleepLogs.filter((s) => s.bedtime).map((s) => {
      const [h, m] = s.bedtime.split(':').map(Number);
      let mins = h * 60 + m;
      if (mins > 18 * 60) mins -= 24 * 60; // normalize past midnight
      return mins;
    });
    const avgBedtime = mean(bedtimes);
    const bedtimeVariance = bedtimes.length > 1
      ? Math.sqrt(bedtimes.reduce((s, b) => s + (b - avgBedtime) ** 2, 0) / bedtimes.length)
      : 0;
    const consistencyScore = Math.max(0, Math.round(100 - bedtimeVariance));

    // Sleep debt (last 7 days)
    const targetHrs = 7.5;
    const last7 = sleepLogs.slice(-7);
    const debt = last7.reduce((s, sl) => s + Math.max(0, targetHrs - (sl.durationHours || 0)), 0);

    // Bedtime drift (last 5 nights)
    const last5Bedtimes = bedtimes.slice(-5);
    let driftMinutes = 0;
    if (last5Bedtimes.length >= 3) {
      for (let i = 1; i < last5Bedtimes.length; i++) {
        driftMinutes += last5Bedtimes[i] - last5Bedtimes[i - 1];
      }
      driftMinutes = Math.round(driftMinutes / (last5Bedtimes.length - 1));
    }

    // Correlation: sleep vs next-day workout volume
    const sleepVolumePairs = [];
    for (const sl of sleepLogs) {
      const nextDay = dayjs(sl.date).add(1, 'day').format('YYYY-MM-DD');
      const dayWorkouts = workoutLogs.filter((w) => dayjs(w.createdAt).format('YYYY-MM-DD') === nextDay);
      if (dayWorkouts.length > 0) {
        const vol = dayWorkouts.reduce((s, w) => s + (w.totalVolume || 0), 0);
        sleepVolumePairs.push({ hours: sl.durationHours, volume: vol });
      }
    }

    // Late eating detection
    const lateEatingDays = nutritionLogs.filter((n) => {
      const meals = n.meals || [];
      const dinner = meals.find((m) => m.type === 'late_snack' || m.type === 'dinner');
      return dinner && (dinner.foods?.length || 0) > 0;
    }).length;

    const insights = [];
    if (consistencyScore < 60) insights.push('Your bedtime varies a lot — try going to bed within a 30-min window each night.');
    if (debt > 5) insights.push(`You have ${debt.toFixed(1)}h of sleep debt this week. Prioritize rest.`);
    if (driftMinutes > 15) insights.push(`Your bedtime is drifting ${driftMinutes} min later each night on average.`);
    if (driftMinutes < -15) insights.push(`Your bedtime is shifting ${Math.abs(driftMinutes)} min earlier — good adjustment!`);
    if (sleepVolumePairs.length >= 5) {
      const goodSleep = sleepVolumePairs.filter((p) => p.hours >= 7);
      const poorSleep = sleepVolumePairs.filter((p) => p.hours < 7);
      const goodVol = mean(goodSleep.map((p) => p.volume));
      const poorVol = mean(poorSleep.map((p) => p.volume));
      if (goodVol > 0 && poorVol > 0) {
        const pct = Math.round(((goodVol - poorVol) / poorVol) * 100);
        if (pct > 5) insights.push(`You lift ${pct}% more volume after 7+ hours of sleep.`);
      }
    }
    if (insights.length === 0) insights.push('Your sleep patterns look healthy! Keep it up.');

    res.json({
      consistencyScore,
      sleepDebt: Math.round(debt * 10) / 10,
      bedtimeDrift: driftMinutes,
      avgDuration: Math.round(mean(sleepLogs.map((s) => s.durationHours || 0)) * 10) / 10,
      insights,
      sleepVolumePairs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Body Composition (computed from measurements + user data) ──────────────
router.get('/body-composition', auth, async (req, res) => {
  try {
    const BodyMeasurement = require('../models/BodyMeasurement');
    const user = await User.findById(req.user.id).select('currentWeight height gender weightHistory').lean();
    const measurements = await BodyMeasurement.find({ userId: req.user.id }).sort({ date: -1 }).limit(12).lean();

    if (!measurements.length || !user) {
      return res.json({ available: false });
    }

    const latest = measurements[0];
    const heightCm = user.height;
    const weight = user.currentWeight;
    const gender = user.gender || 'male';

    // US Navy body fat estimation
    let bodyFatPct = null;
    if (latest.waist && latest.neck && heightCm) {
      if (gender === 'female' && latest.hips) {
        bodyFatPct = 163.205 * Math.log10(latest.waist + latest.hips - latest.neck) - 97.684 * Math.log10(heightCm) - 78.387;
      } else if (latest.waist > latest.neck) {
        bodyFatPct = 86.010 * Math.log10(latest.waist - latest.neck) - 70.041 * Math.log10(heightCm) + 36.76;
      }
      if (bodyFatPct !== null) bodyFatPct = Math.round(bodyFatPct * 10) / 10;
    }

    // Derived metrics
    let leanMass = null, fatMass = null, ffmi = null, whr = null;
    if (bodyFatPct !== null && bodyFatPct > 0 && bodyFatPct < 60) {
      fatMass = Math.round((weight * bodyFatPct / 100) * 10) / 10;
      leanMass = Math.round((weight - fatMass) * 10) / 10;
      const heightM = heightCm / 100;
      ffmi = Math.round((leanMass / (heightM * heightM) + 6.1 * (1.8 - heightM)) * 10) / 10;
    }
    if (latest.waist && latest.hips) {
      whr = Math.round((latest.waist / latest.hips) * 100) / 100;
    }

    // Historical body fat
    const history = measurements
      .filter((m) => m.waist && m.neck)
      .map((m) => {
        let bf;
        if (gender === 'female' && m.hips) {
          bf = 163.205 * Math.log10(m.waist + m.hips - m.neck) - 97.684 * Math.log10(heightCm) - 78.387;
        } else if (m.waist > m.neck) {
          bf = 86.010 * Math.log10(m.waist - m.neck) - 70.041 * Math.log10(heightCm) + 36.76;
        }
        return { date: dayjs(m.date).format('MMM D'), bodyFat: bf ? Math.round(bf * 10) / 10 : null };
      })
      .filter((h) => h.bodyFat !== null)
      .reverse();

    // WHR risk
    let whrRisk = null;
    if (whr) {
      const threshold = gender === 'female' ? 0.85 : 0.90;
      whrRisk = whr > threshold ? 'elevated' : 'normal';
    }

    res.json({
      available: true,
      bodyFatPct,
      leanMass,
      fatMass,
      ffmi,
      whr,
      whrRisk,
      weight,
      history,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Fasting / Meal Timing ──────────────────────────────────────────────────
router.get('/meal-timing', auth, async (req, res) => {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const past7 = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    const [nutritionLogs, workoutLogs] = await Promise.all([
      NutritionLog.find({ userId: req.user.id, date: { $gte: past7 } }).lean(),
      WorkoutLog.find({ userId: req.user.id, completed: true, createdAt: { $gte: new Date(past7) } }).lean(),
    ]);

    const MEAL_ORDER = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'late_snack'];
    const MEAL_TIMES = { breakfast: 8, morning_snack: 10, lunch: 13, afternoon_snack: 15, dinner: 19, late_snack: 21 };

    const dailyWindows = nutritionLogs.map((n) => {
      const meals = (n.meals || []).filter((m) => (m.foods?.length || 0) > 0);
      if (!meals.length) return null;
      const mealTypes = meals.map((m) => m.type);
      const earliest = MEAL_ORDER.find((t) => mealTypes.includes(t));
      const latest = [...MEAL_ORDER].reverse().find((t) => mealTypes.includes(t));
      if (!earliest || !latest) return null;
      const startHour = MEAL_TIMES[earliest] || 8;
      const endHour = MEAL_TIMES[latest] || 20;
      return { date: n.date, firstMeal: earliest, lastMeal: latest, windowHours: endHour - startHour, mealsCount: meals.length };
    }).filter(Boolean);

    const avgWindow = dailyWindows.length > 0
      ? Math.round(mean(dailyWindows.map((d) => d.windowHours)) * 10) / 10
      : null;

    // Post-workout protein check for today
    const todayNutrition = nutritionLogs.find((n) => n.date === today);
    const todayWorkouts = workoutLogs.filter((w) => dayjs(w.createdAt).format('YYYY-MM-DD') === today);
    let postWorkoutProtein = null;
    if (todayWorkouts.length > 0 && todayNutrition) {
      const allFoods = (todayNutrition.meals || []).flatMap((m) => m.foods || []);
      postWorkoutProtein = allFoods.reduce((s, f) => s + (f.protein || 0), 0);
    }

    res.json({ dailyWindows, avgWindow, postWorkoutProtein });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
