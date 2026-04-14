const mongoose = require('mongoose');

const buddyMessageSchema = new mongoose.Schema(
  {
    pairId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuddyPair', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

buddyMessageSchema.index({ pairId: 1, createdAt: -1 });

module.exports = mongoose.model('BuddyMessage', buddyMessageSchema);
