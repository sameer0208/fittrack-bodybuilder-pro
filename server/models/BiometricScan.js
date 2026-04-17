const mongoose = require('mongoose');

const biometricScanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    heartRate: { type: Number, default: null },

    // HRV metrics
    hrvRMSSD: { type: Number, default: null },
    hrvSDNN: { type: Number, default: null },
    hrvPNN50: { type: Number, default: null },
    hrvLFHF: { type: Number, default: null },

    // SpO2
    spo2: { type: Number, default: null },

    // Respiratory rate
    respiratoryRate: { type: Number, default: null },

    // Stress (0-100)
    stressIndex: { type: Number, default: null },

    // Signal quality (0-100)
    signalQuality: { type: Number, default: null },

    // Raw R-R intervals in ms for deeper analysis
    rrIntervals: { type: [Number], default: [] },

    // Scan duration in seconds
    scanDuration: { type: Number, default: 30 },

    source: { type: String, enum: ['camera', 'manual'], default: 'camera' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

biometricScanSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('BiometricScan', biometricScanSchema);
