const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    mood: { type: Number, min: 1, max: 5, default: 3 },
    energy: { type: Number, min: 1, max: 5, default: 3 },
    soreness: { type: Number, min: 1, max: 5, default: 1 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

dailyCheckInSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('DailyCheckIn', dailyCheckInSchema);
