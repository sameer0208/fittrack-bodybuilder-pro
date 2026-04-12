const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  weight: { type: Number, default: 0 }, // in kg, 0 = bodyweight
  reps: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  rpe: { type: Number, min: 1, max: 10 }, // Rate of Perceived Exertion
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
    workoutName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    exercises: [exerciseLogSchema],
    duration: { type: Number }, // in minutes
    totalVolume: { type: Number, default: 0 }, // total kg lifted
    notes: { type: String },
    completed: { type: Boolean, default: false },
    bodyWeight: { type: Number }, // weight on that day
    mood: { type: String, enum: ['great', 'good', 'okay', 'bad'], default: 'good' },
  },
  { timestamps: true }
);

workoutLogSchema.pre('save', function (next) {
  let volume = 0;
  this.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.completed) {
        volume += (set.weight || 0) * set.reps;
      }
    });
  });
  this.totalVolume = volume;
  next();
});

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
