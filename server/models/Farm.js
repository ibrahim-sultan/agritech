const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  size: {
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
  owner: {
    type: String,
    required: true
  },
  contact: {
    email: String,
    phone: String
  },
  establishedDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  farmType: {
    type: String,
    enum: ['crop', 'livestock', 'mixed', 'organic'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Farm', farmSchema);
