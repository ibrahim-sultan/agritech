const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: [/^(\+234|0)[7-9][0-1]\d{8}$/, 'Please enter a valid Nigerian phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    avatar: {
      type: String,
      default: null
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    },
    location: {
      state: {
        type: String,
        required: false,
        default: 'Kwara'
      },
      lga: {
        type: String,
        required: false,
        default: 'Ifelodun'
      },
      community: {
        type: String,
        required: false,
        default: 'Igbaja'
      },
      address: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    preferredLanguage: {
      type: String,
      enum: ['english', 'yoruba'],
      default: 'english'
    },
    bio: String
  },
  
  // User Role and Permissions
  role: {
    type: String,
    enum: ['farmer', 'trader', 'admin', 'extension_officer', 'youth', 'buyer', 'supplier'],
    default: 'farmer'
  },
  permissions: {
    canViewAnalytics: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false },
    canAccessAPI: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManageContent: { type: Boolean, default: false },
    canViewRevenue: { type: Boolean, default: false }
  },
  
  // Subscription and Payment
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'basic', 'premium', 'commercial', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired', 'trial'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      provider: {
        type: String,
        enum: ['paystack', 'flutterwave', 'bank_transfer', 'cash']
      },
      lastFour: String,
      expiryDate: String
    },
    features: [{
      type: String,
      enum: [
        'basic_prices',
        'advanced_analytics',
        'price_predictions',
        'unlimited_alerts',
        'api_access',
        'data_export',
        'premium_support',
        'marketplace_access',
        'training_certificates',
        'custom_reports'
      ]
    }]
  },
  
  // Verification Status
  verification: {
    email: {
      isVerified: { type: Boolean, default: false },
      token: String,
      tokenExpires: Date
    },
    phone: {
      isVerified: { type: Boolean, default: false },
      code: String,
      codeExpires: Date
    },
    identity: {
      isVerified: { type: Boolean, default: false },
      documentType: {
        type: String,
        enum: ['nin', 'drivers_license', 'passport', 'voters_card']
      },
      documentNumber: String,
      documentImage: String,
      verifiedAt: Date,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  
  // Farming/Business Information
  farmingInfo: {
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'experienced', 'expert'],
      default: 'beginner'
    },
    primaryCrops: [{
      type: String,
      enum: ['yam', 'cassava', 'maize', 'tomatoes', 'beans', 'pepper', 'onions', 'plantain', 'rice', 'cocoyam']
    }],
    farmSize: {
      value: Number,
      unit: {
        type: String,
        enum: ['hectares', 'acres', 'plots'],
        default: 'hectares'
      }
    },
    farmingMethod: {
      type: String,
      enum: ['traditional', 'organic', 'modern', 'mixed'],
      default: 'traditional'
    },
    annualIncome: {
      range: {
        type: String,
        enum: ['below_100k', '100k_500k', '500k_1m', '1m_5m', '5m_above']
      },
      currency: {
        type: String,
        default: 'NGN'
      }
    }
  },
  
  // User Preferences and Settings
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false }
    },
    priceAlerts: {
      enabled: { type: Boolean, default: true },
      crops: [String],
      markets: [String],
      thresholds: [{
        crop: String,
        market: String,
        minPrice: Number,
        maxPrice: Number,
        changePercentage: Number
      }]
    },
    marketPreferences: {
      preferredMarkets: [String],
      maxDistance: { type: Number, default: 50 }, // in kilometers
      transportMode: {
        type: String,
        enum: ['walking', 'bicycle', 'motorcycle', 'car', 'public_transport'],
        default: 'motorcycle'
      }
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['compact', 'detailed', 'custom'],
        default: 'detailed'
      },
      widgets: [{
        type: String,
        position: Number,
        visible: Boolean
      }]
    }
  },
  
  // Activity and Engagement
  activity: {
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    lastActiveDate: Date,
    totalTimeSpent: { type: Number, default: 0 }, // in minutes
    featuresUsed: [String],
    favoriteFeatures: [String],
    completedTrainings: [{
      trainingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'YouthTraining'
      },
      completedAt: Date,
      score: Number,
      certificateIssued: Boolean
    }],
    contributions: {
      priceReports: { type: Number, default: 0 },
      farmingTips: { type: Number, default: 0 },
      reviews: { type: Number, default: 0 },
      referrals: { type: Number, default: 0 }
    }
  },
  
  // Financial Information
  financial: {
    totalSpent: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 }, // From referrals, data contributions, etc.
    paymentHistory: [{
      amount: Number,
      currency: { type: String, default: 'NGN' },
      type: {
        type: String,
        enum: ['subscription', 'training', 'marketplace', 'api_usage', 'premium_feature']
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded']
      },
      reference: String,
      provider: String,
      paidAt: Date
    }],
    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'NGN' },
      lastUpdated: Date
    }
  },
  
  // Security and Access
  security: {
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      method: {
        type: String,
        enum: ['sms', 'email', 'app']
      },
      secret: String
    },
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: Date,
      lockedUntil: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    apiKeys: [{
      key: String,
      name: String,
      permissions: [String],
      lastUsed: Date,
      usage: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  
  // Platform Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned', 'pending_verification'],
    default: 'active'
  },
  notes: String, // Admin notes
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'subscription.tier': 1, 'subscription.status': 1 });
userSchema.index({ 'profile.location.state': 1, 'profile.location.lga': 1 });
userSchema.index({ 'farmingInfo.primaryCrops': 1 });
userSchema.index({ referralCode: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for subscription status
userSchema.virtual('isSubscriptionActive').get(function() {
  return this.subscription.status === 'active' && 
         this.subscription.expiresAt > new Date();
});

// Virtual for user level based on activity
userSchema.virtual('userLevel').get(function() {
  const { loginCount, contributions } = this.activity;
  const totalContributions = Object.values(contributions).reduce((sum, count) => sum + count, 0);
  
  if (loginCount > 100 && totalContributions > 50) return 'expert';
  if (loginCount > 50 && totalContributions > 20) return 'advanced';
  if (loginCount > 20 && totalContributions > 5) return 'intermediate';
  return 'beginner';
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it's been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate referral code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to generate referral code
userSchema.methods.generateReferralCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'AGR';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Instance method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  // Admin has all permissions
  if (this.role === 'admin') return true;
  
  // Check specific permissions
  return this.permissions[permission] === true;
};

// Instance method to check if user can access feature
userSchema.methods.canAccessFeature = function(feature) {
  // Check if feature is included in subscription
  return this.subscription.features.includes(feature) ||
         this.role === 'admin';
};

// Instance method to update last activity
userSchema.methods.updateActivity = function(feature = null) {
  this.activity.lastActiveDate = new Date();
  if (feature && !this.activity.featuresUsed.includes(feature)) {
    this.activity.featuresUsed.push(feature);
  }
  return this.save();
};

// Static method to find users by subscription tier
userSchema.statics.findBySubscriptionTier = function(tier) {
  return this.find({ 'subscription.tier': tier, 'subscription.status': 'active' });
};

// Static method to find users in location
userSchema.statics.findInLocation = function(state, lga = null) {
  const query = { 'profile.location.state': state };
  if (lga) query['profile.location.lga'] = lga;
  return this.find(query);
};

module.exports = mongoose.model('User', userSchema);
