const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const notificationService = require('../services/notifications');
const User = require('../models/User');
const CropPrice = require('../models/CropPrice');
const { checkSubscriptionAccess, trackUsage } = require('../middleware/subscription');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ========== NOTIFICATION PREFERENCES ==========

// GET USER NOTIFICATION PREFERENCES
router.get('/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('notifications.settings notifications.preferences phone');

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        settings: user.notifications?.settings || {},
        preferences: user.notifications?.preferences || {},
        phone: user.phone,
        hasPhone: !!user.phone
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notification preferences'
    });
  }
});

// UPDATE NOTIFICATION PREFERENCES
router.patch('/preferences', async (req, res) => {
  try {
    const { settings, preferences, phone } = req.body;

    const updateData = {};

    if (settings) {
      // Validate settings object
      const allowedSettings = [
        'priceAlerts', 'marketplace', 'training', 'subscription', 
        'system', 'marketing', 'welcome'
      ];
      
      Object.keys(settings).forEach(key => {
        if (allowedSettings.includes(key) && typeof settings[key] === 'boolean') {
          updateData[`notifications.settings.${key}`] = settings[key];
        }
      });
    }

    if (preferences) {
      // Validate preferences object
      const allowedMethods = ['sms', 'whatsapp', 'email'];
      if (preferences.method && allowedMethods.includes(preferences.method)) {
        updateData['notifications.preferences.method'] = preferences.method;
      }
      
      if (typeof preferences.quiet_hours === 'object' && preferences.quiet_hours) {
        updateData['notifications.preferences.quiet_hours'] = preferences.quiet_hours;
      }
    }

    // Update phone number if provided
    if (phone) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid phone number format. Please use E.164 format (+1234567890)'
        });
      }
      updateData.phone = phone;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('notifications.settings notifications.preferences phone');

    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: {
        settings: user.notifications?.settings || {},
        preferences: user.notifications?.preferences || {},
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update notification preferences'
    });
  }
});

// ========== PRICE ALERTS ==========

// GET USER'S PRICE ALERTS
router.get('/alerts', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('notifications.priceAlerts subscription.tier');

    const alerts = user.notifications?.priceAlerts || [];

    // Get latest prices for active alerts
    const alertsWithPrices = await Promise.all(
      alerts.map(async (alert) => {
        if (!alert.isActive) return alert.toObject();

        try {
          const latestPrice = await CropPrice.findOne({
            cropName: alert.cropName,
            'market.name': alert.market,
            lastUpdated: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }).sort({ lastUpdated: -1 });

          return {
            ...alert.toObject(),
            currentPrice: latestPrice ? {
              value: latestPrice.pricePerUnit.value,
              currency: latestPrice.pricePerUnit.currency,
              unit: latestPrice.pricePerUnit.unit,
              lastUpdated: latestPrice.lastUpdated
            } : null
          };
        } catch (error) {
          console.error(`Error getting price for alert ${alert._id}:`, error);
          return alert.toObject();
        }
      })
    );

    // Get subscription limits
    const subscriptionLimits = getAlertLimits(user.subscription?.tier || 'free');

    res.status(200).json({
      status: 'success',
      data: {
        alerts: alertsWithPrices,
        limits: subscriptionLimits,
        usage: {
          active: alerts.filter(alert => alert.isActive).length,
          total: alerts.length
        }
      }
    });

  } catch (error) {
    console.error('Get alerts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch price alerts'
    });
  }
});

// CREATE PRICE ALERT
router.post('/alerts', checkSubscriptionAccess('priceAlerts'), async (req, res) => {
  try {
    const { cropName, market, condition, targetPrice } = req.body;

    // Validate required fields
    if (!cropName || !market || !condition) {
      return res.status(400).json({
        status: 'fail',
        message: 'cropName, market, and condition are required'
      });
    }

    // Validate condition
    const validConditions = ['above', 'below', 'change'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Condition must be one of: above, below, change'
      });
    }

    // Validate targetPrice for above/below conditions
    if ((condition === 'above' || condition === 'below') && (!targetPrice || targetPrice <= 0)) {
      return res.status(400).json({
        status: 'fail',
        message: 'targetPrice is required and must be positive for above/below conditions'
      });
    }

    const user = await User.findById(req.user.id);
    const currentAlerts = user.notifications?.priceAlerts || [];
    const activeAlerts = currentAlerts.filter(alert => alert.isActive);
    
    // Check subscription limits
    const limits = getAlertLimits(user.subscription?.tier || 'free');
    if (activeAlerts.length >= limits.maxAlerts) {
      return res.status(403).json({
        status: 'fail',
        message: `You have reached your limit of ${limits.maxAlerts} active price alerts. Upgrade your subscription for more alerts.`
      });
    }

    // Check for duplicate alert
    const duplicate = currentAlerts.find(alert => 
      alert.cropName === cropName && 
      alert.market === market && 
      alert.condition === condition &&
      alert.isActive
    );

    if (duplicate) {
      return res.status(400).json({
        status: 'fail',
        message: 'You already have an active alert for this crop, market, and condition'
      });
    }

    // Verify crop and market exist
    const cropExists = await CropPrice.findOne({
      cropName: cropName,
      'market.name': market
    });

    if (!cropExists) {
      return res.status(400).json({
        status: 'fail',
        message: 'No price data found for this crop and market combination'
      });
    }

    // Create new alert
    const newAlert = {
      cropName,
      market,
      condition,
      targetPrice: targetPrice || null,
      isActive: true,
      createdAt: new Date()
    };

    await User.findByIdAndUpdate(req.user.id, {
      $push: { 'notifications.priceAlerts': newAlert }
    });

    // Track usage
    await trackUsage(req.user.id, 'priceAlerts', 'create');

    res.status(201).json({
      status: 'success',
      message: 'Price alert created successfully',
      data: { alert: newAlert }
    });

  } catch (error) {
    console.error('Create alert error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create price alert'
    });
  }
});

// UPDATE PRICE ALERT
router.patch('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { condition, targetPrice, isActive } = req.body;

    const user = await User.findById(req.user.id);
    const alertIndex = user.notifications.priceAlerts.findIndex(
      alert => alert._id.toString() === alertId
    );

    if (alertIndex === -1) {
      return res.status(404).json({
        status: 'fail',
        message: 'Price alert not found'
      });
    }

    // Update alert fields
    if (condition) {
      const validConditions = ['above', 'below', 'change'];
      if (!validConditions.includes(condition)) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid condition'
        });
      }
      user.notifications.priceAlerts[alertIndex].condition = condition;
    }

    if (targetPrice !== undefined) {
      user.notifications.priceAlerts[alertIndex].targetPrice = targetPrice;
    }

    if (isActive !== undefined) {
      user.notifications.priceAlerts[alertIndex].isActive = isActive;
    }

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Price alert updated successfully',
      data: { alert: user.notifications.priceAlerts[alertIndex] }
    });

  } catch (error) {
    console.error('Update alert error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update price alert'
    });
  }
});

// DELETE PRICE ALERT
router.delete('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const result = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          'notifications.priceAlerts': { _id: alertId }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 'fail',
        message: 'User or alert not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Price alert deleted successfully'
    });

  } catch (error) {
    console.error('Delete alert error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete price alert'
    });
  }
});

// TEST PRICE ALERT
router.post('/alerts/:alertId/test', async (req, res) => {
  try {
    const { alertId } = req.params;

    const user = await User.findById(req.user.id);
    const alert = user.notifications.priceAlerts.find(
      a => a._id.toString() === alertId
    );

    if (!alert) {
      return res.status(404).json({
        status: 'fail',
        message: 'Price alert not found'
      });
    }

    // Get current price
    const latestPrice = await CropPrice.findOne({
      cropName: alert.cropName,
      'market.name': alert.market
    }).sort({ lastUpdated: -1 });

    if (!latestPrice) {
      return res.status(400).json({
        status: 'fail',
        message: 'No price data available for this crop and market'
      });
    }

    const testMessage = `🧪 TEST ALERT: ${alert.cropName} in ${alert.market} is currently ${latestPrice.pricePerUnit.currency} ${latestPrice.pricePerUnit.value}/${latestPrice.pricePerUnit.unit}. Your alert is set for ${alert.condition} ${alert.targetPrice || 'price change'}.`;

    // Send test notification
    const result = await notificationService.sendSystemNotification(
      req.user.id,
      'test',
      'Test Price Alert',
      testMessage,
      { alertId, test: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Test notification sent',
      data: {
        sent: result.success,
        currentPrice: latestPrice.pricePerUnit,
        error: result.error
      }
    });

  } catch (error) {
    console.error('Test alert error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send test alert'
    });
  }
});

// ========== NOTIFICATION INBOX ==========

// GET USER'S NOTIFICATION INBOX
router.get('/inbox', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, unread } = req.query;

    const user = await User.findById(req.user.id)
      .select('notifications.inbox');

    let notifications = user.notifications?.inbox || [];

    // Filter by type if specified
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    // Filter by read status if specified
    if (unread === 'true') {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    res.status(200).json({
      status: 'success',
      results: paginatedNotifications.length,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(notifications.length / limit),
          total: notifications.length,
          unreadCount: notifications.filter(n => !n.isRead).length
        }
      }
    });

  } catch (error) {
    console.error('Get inbox error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

// MARK NOTIFICATION AS READ
router.patch('/inbox/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        'notifications.inbox._id': notificationId
      },
      {
        $set: { 'notifications.inbox.$.isRead': true }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification as read'
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch('/inbox/read-all', async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: { 'notifications.inbox.$[].isRead': true }
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark all notifications as read'
    });
  }
});

// DELETE NOTIFICATION
router.delete('/inbox/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: {
          'notifications.inbox': { _id: notificationId }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete notification'
    });
  }
});

// ========== ADMIN ROUTES ==========

// SEND BULK NOTIFICATIONS (Admin only)
router.post('/send-bulk', restrictTo('admin'), async (req, res) => {
  try {
    const { 
      message, 
      title, 
      type = 'announcement', 
      recipients = 'all', 
      filters = {} 
    } = req.body;

    if (!message || !title) {
      return res.status(400).json({
        status: 'fail',
        message: 'Message and title are required'
      });
    }

    // Build user filter
    let userFilter = { status: 'active' };

    if (recipients === 'subscribers') {
      userFilter['subscription.tier'] = { $ne: 'free' };
    } else if (recipients === 'farmers') {
      userFilter.role = 'farmer';
    } else if (recipients === 'extension') {
      userFilter.role = 'extension_officer';
    }

    // Apply additional filters
    if (filters.subscriptionTier) {
      userFilter['subscription.tier'] = filters.subscriptionTier;
    }
    
    if (filters.location) {
      userFilter['profile.location.state'] = filters.location;
    }

    // Get users
    const users = await User.find(userFilter)
      .select('_id phone notifications.preferences')
      .limit(5000); // Limit to prevent overwhelming

    if (users.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No users found matching the criteria'
      });
    }

    // Prepare recipients for bulk sending
    const smsRecipients = [];
    const whatsappRecipients = [];

    users.forEach(user => {
      if (!user.phone) return;

      const recipient = {
        phone: user.phone,
        message: `${title}\n\n${message}`,
        userId: user._id.toString()
      };

      const preferredMethod = user.notifications?.preferences?.method || 'sms';
      if (preferredMethod === 'whatsapp') {
        whatsappRecipients.push(recipient);
      } else {
        smsRecipients.push(recipient);
      }
    });

    // Send notifications
    const results = {
      sms: [],
      whatsapp: [],
      total: users.length
    };

    if (smsRecipients.length > 0) {
      results.sms = await notificationService.sendBulkSMS(smsRecipients, type);
    }

    if (whatsappRecipients.length > 0) {
      // Note: Bulk WhatsApp sending would need to be implemented in the service
      // For now, we'll process them individually with delays
      for (const recipient of whatsappRecipients) {
        const result = await notificationService.sendWhatsAppMessage(
          recipient.phone,
          recipient.message,
          recipient.userId,
          type
        );
        results.whatsapp.push({ ...recipient, result });
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = [
      ...results.sms.filter(r => r.result?.success),
      ...results.whatsapp.filter(r => r.result?.success)
    ].length;

    res.status(200).json({
      status: 'success',
      message: `Bulk notifications sent to ${successCount}/${results.total} users`,
      data: {
        sent: successCount,
        total: results.total,
        sms: results.sms.length,
        whatsapp: results.whatsapp.length
      }
    });

  } catch (error) {
    console.error('Send bulk notifications error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send bulk notifications'
    });
  }
});

// TRIGGER PRICE ALERTS CHECK (Admin only)
router.post('/process-alerts', restrictTo('admin'), async (req, res) => {
  try {
    const results = await notificationService.processPriceAlerts();

    res.status(200).json({
      status: 'success',
      message: 'Price alerts processed successfully',
      data: {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Process alerts error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process price alerts'
    });
  }
});

// Helper function to get alert limits based on subscription
function getAlertLimits(tier) {
  switch (tier) {
    case 'premium':
      return { maxAlerts: 50 };
    case 'pro':
      return { maxAlerts: 20 };
    case 'basic':
      return { maxAlerts: 10 };
    default: // free
      return { maxAlerts: 3 };
  }
}

module.exports = router;
