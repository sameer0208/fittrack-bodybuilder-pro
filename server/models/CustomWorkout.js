const mongoose = require('mongoose');

const customWorkoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionKey: { type: String, required: true },
    customName: { type: String, default: '' },
    added: [{ type: String }],
    removed: [{ type: String }],
  },
  { timestamps: true }
);

customWorkoutSchema.index({ userId: 1, sessionKey: 1 }, { unique: true });

module.exports = mongoose.model('CustomWorkout', customWorkoutSchema);
