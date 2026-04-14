const mongoose = require('mongoose');

const buddyChallengeSchema = new mongoose.Schema(
  {
    pairId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuddyPair', required: true, index: true },
    type: {
      type: String,
      enum: ['weekly_workouts', 'weekly_volume', 'weekly_streak'],
      required: true,
    },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
);

buddyChallengeSchema.index({ pairId: 1, status: 1 });

module.exports = mongoose.model('BuddyChallenge', buddyChallengeSchema);
