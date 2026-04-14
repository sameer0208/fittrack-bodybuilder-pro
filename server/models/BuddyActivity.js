const mongoose = require('mongoose');

const buddyActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['workout_completed', 'streak_milestone', 'nutrition_logged', 'weight_logged', 'achievement_unlocked', 'challenge_won', 'nudge'],
      required: true,
    },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

buddyActivitySchema.index({ createdAt: -1 });
buddyActivitySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BuddyActivity', buddyActivitySchema);
