const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    key: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

achievementSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
