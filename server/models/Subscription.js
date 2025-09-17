const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'basic', 'premium', 'commercial', 'enterprise']
  },
  displayName: {
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
  pricing: {
    monthly: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'NGN'
      },
      paystack_plan_code: String,
      flutterwave_plan_id: String
    },
    yearly: {
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'NGN'
      },
      discount: {
        type: Number,
        default: 0 // Percentage discount
      },
      paystack_plan_code: String,
      flutterwave_plan_id: String
    }
  },
  features: [{
    name: {
      type: String,
      required: true,
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
        'custom_reports',
        'bulk_operations',
        'priority_notifications',
        'historical_data',
        'weather_integration',
        'farming_consultations'
      ]
    },
    description: {
      english: String,
      yoruba: String
    },
    limit: {
      type: Number,
      default: -1 // -1 for unlimited
    }
  }],
  limits: {
    priceAlerts: {
      type: Number,
      default: 5
    },
    apiCalls: {
      type: Number,
      default: 100 // per day
    },
    dataExports: {
      type: Number,
      default: 1 // per month
    },
    supportTickets: {
      type: Number,
      default: 1 // per month
    },
    trainingCourses: {
      type: Number,
      default: 0 // number of free courses
    },
    marketplaceListings: {
      type: Number,
      default: 0
    },
    consultationHours: {
      type: Number,
      default: 0 // per month
    }
  },
  targetAudience: [{
    type: String,
    enum: ['farmer', 'trader', 'youth', 'extension_officer', 'buyer', 'supplier', 'all']
  }],
  benefits: [{
    english: String,
    yoruba: String,
    icon: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  trialPeriod: {
    enabled: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 7 // days
    }
  },
  upgradePath: [{
    fromPlan: String,
    discountPercentage: Number,
    validUntil: Date
  }],
  restrictions: [{
    feature: String,
    description: {
      english: String,
      yoruba: String
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionPlanSchema.index({ name: 1 });
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });
subscriptionPlanSchema.index({ targetAudience: 1 });

// Virtual for monthly savings with yearly plan
subscriptionPlanSchema.virtual('yearlySavings').get(function() {
  const monthlyTotal = this.pricing.monthly.amount * 12;
  const yearlyAmount = this.pricing.yearly.amount;
  return monthlyTotal - yearlyAmount;
});

// Virtual for discount percentage on yearly
subscriptionPlanSchema.virtual('yearlyDiscountPercent').get(function() {
  const monthlyTotal = this.pricing.monthly.amount * 12;
  const yearlyAmount = this.pricing.yearly.amount;
  return Math.round(((monthlyTotal - yearlyAmount) / monthlyTotal) * 100);
});

// Static method to get plan by name
subscriptionPlanSchema.statics.findPlanByName = function(planName) {
  return this.findOne({ name: planName, isActive: true });
};

// Static method to get plans for target audience
subscriptionPlanSchema.statics.findPlansForAudience = function(audience) {
  return this.find({
    $or: [
      { targetAudience: audience },
      { targetAudience: 'all' }
    ],
    isActive: true
  }).sort('sortOrder');
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

// Transaction/Payment model
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  type: {
    type: String,
    enum: [
      'subscription',
      'training_course',
      'premium_feature',
      'marketplace_commission',
      'consultation',
      'api_usage',
      'data_export',
      'insurance_premium'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'successful', 'failed', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  paymentMethod: {
    provider: {
      type: String,
      enum: ['paystack', 'flutterwave', 'bank_transfer', 'ussd', 'cash', 'wallet'],
      required: true
    },
    channel: String, // card, bank, ussd, qr, etc.
    authorizationCode: String, // For recurring payments
    bin: String,
    last4: String,
    bank: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'commercial', 'enterprise']
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly']
    },
    startDate: Date,
    endDate: Date,
    isRecurring: {
      type: Boolean,
      default: false
    },
    nextBillingDate: Date
  },
  metadata: {
    description: String,
    customFields: mongoose.Schema.Types.Mixed,
    invoiceNumber: String,
    receiptNumber: String
  },
  paymentData: {
    // Store provider-specific data
    paystack: {
      access_code: String,
      transaction_id: String,
      customer_code: String,
      authorization_code: String
    },
    flutterwave: {
      tx_ref: String,
      transaction_id: String,
      customer_id: String
    }
  },
  fees: {
    platformFee: {
      type: Number,
      default: 0
    },
    gatewayFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  refund: {
    amount: {
      type: Number,
      default: 0
    },
    reason: String,
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  webhookData: [{
    provider: String,
    event: String,
    data: mongoose.Schema.Types.Mixed,
    receivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  paidAt: Date,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: Date
}, {
  timestamps: true
});

// Indexes for transactions
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ 'subscription.nextBillingDate': 1 });
transactionSchema.index({ paidAt: -1 });

// Virtual for transaction age
transactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Virtual for net amount (after fees)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount - (this.fees.totalFees || 0);
});

// Instance method to mark as paid
transactionSchema.methods.markAsPaid = function(paymentData = {}) {
  this.status = 'successful';
  this.paidAt = new Date();
  Object.assign(this.paymentData, paymentData);
  return this.save();
};

// Instance method to mark as failed
transactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.retryCount += 1;
  
  if (this.retryCount < this.maxRetries) {
    // Schedule next retry (exponential backoff)
    this.nextRetryAt = new Date(Date.now() + Math.pow(2, this.retryCount) * 60 * 1000);
  }
  
  return this.save();
};

// Static method to find pending transactions for retry
transactionSchema.statics.findPendingRetries = function() {
  return this.find({
    status: 'failed',
    nextRetryAt: { $lte: new Date() },
    retryCount: { $lt: this.maxRetries }
  });
};

const Transaction = mongoose.model('Transaction', transactionSchema);

// Usage tracking model
const usageTrackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feature: {
    type: String,
    required: true,
    enum: [
      'api_call',
      'data_export',
      'price_alert',
      'training_access',
      'marketplace_listing',
      'consultation_hour',
      'report_generation',
      'notification_sent'
    ]
  },
  count: {
    type: Number,
    default: 1
  },
  metadata: mongoose.Schema.Types.Mixed,
  period: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      required: true
    }
  },
  resetAt: Date // When the counter resets (daily/monthly)
}, {
  timestamps: true
});

// Compound index for efficient usage queries
usageTrackingSchema.index({ 
  user: 1, 
  feature: 1, 
  'period.year': 1, 
  'period.month': 1, 
  'period.day': 1 
});

// Static method to increment usage
usageTrackingSchema.statics.incrementUsage = async function(userId, feature, count = 1, metadata = {}) {
  const now = new Date();
  const period = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate()
  };
  
  const filter = { user: userId, feature, period };
  const update = { 
    $inc: { count },
    $set: { metadata }
  };
  
  return this.findOneAndUpdate(filter, update, { 
    upsert: true, 
    new: true,
    setDefaultsOnInsert: true
  });
};

// Static method to get user usage for a feature in current period
usageTrackingSchema.statics.getUserUsage = function(userId, feature, timeframe = 'monthly') {
  const now = new Date();
  let filter = { user: userId, feature };
  
  if (timeframe === 'daily') {
    filter.period = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  } else if (timeframe === 'monthly') {
    filter['period.year'] = now.getFullYear();
    filter['period.month'] = now.getMonth() + 1;
  }
  
  return this.aggregate([
    { $match: filter },
    { $group: { _id: null, totalUsage: { $sum: '$count' } } }
  ]);
};

const UsageTracking = mongoose.model('UsageTracking', usageTrackingSchema);

module.exports = {
  SubscriptionPlan,
  Transaction,
  UsageTracking
};
