const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Create and send JWT token
const createSendToken = (user, statusCode, res, message = 'Authentication successful') => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    user,
    data: {
      user
    }
  });
};

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user account is active
    if (currentUser.status !== 'active') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account is not active. Please contact support.'
      });
    }

    // 5) Update user activity
    currentUser.activity.lastLogin = new Date();
    currentUser.activity.loginCount += 1;
    await currentUser.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Please log in again.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your token has expired. Please log in again.'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong during authentication.'
    });
  }
};

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check subscription access
const requireSubscription = (requiredTier = 'basic', feature = null) => {
  return (req, res, next) => {
    const user = req.user;
    
    // Admin bypass
    if (user.role === 'admin') return next();
    
    // Check if subscription is active
    if (!user.isSubscriptionActive) {
      return res.status(403).json({
        status: 'fail',
        message: 'Your subscription has expired. Please upgrade to access this feature.',
        redirectTo: '/subscription/upgrade'
      });
    }
    
    // Define tier hierarchy
    const tierHierarchy = {
      free: 0,
      basic: 1,
      premium: 2,
      commercial: 3,
      enterprise: 4
    };
    
    // Check tier level
    if (tierHierarchy[user.subscription.tier] < tierHierarchy[requiredTier]) {
      return res.status(403).json({
        status: 'fail',
        message: `This feature requires ${requiredTier} subscription or higher.`,
        currentTier: user.subscription.tier,
        requiredTier,
        redirectTo: '/subscription/upgrade'
      });
    }
    
    // Check specific feature access
    if (feature && !user.canAccessFeature(feature)) {
      return res.status(403).json({
        status: 'fail',
        message: `Your subscription does not include access to ${feature}.`,
        feature,
        redirectTo: '/subscription/upgrade'
      });
    }
    
    next();
  };
};

// Check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        status: 'fail',
        message: `You do not have ${permission} permission.`
      });
    }
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next();
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    
    if (currentUser && currentUser.status === 'active') {
      req.user = currentUser;
    }
    
    next();
  } catch (error) {
    // Silently continue without user
    next();
  }
};

// Rate limiting per user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user._id.toString();
    const now = Date.now();
    
    if (!requests.has(userId)) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userRequests = requests.get(userId);
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + windowMs;
    } else {
      userRequests.count += 1;
    }
    
    if (userRequests.count > maxRequests) {
      return res.status(429).json({
        status: 'fail',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

// Log user activity
const logActivity = (activityType) => {
  return async (req, res, next) => {
    if (req.user) {
      try {
        await req.user.updateActivity(activityType);
      } catch (error) {
        console.log('Error logging activity:', error.message);
        // Don't fail the request for logging errors
      }
    }
    next();
  };
};

// Verify API key for external access
const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        status: 'fail',
        message: 'API key is required'
      });
    }
    
    const user = await User.findOne({
      'security.apiKeys.key': apiKey,
      'security.apiKeys.active': true
    });
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid API key'
      });
    }
    
    // Find the specific API key and update usage
    const keyObj = user.security.apiKeys.find(k => k.key === apiKey && k.active);
    if (keyObj) {
      keyObj.lastUsed = new Date();
      keyObj.usage += 1;
      await user.save({ validateBeforeSave: false });
    }
    
    req.user = user;
    req.apiKey = keyObj;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error verifying API key'
    });
  }
};

// Check if user is verified
const requireVerification = (verificationType = 'email') => {
  return (req, res, next) => {
    const user = req.user;
    
    if (verificationType === 'email' && !user.verification.email.isVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Please verify your email address to access this feature.',
        redirectTo: '/verify-email'
      });
    }
    
    if (verificationType === 'phone' && !user.verification.phone.isVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Please verify your phone number to access this feature.',
        redirectTo: '/verify-phone'
      });
    }
    
    if (verificationType === 'identity' && !user.verification.identity.isVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Please complete identity verification to access this feature.',
        redirectTo: '/verify-identity'
      });
    }
    
    next();
  };
};

module.exports = {
  signToken,
  createSendToken,
  protect,
  restrictTo,
  requireSubscription,
  requirePermission,
  optionalAuth,
  userRateLimit,
  logActivity,
  verifyApiKey,
  requireVerification
};
