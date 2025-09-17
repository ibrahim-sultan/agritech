const mongoose = require('mongoose');

// Product Listing Model
const productListingSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  crop: {
    name: {
      type: String,
      required: true,
      enum: ['yam', 'cassava', 'maize', 'tomatoes', 'beans', 'pepper', 'onions', 'plantain', 'rice', 'cocoyam']
    },
    variety: String,
    nameYoruba: String
  },
  quantity: {
    available: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'bag', 'basket', 'tuber', 'tonne', 'crate']
    },
    unitWeight: Number // in kg for standardization
  },
  pricing: {
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    negotiable: {
      type: Boolean,
      default: true
    },
    bulkPricing: [{
      minQuantity: Number,
      pricePerUnit: Number,
      discountPercentage: Number
    }]
  },
  location: {
    state: {
      type: String,
      required: true
    },
    lga: {
      type: String,
      required: true
    },
    community: String,
    farmAddress: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  quality: {
    grade: {
      type: String,
      enum: ['premium', 'standard', 'commercial', 'processing'],
      default: 'standard'
    },
    certifications: [{
      type: String,
      enum: ['organic', 'rainforest_alliance', 'fair_trade', 'local_certification']
    }],
    harvestDate: Date,
    storageConditions: {
      type: String,
      enum: ['fresh', 'dried', 'processed', 'refrigerated']
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'limited', 'sold_out', 'seasonal'],
      default: 'available'
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    availableUntil: Date,
    seasonalInfo: String
  },
  images: [{
    url: String,
    description: String,
    isPrimary: Boolean
  }],
  delivery: {
    options: [{
      type: String,
      enum: ['pickup', 'local_delivery', 'shipping', 'farm_gate']
    }],
    cost: {
      local: Number,
      regional: Number,
      national: Number
    },
    estimatedDays: {
      local: Number,
      regional: Number,
      national: Number
    }
  },
  paymentTerms: {
    acceptedMethods: [{
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'credit', 'escrow']
    }],
    creditTerms: {
      available: Boolean,
      maxCreditDays: Number,
      interestRate: Number
    },
    advancePayment: {
      required: Boolean,
      percentage: Number
    }
  },
  tags: [String],
  views: {
    type: Number,
    default: 0
  },
  favorites: {
    type: Number,
    default: 0
  },
  inquiries: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient queries
productListingSchema.index({ 'crop.name': 1, 'location.state': 1, isActive: 1 });
productListingSchema.index({ seller: 1, isActive: 1 });
productListingSchema.index({ 'pricing.pricePerUnit': 1, 'quantity.available': 1 });
productListingSchema.index({ createdAt: -1, isFeatured: -1 });

const ProductListing = mongoose.model('ProductListing', productListingSchema);

// Transaction Model
const transactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductListing',
    required: true
  },
  orderDetails: {
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: [
      'pending', 'accepted', 'payment_pending', 'paid', 
      'preparing', 'ready_for_pickup', 'in_transit', 
      'delivered', 'completed', 'cancelled', 'disputed'
    ],
    default: 'pending'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'escrow', 'credit'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionReference: String,
    paidAmount: {
      type: Number,
      default: 0
    },
    escrowDetails: {
      escrowId: String,
      releaseConditions: [String],
      isReleased: Boolean
    }
  },
  delivery: {
    method: {
      type: String,
      enum: ['pickup', 'local_delivery', 'shipping', 'farm_gate'],
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String
    },
    scheduledDate: Date,
    estimatedDelivery: Date,
    actualDelivery: Date,
    trackingNumber: String,
    deliveryNotes: String
  },
  communication: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    isSystemMessage: {
      type: Boolean,
      default: false
    }
  }],
  reviews: {
    buyerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      reviewDate: Date
    },
    sellerReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      reviewDate: Date
    }
  },
  disputeInfo: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeReason: String,
    disputeStatus: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed']
    },
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  commission: {
    platformCommission: {
      type: Number,
      default: 0
    },
    commissionRate: {
      type: Number,
      default: 0.03 // 3% default
    },
    isPaid: {
      type: Boolean,
      default: false
    }
  },
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for transactions
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ 'paymentDetails.status': 1 });

// Pre-save middleware to calculate commission
transactionSchema.pre('save', function(next) {
  if (this.isModified('orderDetails.totalAmount') || this.isModified('commission.commissionRate')) {
    this.commission.platformCommission = this.orderDetails.totalAmount * this.commission.commissionRate;
  }
  next();
});

const MarketplaceTransaction = mongoose.model('MarketplaceTransaction', transactionSchema);

// Buyer Request Model (for farmers to request specific products)
const buyerRequestSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  crop: {
    name: {
      type: String,
      required: true,
      enum: ['yam', 'cassava', 'maize', 'tomatoes', 'beans', 'pepper', 'onions', 'plantain', 'rice', 'cocoyam']
    },
    variety: String,
    specifications: String
  },
  quantity: {
    needed: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'bag', 'basket', 'tuber', 'tonne', 'crate']
    }
  },
  budget: {
    maxPricePerUnit: Number,
    totalBudget: Number,
    negotiable: {
      type: Boolean,
      default: true
    }
  },
  location: {
    preferredStates: [String],
    maxDistance: Number, // in kilometers
    deliveryLocation: {
      state: String,
      lga: String,
      address: String
    }
  },
  timeline: {
    neededBy: Date,
    isUrgent: {
      type: Boolean,
      default: false
    }
  },
  quality: {
    minimumGrade: {
      type: String,
      enum: ['premium', 'standard', 'commercial', 'processing']
    },
    requiredCertifications: [String]
  },
  responses: [{
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductListing'
    },
    proposedPrice: Number,
    message: String,
    respondedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  status: {
    type: String,
    enum: ['open', 'in_negotiation', 'closed', 'fulfilled'],
    default: 'open'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for buyer requests
buyerRequestSchema.index({ buyer: 1, isActive: 1 });
buyerRequestSchema.index({ 'crop.name': 1, 'location.preferredStates': 1, isActive: 1 });
buyerRequestSchema.index({ expiresAt: 1 });

const BuyerRequest = mongoose.model('BuyerRequest', buyerRequestSchema);

// Favorite Listings Model
const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductListing',
    required: true
  },
  notes: String
}, {
  timestamps: true
});

favoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

// Review Model
const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceTransaction',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  comment: {
    type: String,
    maxlength: 500
  },
  images: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  helpfulVotes: {
    type: Number,
    default: 0
  },
  response: {
    message: String,
    respondedAt: Date
  }
}, {
  timestamps: true
});

reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ transaction: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = {
  ProductListing,
  MarketplaceTransaction,
  BuyerRequest,
  Favorite,
  Review
};
