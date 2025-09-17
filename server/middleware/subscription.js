const User = require('../models/User');

// Middleware to check subscription access for specific features
const checkSubscriptionAccess = (feature) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Admin bypass
      if (user.role === 'admin') {
        return next();
      }

      // Check if subscription is active
      if (!user.isSubscriptionActive) {
        return res.status(403).json({
          status: 'fail',
          message: 'Your subscription has expired. Please upgrade to access this feature.',
          redirectTo: '/subscription/upgrade'
        });
      }

      // Define feature access by tier
      const featureAccess = {
        priceAlerts: ['basic', 'premium', 'commercial', 'enterprise'],
        analytics: ['premium', 'commercial', 'enterprise'],
        api: ['commercial', 'enterprise'],
        export: ['premium', 'commercial', 'enterprise'],
        marketplace: ['basic', 'premium', 'commercial', 'enterprise'],
        training: ['free', 'basic', 'premium', 'commercial', 'enterprise']
      };

      // Check if user's tier has access to the feature
      const allowedTiers = featureAccess[feature] || [];
      if (!allowedTiers.includes(user.subscription.tier)) {
        return res.status(403).json({
          status: 'fail',
          message: `This feature requires a higher subscription tier.`,
          currentTier: user.subscription.tier,
          requiredTiers: allowedTiers,
          redirectTo: '/subscription/upgrade'
        });
      }

      // Check specific feature in subscription features array
      if (!user.canAccessFeature(feature)) {
        return res.status(403).json({
          status: 'fail',
          message: `Your subscription does not include access to ${feature}.`,
          feature,
          redirectTo: '/subscription/upgrade'
        });
      }

      next();
    } catch (error) {
      console.error('Subscription access check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking subscription access'
      });
    }
  };
};

// Function to track feature usage
const trackUsage = async (userId, feature, action) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.error('User not found for usage tracking:', userId);
      return;
    }

    // Update activity features used
    if (!user.activity.featuresUsed.includes(feature)) {
      user.activity.featuresUsed.push(feature);
    }

    // Track specific usage metrics
    switch (feature) {
      case 'priceAlerts':
        if (action === 'create') {
          // Could track alert creation count
          user.activity.contributions.priceReports += 1;
        }
        break;

      case 'analytics':
        // Track analytics usage
        break;

      case 'api':
        // Track API usage
        break;

      default:
        // General feature usage tracking
        break;
    }

    // Update last active date
    user.activity.lastActiveDate = new Date();

    await user.save({ validateBeforeSave: false });

  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw error to avoid breaking the main flow
  }
};

module.exports = {
  checkSubscriptionAccess,
  trackUsage
};
