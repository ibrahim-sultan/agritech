const mongoose = require('mongoose');

const cropPriceSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true,
    enum: ['yam', 'cassava', 'maize', 'tomatoes', 'beans', 'pepper', 'onions', 'plantain', 'rice', 'cocoyam']
  },
  cropNameYoruba: {
    type: String,
    required: true
  },
  market: {
    name: {
      type: String,
      required: true,
      enum: ['Igbaja Local Market', 'Ilorin Central Market', 'Offa Market', 'Lagos Wholesale Market']
    },
    location: {
      state: String,
      lga: String
    }
  },
  pricePerUnit: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['per tuber', 'per bag', 'per basket', 'per kg', 'per tonne'],
      required: true
    },
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  priceRange: {
    min: Number,
    max: Number
  },
  season: {
    type: String,
    enum: ['wet_season', 'dry_season', 'harvest_season', 'planting_season'],
    required: true
  },
  quality: {
    type: String,
    enum: ['premium', 'standard', 'low_grade'],
    default: 'standard'
  },
  availability: {
    type: String,
    enum: ['abundant', 'moderate', 'scarce'],
    default: 'moderate'
  },
  trend: {
    direction: {
      type: String,
      enum: ['rising', 'falling', 'stable'],
      default: 'stable'
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['market_survey', 'trader_report', 'government_data', 'automated_scraping'],
    default: 'market_survey'
  },
  notes: {
    english: String,
    yoruba: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
cropPriceSchema.index({ cropName: 1, market: 1, lastUpdated: -1 });
cropPriceSchema.index({ season: 1, availability: 1 });

module.exports = mongoose.model('CropPrice', cropPriceSchema);
