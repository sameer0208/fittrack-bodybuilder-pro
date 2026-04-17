const mongoose = require('mongoose');

const stepLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    steps: { type: Number, default: 0 },
    goal: { type: Number, default: 10000 },
    distanceKm: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    activeMinutes: { type: Number, default: 0 },
    // 24-slot array for hourly step breakdown (index 0 = midnight, 23 = 11pm)
    hourly: { type: [Number], default: () => new Array(24).fill(0) },
    peakHour: { type: Number, default: null },
    avgPace: { type: Number, default: null },
    source: { type: String, enum: ['accelerometer', 'manual', 'mixed'], default: 'manual' },
  },
  { timestamps: true }
);

stepLogSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('StepLog', stepLogSchema);
