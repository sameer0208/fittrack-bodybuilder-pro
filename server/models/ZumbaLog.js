const mongoose = require('mongoose');

const zumbaLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    sessionId: { type: String, required: true },
    sessionName: { type: String, required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    duration: { type: Number, required: true },
    caloriesBurned: { type: Number, default: 0 },
    movesCompleted: { type: Number, default: 0 },
    totalMoves: { type: Number, default: 0 },
    completionPct: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: null },
    styles: [{ type: String }],
  },
  { timestamps: true }
);

zumbaLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('ZumbaLog', zumbaLogSchema);
