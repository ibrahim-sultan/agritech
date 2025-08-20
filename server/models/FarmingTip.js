const mongoose = require('mongoose');

const farmingTipSchema = new mongoose.Schema({
  title: {
    english: {
      type: String,
      required: true
    },
    yoruba: {
      type: String,
      required: true
    }
  },
  content: {
    english: {
      type: String,
      required: true
    },
    yoruba: {
      type: String,
      required: true
    }
  },
  category: {
    type: String,
    enum: [
      'pest_control',
      'irrigation',
      'composting',
      'planting',
      'harvesting',
      'soil_preparation',
      'crop_rotation',
      'organic_farming',
      'storage',
      'marketing'
    ],
    required: true
  },
  targetCrops: [{
    type: String,
    enum: ['yam', 'cassava', 'maize', 'tomatoes', 'beans', 'pepper', 'onions', 'plantain', 'rice', 'cocoyam', 'all']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  season: [{
    type: String,
    enum: ['wet_season', 'dry_season', 'harvest_season', 'planting_season', 'all_seasons']
  }],
  estimatedCost: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  timeRequired: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days', 'weeks'],
      default: 'hours'
    }
  },
  materials: [{
    name: {
      english: String,
      yoruba: String
    },
    quantity: String,
    localAvailability: {
      type: String,
      enum: ['readily_available', 'seasonal', 'rare', 'need_to_buy'],
      default: 'readily_available'
    }
  }],
  steps: [{
    stepNumber: {
      type: Number,
      required: true
    },
    instruction: {
      english: {
        type: String,
        required: true
      },
      yoruba: {
        type: String,
        required: true
      }
    },
    image: String,
    videoUrl: String
  }],
  audioFile: {
    english: String,
    yoruba: String
  },
  images: [String],
  videoUrl: String,
  author: {
    name: String,
    title: String,
    location: String,
    experience: String
  },
  tags: [String],
  likes: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  effectiveness: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
farmingTipSchema.index({ category: 1, targetCrops: 1 });
farmingTipSchema.index({ season: 1, difficulty: 1 });
farmingTipSchema.index({ isFeatured: 1, isActive: 1, createdAt: -1 });
farmingTipSchema.index({ 'title.english': 'text', 'content.english': 'text' });

module.exports = mongoose.model('FarmingTip', farmingTipSchema);
