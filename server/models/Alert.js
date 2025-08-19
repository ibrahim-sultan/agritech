const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['weather', 'sensor', 'crop', 'system', 'irrigation', 'pest', 'disease'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  },
  sensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor'
  },
  triggerValue: {
    value: Number,
    threshold: Number,
    unit: String
  },
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    description: String,
    timestamp: Date,
    takenBy: String
  },
  autoResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: Date,
  acknowledgedAt: Date,
  acknowledgedBy: String
}, {
  timestamps: true
});

// Index for efficient queries
alertSchema.index({ farm: 1, status: 1, createdAt: -1 });
alertSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
