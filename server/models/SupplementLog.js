const mongoose = require('mongoose');

const supplementEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  dose: { type: String, default: '' },
  taken: { type: Boolean, default: false },
}, { _id: false });

const supplementLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    supplements: [supplementEntrySchema],
  },
  { timestamps: true }
);

supplementLogSchema.index({ userId: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('SupplementLog', supplementLogSchema);
