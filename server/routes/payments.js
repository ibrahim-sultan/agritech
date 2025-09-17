const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { protect, requireSubscription } = require('../middleware/auth');
const { SubscriptionPlan, Transaction, UsageTracking } = require('../models/Subscription');
const User = require('../models/User');

const router = express.Router();

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;

// Helper function to make Paystack API calls
const paystackAPI = async (endpoint, data = {}, method = 'POST') => {
  try {
    const config = {
      method,
      url: `https://api.paystack.co${endpoint}`,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    if (method !== 'GET') {
      config.data = data;
    } else if (Object.keys(data).length > 0) {
      config.params = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Paystack API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Payment service error');
  }
};

// Generate unique transaction reference
const generateReference = (prefix = 'AGR') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}_${timestamp}_${random}`;
};

// GET SUBSCRIPTION PLANS
router.get('/plans', async (req, res) => {
  try {
    const { audience } = req.query;
    
    let plans;
    if (audience) {
      plans = await SubscriptionPlan.findPlansForAudience(audience);
    } else {
      plans = await SubscriptionPlan.find({ isActive: true }).sort('sortOrder');
    }

    res.status(200).json({
      status: 'success',
      results: plans.length,
      data: {
        plans
      }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subscription plans'
    });
  }
});

// GET SINGLE SUBSCRIPTION PLAN
router.get('/plans/:planName', async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findPlanByName(req.params.planName);
    
    if (!plan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Subscription plan not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        plan
      }
    });

  } catch (error) {
    console.error('Get plan error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subscription plan'
    });
  }
});

// INITIALIZE SUBSCRIPTION PAYMENT
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { planName, billingCycle = 'monthly', customAmount } = req.body;
    const user = req.user;

    // Get subscription plan
    const plan = await SubscriptionPlan.findPlanByName(planName);
    if (!plan) {
      return res.status(404).json({
        status: 'fail',
        message: 'Subscription plan not found'
      });
    }

    // Calculate amount
    let amount;
    if (customAmount && planName === 'commercial') {
      amount = customAmount;
    } else {
      amount = plan.pricing[billingCycle].amount;
    }

    // Convert to kobo for Paystack
    const amountInKobo = amount * 100;

    // Generate transaction reference
    const reference = generateReference('SUB');

    // Create transaction record
    const transaction = await Transaction.create({
      user: user._id,
      reference,
      amount,
      type: 'subscription',
      paymentMethod: {
        provider: 'paystack'
      },
      subscription: {
        plan: planName,
        billingCycle,
        isRecurring: billingCycle !== 'yearly' // Yearly subscriptions renew automatically
      },
      metadata: {
        description: `${plan.displayName.english} subscription - ${billingCycle}`,
        customFields: {
          planName,
          billingCycle,
          userId: user._id.toString()
        }
      }
    });

    // Initialize Paystack transaction
    const paymentData = {
      email: user.email,
      amount: amountInKobo,
      reference,
      currency: 'NGN',
      callback_url: `${process.env.CLIENT_URL}/subscription/callback`,
      metadata: {
        user_id: user._id.toString(),
        plan_name: planName,
        billing_cycle: billingCycle,
        transaction_id: transaction._id.toString()
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'bank_transfer']
    };

    const paystackResponse = await paystackAPI('/transaction/initialize', paymentData);

    // Update transaction with Paystack data
    transaction.paymentData.paystack = {
      access_code: paystackResponse.data.access_code,
      transaction_id: paystackResponse.data.reference
    };
    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: 'Payment initialized successfully',
      data: {
        authorization_url: paystackResponse.data.authorization_url,
        access_code: paystackResponse.data.access_code,
        reference: reference,
        amount: amount,
        plan: plan.displayName
      }
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Subscription initialization failed'
    });
  }
});

// VERIFY PAYMENT
router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;
    const user = req.user;

    // Find transaction
    const transaction = await Transaction.findOne({ 
      reference, 
      user: user._id,
      status: { $ne: 'successful' }
    });

    if (!transaction) {
      return res.status(404).json({
        status: 'fail',
        message: 'Transaction not found or already processed'
      });
    }

    // Verify with Paystack
    const verification = await paystackAPI(`/transaction/verify/${reference}`, {}, 'GET');

    if (verification.data.status === 'success') {
      // Update transaction
      await transaction.markAsPaid({
        paystack: {
          transaction_id: verification.data.id,
          customer_code: verification.data.customer?.customer_code,
          authorization_code: verification.data.authorization?.authorization_code
        }
      });

      // Update user subscription
      const plan = await SubscriptionPlan.findPlanByName(transaction.subscription.plan);
      
      if (plan) {
        const subscriptionEndDate = new Date();
        if (transaction.subscription.billingCycle === 'yearly') {
          subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        } else {
          subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        }

        // Update user subscription details
        user.subscription.tier = transaction.subscription.plan;
        user.subscription.status = 'active';
        user.subscription.expiresAt = subscriptionEndDate;
        user.subscription.features = plan.features.map(f => f.name);
        user.subscription.paymentMethod.provider = 'paystack';
        
        if (verification.data.authorization?.last4) {
          user.subscription.paymentMethod.lastFour = verification.data.authorization.last4;
        }

        // Update financial records
        user.financial.totalSpent += transaction.amount;
        user.financial.paymentHistory.push({
          amount: transaction.amount,
          type: 'subscription',
          status: 'completed',
          reference: reference,
          provider: 'paystack',
          paidAt: new Date()
        });

        await user.save();

        // Send confirmation (in production, send actual emails/SMS)
        console.log(`Subscription activated for ${user.email}: ${transaction.subscription.plan}`);
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment verified and subscription activated',
        data: {
          transaction: {
            reference: transaction.reference,
            amount: transaction.amount,
            status: transaction.status,
            paidAt: transaction.paidAt
          },
          subscription: {
            tier: user.subscription.tier,
            expiresAt: user.subscription.expiresAt,
            features: user.subscription.features
          }
        }
      });

    } else {
      // Payment failed
      await transaction.markAsFailed(verification.data.gateway_response || 'Payment verification failed');

      res.status(400).json({
        status: 'fail',
        message: 'Payment verification failed',
        data: {
          gateway_response: verification.data.gateway_response
        }
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Payment verification failed'
    });
  }
});

// PAYSTACK WEBHOOK
router.post('/webhook/paystack', (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid signature'
      });
    }

    const event = req.body;
    console.log('Paystack webhook received:', event.event);

    // Process webhook events
    processPaystackWebhook(event);

    res.status(200).json({
      status: 'success'
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Webhook processing failed'
    });
  }
});

// Process Paystack webhook events
const processPaystackWebhook = async (event) => {
  try {
    const { event: eventType, data } = event;

    // Find transaction by reference
    const transaction = await Transaction.findOne({ 
      reference: data.reference 
    }).populate('user');

    if (!transaction) {
      console.log('Transaction not found for webhook:', data.reference);
      return;
    }

    // Add webhook data to transaction
    transaction.webhookData.push({
      provider: 'paystack',
      event: eventType,
      data: data,
      receivedAt: new Date()
    });

    switch (eventType) {
      case 'charge.success':
        if (transaction.status !== 'successful') {
          await transaction.markAsPaid({
            paystack: {
              transaction_id: data.id,
              customer_code: data.customer?.customer_code,
              authorization_code: data.authorization?.authorization_code
            }
          });
          
          // Update user subscription if applicable
          if (transaction.type === 'subscription') {
            await updateUserSubscription(transaction);
          }
        }
        break;

      case 'charge.failed':
        await transaction.markAsFailed(data.gateway_response || 'Payment failed');
        break;

      case 'subscription.create':
      case 'subscription.disable':
      case 'subscription.enable':
        // Handle subscription events
        console.log(`Subscription ${eventType}:`, data);
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    await transaction.save();

  } catch (error) {
    console.error('Webhook processing error:', error);
  }
};

// Update user subscription after successful payment
const updateUserSubscription = async (transaction) => {
  try {
    const user = transaction.user;
    const plan = await SubscriptionPlan.findPlanByName(transaction.subscription.plan);
    
    if (!plan) return;

    const subscriptionEndDate = new Date();
    if (transaction.subscription.billingCycle === 'yearly') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    }

    // Update user subscription
    user.subscription.tier = transaction.subscription.plan;
    user.subscription.status = 'active';
    user.subscription.expiresAt = subscriptionEndDate;
    user.subscription.features = plan.features.map(f => f.name);

    await user.save();

  } catch (error) {
    console.error('Error updating user subscription:', error);
  }
};

// GET USER PAYMENT HISTORY
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const user = req.user;

    const filter = { user: user._id };
    if (type) filter.type = type;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'profile.firstName profile.lastName email');

    const total = await Transaction.countDocuments(filter);

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
    console.error('Payment history error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch payment history'
    });
  }
});

// GET USAGE STATISTICS
router.get('/usage', protect, async (req, res) => {
  try {
    const { feature, timeframe = 'monthly' } = req.query;
    const user = req.user;

    let usageData;
    if (feature) {
      const result = await UsageTracking.getUserUsage(user._id, feature, timeframe);
      usageData = result[0]?.totalUsage || 0;
    } else {
      // Get usage for all features
      const features = [
        'api_call', 'data_export', 'price_alert', 'training_access',
        'marketplace_listing', 'consultation_hour', 'report_generation'
      ];
      
      usageData = {};
      for (const feat of features) {
        const result = await UsageTracking.getUserUsage(user._id, feat, timeframe);
        usageData[feat] = result[0]?.totalUsage || 0;
      }
    }

    // Get subscription limits
    const plan = await SubscriptionPlan.findPlanByName(user.subscription.tier);
    const limits = plan?.limits || {};

    res.status(200).json({
      status: 'success',
      data: {
        usage: usageData,
        limits,
        subscription: {
          tier: user.subscription.tier,
          expiresAt: user.subscription.expiresAt,
          status: user.subscription.status
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

// CANCEL SUBSCRIPTION
router.post('/cancel-subscription', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.subscription.tier === 'free') {
      return res.status(400).json({
        status: 'fail',
        message: 'You are already on the free plan'
      });
    }

    // Update subscription status
    user.subscription.status = 'cancelled';
    user.subscription.autoRenew = false;
    
    await user.save();

    // In production, also cancel with payment provider

    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully. You can continue using premium features until your current billing period ends.',
      data: {
        expiresAt: user.subscription.expiresAt
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to cancel subscription'
    });
  }
});

// REACTIVATE SUBSCRIPTION
router.post('/reactivate-subscription', protect, async (req, res) => {
  try {
    const user = req.user;

    if (user.subscription.status === 'active') {
      return res.status(400).json({
        status: 'fail',
        message: 'Your subscription is already active'
      });
    }

    // Check if subscription hasn't expired
    if (new Date() > user.subscription.expiresAt) {
      return res.status(400).json({
        status: 'fail',
        message: 'Your subscription has expired. Please subscribe to a new plan.',
        redirectTo: '/subscription/plans'
      });
    }

    // Reactivate subscription
    user.subscription.status = 'active';
    user.subscription.autoRenew = true;
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Subscription reactivated successfully'
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reactivate subscription'
    });
  }
});

module.exports = router;
