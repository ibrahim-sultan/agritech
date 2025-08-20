const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  variety: {
    type: String,
    required: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  plantingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date,
    required: true
  },
  actualHarvestDate: {
    type: Date
  },
  area: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['hectares', 'acres', 'square_meters'],
      default: 'hectares'
    }
  },
  status: {
    type: String,
    enum: ['planted', 'growing', 'flowering', 'harvested', 'failed'],
    default: 'planted'
  },
  yield: {
    expected: {
      value: Number,
      unit: String
    },
    actual: {
      value: Number,
      unit: String
    }
  },
  growthStage: {
    type: String,
    enum: ['germination', 'vegetative', 'flowering', 'fruiting', 'maturity'],
    default: 'germination'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  irrigation: {
    type: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'manual'],
      default: 'manual'
    },
    frequency: String,
    lastWatered: Date
  },
  fertilizers: [{
    name: String,
    type: String,
    applicationDate: Date,
    quantity: String
  }],
  pesticides: [{
    name: String,
    type: String,
    applicationDate: Date,
    quantity: String,
    targetPest: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Crop', cropSchema);
