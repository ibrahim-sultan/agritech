const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { createSendToken, protect, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for auth routes (disabled in development)
const authLimiter = process.env.NODE_ENV === 'production' ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many authentication attempts, please try again later.'
  }
}) : (req, res, next) => next(); // Skip in development

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many password reset attempts, please try again later.'
  }
});

// Helper function to generate verification codes
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Helper function to send verification SMS (mock implementation)
const sendSMS = async (phone, message) => {
  // In production, integrate with SMS provider like Twilio, Termii, etc.
  console.log(`SMS to ${phone}: ${message}`);
  return true;
};

// Helper function to send verification email (mock implementation)
const sendEmail = async (email, subject, message) => {
  // In production, integrate with email provider like SendGrid, Mailgun, etc.
  console.log(`Email to ${email}: ${subject} - ${message}`);
  return true;
};

// REGISTER NEW USER
router.post('/register', authLimiter, async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      firstName,
      lastName,
      role = 'farmer',
      preferredLanguage = 'english',
      referralCode,
      profile: clientProfile = {}
    } = req.body;

    // Basic validation
    if (!email || !phone || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide all required fields: email, phone, password, firstName, lastName'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email or phone number already exists'
      });
    }

    // Handle referral
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid referral code'
        });
      }
    }

    // Set initial subscription features based on role
    let subscriptionFeatures = ['basic_prices'];
    if (role === 'youth') {
      subscriptionFeatures.push('training_certificates');
    }

    // Create new user
    const newUser = await User.create({
      email,
      phone,
      password,
      profile: {
        firstName,
        lastName,
        preferredLanguage,
        location: {
          address: clientProfile.location?.address || ''
        }
      },
      role,
      referredBy: referrer?._id,
      subscription: {
        features: subscriptionFeatures
      }
    });

    // Update referrer's contribution count
    if (referrer) {
      referrer.activity.contributions.referrals += 1;
      await referrer.save({ validateBeforeSave: false });
    }

    // Generate email verification token
    const emailToken = crypto.randomBytes(32).toString('hex');
    newUser.verification.email.token = crypto
      .createHash('sha256')
      .update(emailToken)
      .digest('hex');
    newUser.verification.email.tokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Generate phone verification code
    const phoneCode = generateVerificationCode();
    newUser.verification.phone.code = phoneCode;
    newUser.verification.phone.codeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await newUser.save({ validateBeforeSave: false });

    // Send verification email and SMS
    const verificationEmailUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${emailToken}`;
    await sendEmail(
      email,
      'Verify Your AgriTech Account',
      `Click this link to verify your email: ${verificationEmailUrl}`
    );

    await sendSMS(
      phone,
      `Your AgriTech verification code is: ${phoneCode}. Valid for 10 minutes.`
    );

    // Create and send token
    createSendToken(newUser, 201, res, 'User registered successfully! Please check your email and SMS for verification.');

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        status: 'fail',
        message: `This ${field} is already registered.`
      });
    }

    return res.status(400).json({
      status: 'fail',
      message: error.message || 'Registration failed'
    });
  }
});

// LOGIN USER
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Check if credentials are provided
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email/phone and password'
      });
    }

    // Find user by email or phone
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect credentials'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account is not active. Please contact support.',
        accountStatus: user.status
      });
    }

    // Reset failed login attempts on successful login
    if (user.security.loginAttempts.count > 0) {
      user.security.loginAttempts.count = 0;
      user.security.loginAttempts.lockedUntil = undefined;
      await user.save({ validateBeforeSave: false });
    }

    createSendToken(user, 200, res, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Login failed'
    });
  }
});

// LOGOUT USER
router.post('/logout', (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

// VERIFY EMAIL
router.get('/verify-email/:token', async (req, res) => {
  try {
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      'verification.email.token': hashedToken,
      'verification.email.tokenExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }

    // Verify email
    user.verification.email.isVerified = true;
    user.verification.email.token = undefined;
    user.verification.email.tokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Email verification failed'
    });
  }
});

// VERIFY PHONE
router.post('/verify-phone', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide verification code'
      });
    }

    const user = req.user;

    // Check if code is valid and not expired
    if (user.verification.phone.code !== code || 
        user.verification.phone.codeExpires < Date.now()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired verification code'
      });
    }

    // Verify phone
    user.verification.phone.isVerified = true;
    user.verification.phone.code = undefined;
    user.verification.phone.codeExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Phone verification failed'
    });
  }
});

// RESEND PHONE VERIFICATION CODE
router.post('/resend-phone-code', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.verification.phone.isVerified) {
      return res.status(400).json({
        status: 'fail',
        message: 'Phone number is already verified'
      });
    }

    // Generate new verification code
    const phoneCode = generateVerificationCode();
    user.verification.phone.code = phoneCode;
    user.verification.phone.codeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send SMS
    await sendSMS(
      user.phone,
      `Your AgriTech verification code is: ${phoneCode}. Valid for 10 minutes.`
    );

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Resend phone code error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send verification code'
    });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'Token sent to email!'
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.security.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Send password reset email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    await sendEmail(
      user.email,
      'Password Reset Request',
      `Reset your password using this link: ${resetURL} (Valid for 10 minutes)`
    );

    res.status(200).json({
      status: 'success',
      message: 'Password reset token sent to email!'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'There was an error sending the email'
    });
  }
});

// RESET PASSWORD
router.patch('/reset-password/:token', async (req, res) => {
  try {
    // Get user based on token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      'security.passwordResetToken': hashedToken,
      'security.passwordResetExpires': { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }

    // Set new password
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 6 characters long'
      });
    }

    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, res, 'Password reset successful');

  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Password reset failed'
    });
  }
});

// UPDATE PASSWORD (for logged-in users)
router.patch('/update-password', protect, async (req, res) => {
  try {
    const { passwordCurrent, password } = req.body;

    if (!passwordCurrent || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide current password and new password'
      });
    }

    // Get user from collection with password
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is incorrect'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    createSendToken(user, 200, res, 'Password updated successfully');

  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Password update failed'
    });
  }
});

// GET CURRENT USER
router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get user data'
    });
  }
});

// UPDATE CURRENT USER
router.patch('/update-me', protect, async (req, res) => {
  try {
    // Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is not for password updates. Please use /update-password.'
      });
    }

    // Filter out unwanted fields that are not allowed to be updated
    const allowedFields = [
      'profile.firstName',
      'profile.lastName',
      'profile.avatar',
      'profile.bio',
      'profile.preferredLanguage',
      'profile.location.address',
      'farmingInfo.experience',
      'farmingInfo.primaryCrops',
      'farmingInfo.farmSize',
      'farmingInfo.farmingMethod',
      'preferences.notifications',
      'preferences.priceAlerts',
      'preferences.marketPreferences',
      'preferences.dashboard'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    return res.status(400).json({
      status: 'fail',
      message: error.message || 'User update failed'
    });
  }
});

// DELETE CURRENT USER (deactivate account)
router.delete('/delete-me', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { status: 'inactive' });

    res.status(204).json({
      status: 'success',
      data: null
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Account deactivation failed'
    });
  }
});

// CHECK IF USER EXISTS (for frontend validation)
router.post('/check-user', async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email or phone'
      });
    }

    const query = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const user = await User.findOne(query, 'email phone status');

    if (user) {
      return res.status(200).json({
        status: 'success',
        data: {
          exists: true,
          status: user.status
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        exists: false
      }
    });

  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'User check failed'
    });
  }
});

module.exports = router;
