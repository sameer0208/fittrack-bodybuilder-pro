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
    currentWeight: { type: Number, required: true }, // in kg
    height: { type: Number, required: true }, // in cm
    targetWeight: { type: Number, required: true }, // in kg
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' },
    fitnessLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    weightHistory: [weightHistorySchema],
    programStartDate: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
    totalWorkouts: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date },
  },
  { timestamps: true }
);

userSchema.virtual('bmi').get(function () {
  const heightM = this.height / 100;
  return (this.currentWeight / (heightM * heightM)).toFixed(1);
});

userSchema.virtual('dailyCalories').get(function () {
  // Mifflin-St Jeor Equation (BMR) for bulking (+500 surplus)
  const bmr =
    this.gender === 'female'
      ? 10 * this.currentWeight + 6.25 * this.height - 5 * (this.age || 25) - 161
      : 10 * this.currentWeight + 6.25 * this.height - 5 * (this.age || 25) + 5;
  // Activity multiplier for very active (daily gym)
  return Math.round(bmr * 1.725 + 500);
});

userSchema.virtual('proteinTarget').get(function () {
  return Math.round(this.currentWeight * 2.2); // 2.2g per kg for bulking
});

module.exports = mongoose.model('User', userSchema);
