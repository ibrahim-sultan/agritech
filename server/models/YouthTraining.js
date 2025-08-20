const mongoose = require('mongoose');

const youthTrainingSchema = new mongoose.Schema({
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
  description: {
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
      'basic_computer',
      'typing_skills',
      'internet_safety',
      'mobile_apps',
      'python_basics',
      'scratch_programming',
      'digital_farming',
      'online_marketing',
      'financial_literacy',
      'entrepreneurship'
    ],
    required: true
  },
  level: {
    type: String,
    enum: ['absolute_beginner', 'beginner', 'intermediate', 'advanced'],
    default: 'absolute_beginner'
  },
  duration: {
    estimated: {
      value: {
        type: Number,
        required: true
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks'],
        default: 'hours'
      }
    }
  },
  prerequisites: [{
    english: String,
    yoruba: String
  }],
  learningObjectives: [{
    english: {
      type: String,
      required: true
    },
    yoruba: {
      type: String,
      required: true
    }
  }],
  modules: [{
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
      english: String,
      yoruba: String
    },
    videoUrl: String,
    audioFile: {
      english: String,
      yoruba: String
    },
    practicalExercise: {
      english: String,
      yoruba: String
    },
    resources: [String],
    duration: {
      type: Number, // in minutes
      default: 30
    }
  }],
  resources: {
    videos: [String],
    documents: [String],
    externalLinks: [String],
    downloadableFiles: [String]
  },
  certification: {
    available: {
      type: Boolean,
      default: false
    },
    requirements: [String],
    certificateName: String
  },
  instructor: {
    name: String,
    bio: String,
    experience: String,
    contact: String
  },
  enrollments: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFree: {
    type: Boolean,
    default: true
  },
  cost: {
    type: Number,
    default: 0
  },
  targetAudience: [{
    type: String,
    enum: ['rural_youth', 'farmers', 'students', 'unemployed', 'entrepreneurs', 'women', 'all']
  }],
  mobileOptimized: {
    type: Boolean,
    default: true
  },
  offlineCapable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
youthTrainingSchema.index({ category: 1, level: 1 });
youthTrainingSchema.index({ isActive: 1, isFree: 1 });
youthTrainingSchema.index({ targetAudience: 1, rating: -1 });
youthTrainingSchema.index({ 'title.english': 'text', 'description.english': 'text' });

module.exports = mongoose.model('YouthTraining', youthTrainingSchema);
