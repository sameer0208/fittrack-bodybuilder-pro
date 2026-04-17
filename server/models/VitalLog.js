const mongoose = require('mongoose');

const vitalLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    restingHR: { type: Number, default: null },
    systolic: { type: Number, default: null },
    diastolic: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

vitalLogSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('VitalLog', vitalLogSchema);
