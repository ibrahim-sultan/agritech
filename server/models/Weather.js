const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  temperature: {
    current: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    }
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  windSpeed: {
    value: {
      type: Number,
      required: true
    },
    direction: {
      type: String,
      enum: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    },
    unit: {
      type: String,
      enum: ['kmh', 'mph', 'ms'],
      default: 'kmh'
    }
  },
  precipitation: {
    amount: {
      type: Number,
      default: 0
    },
    probability: {
      type: Number,
      min: 0,
      max: 100
    },
    type: {
      type: String,
      enum: ['none', 'rain', 'snow', 'sleet', 'hail']
    },
    unit: {
      type: String,
      enum: ['mm', 'inches'],
      default: 'mm'
    }
  },
  pressure: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['hPa', 'inHg'],
      default: 'hPa'
    }
  },
  uvIndex: {
    type: Number,
    min: 0,
    max: 15
  },
  visibility: {
    value: Number,
    unit: {
      type: String,
      enum: ['km', 'miles'],
      default: 'km'
    }
  },
  conditions: {
    type: String,
    enum: ['sunny', 'cloudy', 'partly_cloudy', 'overcast', 'rainy', 'stormy', 'foggy', 'snowy'],
    required: true
  },
  forecast: {
    type: String,
    enum: ['current', '1_day', '3_day', '7_day'],
    default: 'current'
  }
}, {
  timestamps: true
});

// Index for efficient queries by farm and date
weatherSchema.index({ farm: 1, date: -1 });

module.exports = mongoose.model('Weather', weatherSchema);
