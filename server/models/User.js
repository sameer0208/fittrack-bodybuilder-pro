const mongoose = require('mongoose');

const weightHistorySchema = new mongoose.Schema({
  weight: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    currentWeight: { type: Number, required: true },
    height: { type: Number, required: true },
    targetWeight: { type: Number, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },

    // ── Personalization (added for dynamic plans) ───────────────────────────
    fitnessGoal: {
      type: String,
      enum: ['bulk', 'cut', 'maintain', 'strength', 'endurance'],
      default: 'bulk',
    },
    gymDaysPerWeek: { type: Number, min: 2, max: 7, default: 7 },
    gymDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    preferredSplit: {
      type: String,
      enum: ['push_pull_legs', 'upper_lower', 'full_body', 'bro_split', 'auto'],
      default: 'auto',
    },
    weekendDoubles: { type: Boolean, default: true },
    sessionDuration: {
      type: String,
      enum: ['30-45', '45-60', '60-75', '75-90'],
      default: '75-90',
    },
    activityLevel: {
      type: Number,
      min: 1.2,
      max: 1.9,
      default: 1.725,
    },
    // ─────────────────────────────────────────────────────────────────────────

    weightHistory: [weightHistorySchema],
    programStartDate: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
    leaderboardOptIn: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.virtual('bmi').get(function () {
  const heightM = this.height / 100;
  return (this.currentWeight / (heightM * heightM)).toFixed(1);
});

userSchema.virtual('dailyCalories').get(function () {
  const bmr =
    this.gender === 'female'
      ? 10 * this.currentWeight + 6.25 * this.height - 5 * (this.age || 25) - 161
      : 10 * this.currentWeight + 6.25 * this.height - 5 * (this.age || 25) + 5;

  const tdee = Math.round(bmr * (this.activityLevel || 1.725));
  const goal = this.fitnessGoal || 'bulk';

  if (goal === 'bulk') return tdee + 500;
  if (goal === 'cut') return Math.max(1200, tdee - 500);
  if (goal === 'strength') return tdee + 300;
  if (goal === 'endurance') return tdee + 200;
  return tdee; // maintain
});

userSchema.virtual('proteinTarget').get(function () {
  const goal = this.fitnessGoal || 'bulk';
  const w = this.currentWeight;
  if (goal === 'bulk' || goal === 'strength') return Math.round(w * 2.2);
  if (goal === 'cut') return Math.round(w * 2.4);
  if (goal === 'endurance') return Math.round(w * 1.6);
  return Math.round(w * 1.8); // maintain
});

module.exports = mongoose.model('User', userSchema);
