const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:        { type: String, required: true },
  challengeId: { type: String, required: true },
  completed:   { type: Boolean, default: false },
  xpAwarded:   { type: Number, default: 0 },
  completedAt: { type: Date },
}, { timestamps: true });

dailyChallengeSchema.index({ userId: 1, date: 1, challengeId: 1 }, { unique: true });
dailyChallengeSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
