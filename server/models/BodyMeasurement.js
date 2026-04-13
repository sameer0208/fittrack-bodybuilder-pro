const mongoose = require('mongoose');

const bodyMeasurementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now, index: true },
    chest: { type: Number, default: null },
    waist: { type: Number, default: null },
    hips: { type: Number, default: null },
    bicepsLeft: { type: Number, default: null },
    bicepsRight: { type: Number, default: null },
    thighLeft: { type: Number, default: null },
    thighRight: { type: Number, default: null },
    calves: { type: Number, default: null },
    forearms: { type: Number, default: null },
    neck: { type: Number, default: null },
    shoulders: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

bodyMeasurementSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('BodyMeasurement', bodyMeasurementSchema);
