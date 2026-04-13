const mongoose = require('mongoose');

const progressPhotoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: { type: Date, default: Date.now, index: true },
    pose: {
      type: String,
      enum: ['front', 'side', 'back'],
      required: true,
    },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    weekNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

progressPhotoSchema.index({ userId: 1, date: -1 });
progressPhotoSchema.index({ userId: 1, pose: 1 });

module.exports = mongoose.model('ProgressPhoto', progressPhotoSchema);
