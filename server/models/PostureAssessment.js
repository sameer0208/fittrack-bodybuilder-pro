const mongoose = require('mongoose');

const postureAssessmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    forwardHead: { type: String, enum: ['yes', 'no', 'unsure'], default: 'unsure' },
    roundedShoulders: { type: String, enum: ['yes', 'no', 'unsure'], default: 'unsure' },
    anteriorPelvicTilt: { type: String, enum: ['yes', 'no', 'unsure'], default: 'unsure' },
    touchToes: { type: String, enum: ['yes', 'no', 'almost', 'unsure'], default: 'unsure' },
    overheadSquat: { type: String, enum: ['yes', 'no', 'partial', 'unsure'], default: 'unsure' },
    ankleDorsiflexion: { type: String, enum: ['yes', 'no', 'unsure'], default: 'unsure' },
    overallScore: { type: Number, min: 0, max: 100, default: 50 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

postureAssessmentSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('PostureAssessment', postureAssessmentSchema);
