const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema({
  setNumber: { type: Number, default: 1 },
  weight: { type: Number, default: 0 },
  reps: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  rpe: { type: Number, min: 1, max: 10 },
});

const exerciseLogSchema = new mongoose.Schema({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  sets: [setLogSchema],
  notes: { type: String },
  completed: { type: Boolean, default: false },
});

const workoutLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workoutDay: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday_am', 'saturday_pm', 'sunday_am', 'sunday_pm'],
      required: true,
    },
    workoutName: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    exercises: [exerciseLogSchema],
    duration: { type: Number }, // in minutes (display)
    elapsedSeconds: { type: Number }, // precise timer value
    totalVolume: { type: Number, default: 0 }, // total kg lifted
    notes: { type: String },
    completed: { type: Boolean, default: false },
    bodyWeight: { type: Number }, // weight on that day
    mood: { type: String, enum: ['great', 'good', 'okay', 'bad'], default: 'good' },
  },
  { timestamps: true }
);

// Use async pre-save (no `next` callback) — Mongoose 9 compatible.
// Mongoose 9 / Kareem changed how it detects callback vs async hooks;
// calling next() when it isn't passed causes "next is not a function".
workoutLogSchema.pre('save', async function () {
  let volume = 0;
  if (Array.isArray(this.exercises)) {
    this.exercises.forEach((ex) => {
      if (!Array.isArray(ex.sets)) return;
      ex.sets.forEach((set) => {
        if (set.completed) {
          volume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }
      });
    });
  }
  this.totalVolume = volume;
});

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
