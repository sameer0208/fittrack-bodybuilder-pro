const mongoose = require('mongoose');

const injuryLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bodyPart: {
      type: String,
      required: true,
      enum: ['shoulder', 'lower_back', 'upper_back', 'knee', 'elbow', 'wrist', 'hip', 'neck', 'ankle', 'chest', 'hamstring', 'quad', 'calf', 'bicep', 'tricep', 'forearm', 'shin', 'foot', 'other'],
    },
    severity: { type: Number, min: 1, max: 10, required: true },
    painType: {
      type: String,
      enum: ['sharp', 'dull_ache', 'stiffness', 'tingling', 'burning', 'throbbing'],
      default: 'dull_ache',
    },
    occurrence: {
      type: String,
      enum: ['during_exercise', 'at_rest', 'morning_stiffness', 'after_specific_movement', 'constant'],
      default: 'during_exercise',
    },
    status: {
      type: String,
      enum: ['new', 'improving', 'chronic', 'resolved'],
      default: 'new',
    },
    notes: { type: String, default: '' },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

injuryLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('InjuryLog', injuryLogSchema);
