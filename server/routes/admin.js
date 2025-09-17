const express = require('express');
const { protect, restrictTo, requirePermission } = require('../middleware/auth');
const { SubscriptionPlan, Transaction, UsageTracking } = require('../models/Subscription');
const { ProductListing, MarketplaceTransaction } = require('../models/Marketplace');
const User = require('../models/User');
const CropPrice = require('../models/CropPrice');
const YouthTraining = require('../models/YouthTraining');

const router = express.Router();

// All admin routes require admin role
router.use(protect);
router.use(restrictTo('admin'));

// ========== DASHBOARD OVERVIEW ==========

// GET ADMIN DASHBOARD OVERVIEW
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'week') {
      dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'month') {
      dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'year') {
      dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    }

    // User Analytics
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ createdAt: dateFilter });
    const verifiedUsers = await User.countDocuments({ 'verification.email.isVerified': true });

    // Revenue Analytics
    const revenueStats = await Transaction.aggregate([
      {
        $match: {
          status: 'successful',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$type',
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageValue: { $avg: '$amount' }
        }
      }
    ]);

    const totalRevenue = await Transaction.aggregate([
      {
        $match: { status: 'successful' }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Subscription Analytics
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription.tier',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0] } }
        }
      }
    ]);

    // Monthly Recurring Revenue
    const mrr = await User.aggregate([
      {
        $match: {
          'subscription.status': 'active',
          'subscription.tier': { $ne: 'free' }
        }
      },
      {
        $lookup: {
          from: 'subscriptionplans',
          localField: 'subscription.tier',
          foreignField: 'name',
          as: 'plan'
        }
      },
      {
        $group: {
          _id: null,
          mrr: { $sum: { $arrayElemAt: ['$plan.pricing.monthly.amount', 0] } }
        }
      }
    ]);

    // Marketplace Analytics
    const marketplaceStats = await MarketplaceTransaction.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'delivered'] },
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalVolume: { $sum: '$orderDetails.totalAmount' },
          totalCommissions: { $sum: '$commission.platformCommission' },
          averageOrderValue: { $avg: '$orderDetails.totalAmount' }
        }
      }
    ]);

    // Training Analytics
    const trainingStats = await YouthTraining.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          totalEnrollments: { $sum: '$enrollments' },
          totalCompletions: { $sum: '$completions' },
          paidCourses: { $sum: { $cond: [{ $eq: ['$isFree', false] }, 1, 0] } }
        }
      }
    ]);

    // Top Performing Content
    const topCrops = await CropPrice.aggregate([
      {
        $match: { lastUpdated: dateFilter }
      },
      {
        $group: {
          _id: '$cropName',
          updates: { $sum: 1 },
          averagePrice: { $avg: '$pricePerUnit.value' },
          markets: { $addToSet: '$market.name' }
        }
      },
      { $sort: { updates: -1 } },
      { $limit: 5 }
    ]);

    // System Health
    const systemHealth = {
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json({
      status: 'success',
      data: {
        overview: {
          users: {
            total: totalUsers,
            new: newUsers,
            verified: verifiedUsers,
            byRole: userStats
          },
          revenue: {
            total: totalRevenue[0]?.total || 0,
            period: revenueStats.reduce((sum, item) => sum + item.totalRevenue, 0),
            mrr: mrr[0]?.mrr || 0,
            byType: revenueStats
          },
          subscriptions: {
            byTier: subscriptionStats,
            conversionRate: totalUsers > 0 ? ((totalUsers - (subscriptionStats.find(s => s._id === 'free')?.count || 0)) / totalUsers * 100) : 0
          },
          marketplace: marketplaceStats[0] || {
            totalTransactions: 0,
            totalVolume: 0,
            totalCommissions: 0,
            averageOrderValue: 0
          },
          training: trainingStats[0] || {
            totalCourses: 0,
            totalEnrollments: 0,
            totalCompletions: 0,
            paidCourses: 0
          },
          topCrops,
          systemHealth
        },
        timeframe
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// ========== USER MANAGEMENT ==========

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const {
      role,
      status,
      subscriptionTier,
      verified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (subscriptionTier) filter['subscription.tier'] = subscriptionTier;
    if (verified !== undefined) filter['verification.email.isVerified'] = verified === 'true';
    
    if (search) {
      filter.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password -security.apiKeys -security.passwordResetToken')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
});

// GET SINGLE USER
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -security.passwordResetToken');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    // Get user's recent activity
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    const marketplaceActivity = await MarketplaceTransaction.find({
      $or: [{ buyer: user._id }, { seller: user._id }]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('listing', 'title crop');

    const usageStats = await UsageTracking.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        activity: {
          recentTransactions,
          marketplaceActivity,
          usageStats
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user details'
    });
  }
});

// UPDATE USER
router.patch('/users/:id', async (req, res) => {
  try {
    const allowedUpdates = [
      'status', 
      'role', 
      'subscription.tier', 
      'subscription.status',
      'verification.email.isVerified',
      'verification.phone.isVerified',
      'notes'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -security.passwordResetToken');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
});

// ========== REVENUE MANAGEMENT ==========

// GET REVENUE ANALYTICS
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'month', type } = req.query;

    let dateFilter = {};
    let groupBy = {};
    const now = new Date();

    if (period === 'day') {
      dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (period === 'week') {
      dateFilter = { $gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) };
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else if (period === 'month') {
      dateFilter = { $gte: new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) };
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'year') {
      dateFilter = { $gte: new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000) };
      groupBy = {
        year: { $year: '$createdAt' }
      };
    }

    const matchFilter = {
      status: 'successful',
      createdAt: dateFilter
    };

    if (type) matchFilter.type = type;

    const revenueData = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          averageValue: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Revenue by type
    const revenueByType = await Transaction.aggregate([
      { $match: { status: 'successful', createdAt: dateFilter } },
      {
        $group: {
          _id: '$type',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          percentage: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = revenueByType.reduce((sum, item) => sum + item.revenue, 0);
    revenueByType.forEach(item => {
      item.percentage = totalRevenue > 0 ? (item.revenue / totalRevenue * 100) : 0;
    });

    // Top customers by revenue
    const topCustomers = await Transaction.aggregate([
      { $match: { status: 'successful', createdAt: dateFilter } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          totalSpent: 1,
          transactions: 1,
          user: { $arrayElemAt: ['$user', 0] }
        }
      }
    ]);

    // Revenue projections (simple linear trend)
    const projections = calculateRevenueProjections(revenueData);

    res.status(200).json({
      status: 'success',
      data: {
        revenue: {
          timeSeries: revenueData,
          byType: revenueByType,
          topCustomers,
          projections,
          period
        }
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch revenue analytics'
    });
  }
});

// ========== CONTENT MANAGEMENT ==========

// GET CONTENT ANALYTICS
router.get('/content', async (req, res) => {
  try {
    // Crop price updates
    const priceUpdates = await CropPrice.aggregate([
      {
        $group: {
          _id: '$cropName',
          updates: { $sum: 1 },
          markets: { $addToSet: '$market.name' },
          lastUpdate: { $max: '$lastUpdated' },
          averagePrice: { $avg: '$pricePerUnit.value' }
        }
      },
      { $sort: { updates: -1 } }
    ]);

    // Training content performance
    const trainingPerformance = await YouthTraining.find()
      .sort({ enrollments: -1 })
      .limit(10);

    // Marketplace listings
    const listingStats = await ProductListing.aggregate([
      {
        $group: {
          _id: '$crop.name',
          totalListings: { $sum: 1 },
          activeListings: { $sum: { $cond: ['$isActive', 1, 0] } },
          averagePrice: { $avg: '$pricing.pricePerUnit' },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { totalViews: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        content: {
          priceUpdates,
          trainingPerformance,
          listingStats
        }
      }
    });

  } catch (error) {
    console.error('Content analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch content analytics'
    });
  }
});

// ========== SUBSCRIPTION MANAGEMENT ==========

// GET SUBSCRIPTION ANALYTICS
router.get('/subscriptions', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'week') {
      dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'month') {
      dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'year') {
      dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
    }

    // Current subscription distribution
    const subscriptionDistribution = await User.aggregate([
      {
        $group: {
          _id: '$subscription.tier',
          count: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0] } },
          recentCount: { $sum: { $cond: [{ $gte: ['$subscription.startDate', dateFilter.$gte || new Date(0)] }, 1, 0] } }
        }
      }
    ]);

    // Churn analysis
    const churnData = await User.aggregate([
      {
        $match: {
          'subscription.status': { $in: ['cancelled', 'expired'] },
          'subscription.expiresAt': dateFilter
        }
      },
      {
        $group: {
          _id: '$subscription.tier',
          churnedUsers: { $sum: 1 }
        }
      }
    ]);

    // Upgrade/downgrade patterns
    const subscriptionChanges = await Transaction.aggregate([
      {
        $match: {
          type: 'subscription',
          status: 'successful',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$subscription.plan',
          newSubscriptions: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly Recurring Revenue trend
    const mrrTrend = await calculateMRRTrend(timeframe);

    res.status(200).json({
      status: 'success',
      data: {
        subscriptions: {
          distribution: subscriptionDistribution,
          churn: churnData,
          changes: subscriptionChanges,
          mrrTrend,
          timeframe
        }
      }
    });

  } catch (error) {
    console.error('Subscription analytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subscription analytics'
    });
  }
});

// ========== SYSTEM MONITORING ==========

// GET SYSTEM HEALTH
router.get('/system/health', async (req, res) => {
  try {
    const dbStats = await User.db.db.stats();
    
    const systemHealth = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: 'connected',
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes
      },
      api: {
        totalRequests: await getAPIUsageStats(),
        errorRate: await getErrorRate(),
        averageResponseTime: await getAverageResponseTime()
      }
    };

    res.status(200).json({
      status: 'success',
      data: { systemHealth }
    });

  } catch (error) {
    console.error('System health error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch system health'
    });
  }
});

// GET USAGE STATISTICS
router.get('/system/usage', async (req, res) => {
  try {
    const { timeframe = 'day' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    if (timeframe === 'hour') {
      dateFilter = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'day') {
      dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    } else if (timeframe === 'week') {
      dateFilter = { $gte: new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) };
    }

    const usageStats = await UsageTracking.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            feature: '$feature',
            period: getPeriodGroup(timeframe)
          },
          usage: { $sum: '$count' },
          users: { $addToSet: '$user' }
        }
      },
      {
        $group: {
          _id: '$_id.feature',
          totalUsage: { $sum: '$usage' },
          uniqueUsers: { $sum: { $size: '$users' } },
          periods: {
            $push: {
              period: '$_id.period',
              usage: '$usage'
            }
          }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        usage: {
          stats: usageStats,
          timeframe
        }
      }
    });

  } catch (error) {
    console.error('Usage statistics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch usage statistics'
    });
  }
});

// Helper Functions

function calculateRevenueProjections(revenueData) {
  if (revenueData.length < 3) return [];

  const revenues = revenueData.map(item => item.revenue);
  const trend = calculateLinearTrend(revenues);
  const projections = [];

  for (let i = 1; i <= 6; i++) {
    const projected = revenues[revenues.length - 1] + (trend.slope * i);
    projections.push({
      period: i,
      projectedRevenue: Math.max(0, projected),
      confidence: Math.max(0.3, 0.9 - (i * 0.1))
    });
  }

  return projections;
}

function calculateLinearTrend(values) {
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i);
  const y = values;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

async function calculateMRRTrend(timeframe) {
  // Simplified MRR calculation - in production, this would be more sophisticated
  const plans = await SubscriptionPlan.find({ isActive: true });
  const planPrices = {};
  plans.forEach(plan => {
    planPrices[plan.name] = plan.pricing.monthly.amount;
  });

  const activeSubscriptions = await User.aggregate([
    {
      $match: {
        'subscription.status': 'active',
        'subscription.tier': { $ne: 'free' }
      }
    },
    {
      $group: {
        _id: '$subscription.tier',
        count: { $sum: 1 }
      }
    }
  ]);

  let totalMRR = 0;
  activeSubscriptions.forEach(sub => {
    totalMRR += (planPrices[sub._id] || 0) * sub.count;
  });

  return [{ period: new Date().toISOString().slice(0, 7), mrr: totalMRR }];
}

async function getAPIUsageStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await UsageTracking.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: null, total: { $sum: '$count' } } }
  ]).then(result => result[0]?.total || 0);
}

async function getErrorRate() {
  // Simplified error rate - in production, you'd track this more systematically
  return Math.random() * 5; // Mock error rate between 0-5%
}

async function getAverageResponseTime() {
  // Simplified response time - in production, you'd use APM tools
  return Math.random() * 500 + 100; // Mock response time between 100-600ms
}

function getPeriodGroup(timeframe) {
  if (timeframe === 'hour') {
    return {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
      hour: { $hour: '$createdAt' }
    };
  } else if (timeframe === 'day') {
    return {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' }
    };
  } else {
    return {
      year: { $year: '$createdAt' },
      week: { $week: '$createdAt' }
    };
  }
}

module.exports = router;
