const express = require('express');
const { protect, requireSubscription, logActivity } = require('../middleware/auth');
const { ProductListing, MarketplaceTransaction, BuyerRequest, Favorite, Review } = require('../models/Marketplace');
const { UsageTracking } = require('../models/Subscription');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/marketplace/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ========== PRODUCT LISTINGS ==========

// GET ALL LISTINGS - Browse marketplace
router.get('/listings', protect, async (req, res) => {
  try {
    const {
      crop,
      state,
      lga,
      minPrice,
      maxPrice,
      quality,
      availability,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (crop) filter['crop.name'] = crop;
    if (state) filter['location.state'] = state;
    if (lga) filter['location.lga'] = lga;
    if (quality) filter['quality.grade'] = quality;
    if (availability) filter['availability.status'] = availability;
    
    if (minPrice || maxPrice) {
      filter['pricing.pricePerUnit'] = {};
      if (minPrice) filter['pricing.pricePerUnit'].$gte = parseInt(minPrice);
      if (maxPrice) filter['pricing.pricePerUnit'].$lte = parseInt(maxPrice);
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const listings = await ProductListing.find(filter)
      .populate('seller', 'profile.firstName profile.lastName profile.location phone')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProductListing.countDocuments(filter);

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'marketplace_listing');

    res.status(200).json({
      status: 'success',
      results: listings.length,
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get listings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch listings'
    });
  }
});

// GET SINGLE LISTING
router.get('/listings/:id', protect, async (req, res) => {
  try {
    const listing = await ProductListing.findById(req.params.id)
      .populate('seller', 'profile.firstName profile.lastName profile.location phone activity.contributions')
      .populate({
        path: 'seller',
        populate: {
          path: 'activity.contributions',
          select: 'reviews'
        }
      });

    if (!listing || !listing.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found'
      });
    }

    // Increment view count
    listing.views += 1;
    await listing.save();

    // Check if user has favorited this listing
    const isFavorited = await Favorite.findOne({
      user: req.user._id,
      listing: listing._id
    });

    res.status(200).json({
      status: 'success',
      data: {
        listing: {
          ...listing.toObject(),
          isFavorited: !!isFavorited
        }
      }
    });

  } catch (error) {
    console.error('Get listing error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch listing'
    });
  }
});

// CREATE NEW LISTING
router.post('/listings', 
  protect, 
  requireSubscription('free', 'marketplace_access'),
  upload.array('images', 5),
  async (req, res) => {
    try {
      // Check listing limits
      const currentListings = await ProductListing.countDocuments({
        seller: req.user._id,
        isActive: true
      });

      const listingLimit = req.user.subscription.tier === 'free' ? 3 :
                          req.user.subscription.tier === 'basic' ? 10 :
                          req.user.subscription.tier === 'premium' ? 50 : -1;

      if (listingLimit !== -1 && currentListings >= listingLimit) {
        return res.status(429).json({
          status: 'fail',
          message: 'Listing limit exceeded for your subscription tier',
          limit: listingLimit,
          current: currentListings
        });
      }

      // Process uploaded images
      const images = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach((file, index) => {
          images.push({
            url: `/uploads/marketplace/${file.filename}`,
            description: `Image ${index + 1}`,
            isPrimary: index === 0
          });
        });
      }

      // Create listing
      const listingData = {
        ...req.body,
        seller: req.user._id,
        images,
        location: {
          ...req.body.location,
          state: req.user.profile.location.state,
          lga: req.user.profile.location.lga
        }
      };

      // Parse JSON fields if they're strings
      if (typeof listingData.crop === 'string') {
        listingData.crop = JSON.parse(listingData.crop);
      }
      if (typeof listingData.quantity === 'string') {
        listingData.quantity = JSON.parse(listingData.quantity);
      }
      if (typeof listingData.pricing === 'string') {
        listingData.pricing = JSON.parse(listingData.pricing);
      }

      const listing = await ProductListing.create(listingData);

      // Track usage
      await UsageTracking.incrementUsage(req.user._id, 'marketplace_listing');

      res.status(201).json({
        status: 'success',
        message: 'Listing created successfully',
        data: { listing }
      });

    } catch (error) {
      console.error('Create listing error:', error);
      return res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create listing'
      });
    }
  }
);

// UPDATE LISTING
router.patch('/listings/:id', protect, async (req, res) => {
  try {
    const listing = await ProductListing.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found or you do not have permission to edit it'
      });
    }

    Object.assign(listing, req.body);
    await listing.save();

    res.status(200).json({
      status: 'success',
      message: 'Listing updated successfully',
      data: { listing }
    });

  } catch (error) {
    console.error('Update listing error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update listing'
    });
  }
});

// DELETE LISTING
router.delete('/listings/:id', protect, async (req, res) => {
  try {
    const listing = await ProductListing.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!listing) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found or you do not have permission to delete it'
      });
    }

    listing.isActive = false;
    await listing.save();

    res.status(200).json({
      status: 'success',
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete listing'
    });
  }
});

// ========== TRANSACTIONS ==========

// CREATE ORDER/TRANSACTION
router.post('/orders', protect, async (req, res) => {
  try {
    const { listingId, quantity, deliveryMethod, paymentMethod, deliveryAddress } = req.body;

    // Get listing
    const listing = await ProductListing.findById(listingId).populate('seller');
    
    if (!listing || !listing.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Listing not found or no longer available'
      });
    }

    // Check if buyer is not the seller
    if (listing.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'fail',
        message: 'You cannot buy your own product'
      });
    }

    // Check availability
    if (listing.quantity.available < quantity) {
      return res.status(400).json({
        status: 'fail',
        message: 'Insufficient quantity available'
      });
    }

    // Calculate pricing
    let unitPrice = listing.pricing.pricePerUnit;
    
    // Check for bulk pricing
    if (listing.pricing.bulkPricing && listing.pricing.bulkPricing.length > 0) {
      const applicableBulkPrice = listing.pricing.bulkPricing
        .filter(bp => quantity >= bp.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];
      
      if (applicableBulkPrice) {
        unitPrice = applicableBulkPrice.pricePerUnit;
      }
    }

    const totalAmount = unitPrice * quantity;
    const deliveryFee = calculateDeliveryFee(listing, deliveryMethod, deliveryAddress);
    const platformFee = totalAmount * 0.03; // 3% platform fee
    const grandTotal = totalAmount + deliveryFee + platformFee;

    // Create transaction
    const transaction = await MarketplaceTransaction.create({
      buyer: req.user._id,
      seller: listing.seller._id,
      listing: listingId,
      orderDetails: {
        quantity,
        unitPrice,
        totalAmount,
        deliveryFee,
        platformFee,
        grandTotal
      },
      paymentDetails: {
        method: paymentMethod
      },
      delivery: {
        method: deliveryMethod,
        address: deliveryAddress
      },
      timeline: [{
        status: 'pending',
        note: 'Order created',
        updatedBy: req.user._id
      }]
    });

    // Reduce available quantity
    listing.quantity.available -= quantity;
    listing.inquiries += 1;
    await listing.save();

    // Populate transaction for response
    await transaction.populate([
      { path: 'buyer', select: 'profile.firstName profile.lastName phone' },
      { path: 'seller', select: 'profile.firstName profile.lastName phone' },
      { path: 'listing', select: 'title crop images' }
    ]);

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'marketplace_listing');

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create order'
    });
  }
});

// GET USER TRANSACTIONS
router.get('/orders', protect, async (req, res) => {
  try {
    const { type = 'all', status, page = 1, limit = 20 } = req.query;

    let filter = {};
    
    if (type === 'buying') {
      filter.buyer = req.user._id;
    } else if (type === 'selling') {
      filter.seller = req.user._id;
    } else {
      filter.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
    }

    if (status) filter.status = status;

    const transactions = await MarketplaceTransaction.find(filter)
      .populate('buyer', 'profile.firstName profile.lastName')
      .populate('seller', 'profile.firstName profile.lastName')
      .populate('listing', 'title crop images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MarketplaceTransaction.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions'
    });
  }
});

// UPDATE TRANSACTION STATUS
router.patch('/orders/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const transaction = await MarketplaceTransaction.findOne({
      _id: req.params.id,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found'
      });
    }

    // Validate status transition
    const validTransitions = getValidStatusTransitions(transaction.status, req.user._id.toString() === transaction.seller.toString());

    if (!validTransitions.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid status transition'
      });
    }

    transaction.status = status;
    transaction.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: req.user._id
    });

    // Handle commission calculation on completion
    if (status === 'completed' && !transaction.commission.isPaid) {
      transaction.commission.isPaid = true;
    }

    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: 'Transaction status updated successfully',
      data: { transaction }
    });

  } catch (error) {
    console.error('Update transaction status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update transaction status'
    });
  }
});

// ========== BUYER REQUESTS ==========

// CREATE BUYER REQUEST
router.post('/requests', protect, async (req, res) => {
  try {
    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const request = await BuyerRequest.create({
      ...req.body,
      buyer: req.user._id,
      expiresAt
    });

    // Track usage
    await UsageTracking.incrementUsage(req.user._id, 'marketplace_listing');

    res.status(201).json({
      status: 'success',
      message: 'Buyer request created successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Create buyer request error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create buyer request'
    });
  }
});

// GET BUYER REQUESTS
router.get('/requests', protect, async (req, res) => {
  try {
    const { crop, state, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true, expiresAt: { $gt: new Date() } };
    if (crop) filter['crop.name'] = crop;
    if (state) filter['location.preferredStates'] = state;

    const requests = await BuyerRequest.find(filter)
      .populate('buyer', 'profile.firstName profile.lastName profile.location')
      .populate('responses.seller', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BuyerRequest.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get buyer requests error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch buyer requests'
    });
  }
});

// RESPOND TO BUYER REQUEST
router.post('/requests/:id/respond', protect, async (req, res) => {
  try {
    const { listingId, proposedPrice, message } = req.body;

    const request = await BuyerRequest.findById(req.params.id);
    if (!request || !request.isActive) {
      return res.status(404).json({
        status: 'fail',
        message: 'Buyer request not found or expired'
      });
    }

    // Check if seller already responded
    const existingResponse = request.responses.find(
      r => r.seller.toString() === req.user._id.toString()
    );

    if (existingResponse) {
      return res.status(400).json({
        status: 'fail',
        message: 'You have already responded to this request'
      });
    }

    // Add response
    request.responses.push({
      seller: req.user._id,
      listing: listingId,
      proposedPrice,
      message
    });

    if (request.status === 'open') {
      request.status = 'in_negotiation';
    }

    await request.save();

    res.status(200).json({
      status: 'success',
      message: 'Response submitted successfully',
      data: { request }
    });

  } catch (error) {
    console.error('Respond to request error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to respond to request'
    });
  }
});

// ========== FAVORITES ==========

// ADD TO FAVORITES
router.post('/favorites', protect, async (req, res) => {
  try {
    const { listingId, notes } = req.body;

    const favorite = await Favorite.create({
      user: req.user._id,
      listing: listingId,
      notes
    });

    // Increment favorite count on listing
    await ProductListing.findByIdAndUpdate(listingId, { $inc: { favorites: 1 } });

    res.status(201).json({
      status: 'success',
      message: 'Added to favorites',
      data: { favorite }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Listing already in favorites'
      });
    }

    console.error('Add favorite error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add to favorites'
    });
  }
});

// REMOVE FROM FAVORITES
router.delete('/favorites/:listingId', protect, async (req, res) => {
  try {
    const deleted = await Favorite.findOneAndDelete({
      user: req.user._id,
      listing: req.params.listingId
    });

    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Favorite not found'
      });
    }

    // Decrement favorite count on listing
    await ProductListing.findByIdAndUpdate(req.params.listingId, { $inc: { favorites: -1 } });

    res.status(200).json({
      status: 'success',
      message: 'Removed from favorites'
    });

  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to remove from favorites'
    });
  }
});

// GET USER FAVORITES
router.get('/favorites', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'listing',
        populate: {
          path: 'seller',
          select: 'profile.firstName profile.lastName profile.location'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Favorite.countDocuments({ user: req.user._id });

    res.status(200).json({
      status: 'success',
      results: favorites.length,
      data: {
        favorites,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch favorites'
    });
  }
});

// ========== REVIEWS ==========

// CREATE REVIEW
router.post('/reviews', protect, async (req, res) => {
  try {
    const { transactionId, rating, comment } = req.body;

    const transaction = await MarketplaceTransaction.findOne({
      _id: transactionId,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found or not completed'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ transaction: transactionId });
    if (existingReview) {
      return res.status(400).json({
        status: 'fail',
        message: 'Review already exists for this transaction'
      });
    }

    // Determine reviewee
    const revieweeId = req.user._id.toString() === transaction.buyer.toString() 
      ? transaction.seller 
      : transaction.buyer;

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      transaction: transactionId,
      rating,
      comment
    });

    res.status(201).json({
      status: 'success',
      message: 'Review created successfully',
      data: { review }
    });

  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create review'
    });
  }
});

// Helper Functions

function calculateDeliveryFee(listing, deliveryMethod, deliveryAddress) {
  if (deliveryMethod === 'pickup' || deliveryMethod === 'farm_gate') {
    return 0;
  }

  const deliveryCosts = listing.delivery.cost;
  
  if (deliveryAddress && deliveryAddress.state) {
    if (deliveryAddress.state === listing.location.state) {
      return deliveryCosts.local || 500;
    } else {
      return deliveryCosts.regional || 1500;
    }
  }

  return deliveryCosts.national || 3000;
}

function getValidStatusTransitions(currentStatus, isSeller) {
  const transitions = {
    pending: isSeller ? ['accepted', 'cancelled'] : ['cancelled'],
    accepted: isSeller ? ['payment_pending'] : ['payment_pending'],
    payment_pending: isSeller ? ['paid'] : ['paid'],
    paid: isSeller ? ['preparing'] : [],
    preparing: isSeller ? ['ready_for_pickup', 'in_transit'] : [],
    ready_for_pickup: isSeller ? ['delivered'] : ['delivered'],
    in_transit: isSeller ? ['delivered'] : ['delivered'],
    delivered: ['completed'],
    completed: [],
    cancelled: [],
    disputed: ['resolved']
  };

  return transitions[currentStatus] || [];
}

module.exports = router;
