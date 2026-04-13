const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    bedtime: { type: String, default: '' },
    wakeTime: { type: String, default: '' },
    durationHours: { type: Number, default: 0 },
    quality: { type: Number, min: 1, max: 5, default: 3 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

sleepLogSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('SleepLog', sleepLogSchema);
