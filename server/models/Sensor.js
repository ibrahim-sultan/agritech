const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['temperature', 'humidity', 'soil_moisture', 'ph', 'light', 'co2', 'pressure'],
    required: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  location: {
    coordinates: {
      lat: Number,
      lng: Number
    },
    description: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  lastReading: {
    value: Number,
    unit: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  calibration: {
    lastCalibrated: Date,
    calibrationData: mongoose.Schema.Types.Mixed
  },
  thresholds: {
    min: Number,
    max: Number,
    optimal: {
      min: Number,
      max: Number
    }
  }
}, {
  timestamps: true
});

const sensorDataSchema = new mongoose.Schema({
  sensor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sensor',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient time-series queries
sensorDataSchema.index({ sensor: 1, timestamp: -1 });

const Sensor = mongoose.model('Sensor', sensorSchema);
const SensorData = mongoose.model('SensorData', sensorDataSchema);

module.exports = { Sensor, SensorData };
