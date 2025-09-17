const twilio = require('twilio');
const axios = require('axios');
const User = require('../models/User');
const CropPrice = require('../models/CropPrice');
const { UsageTracking } = require('../models/Subscription');

// Initialize Twilio client (optional)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn('Twilio credentials not found. SMS functionality will be disabled. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env to enable SMS notifications.');
}

// WhatsApp Business API configuration
const WHATSAPP_BASE_URL = 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

class NotificationService {
  constructor() {
    this.rateLimits = new Map(); // Simple rate limiting
  }

  // ========== SMS SERVICES ==========

  /**
   * Send SMS notification
   * @param {string} to - Phone number in E.164 format
   * @param {string} message - SMS message content
   * @param {string} userId - User ID for tracking
   * @param {string} type - Notification type
   */
  async sendSMS(to, message, userId = null, type = 'general') {
    try {
      // Check if Twilio is configured
      if (!twilioClient) {
        return {
          success: false,
          error: 'Twilio not configured'
        };
      }

      // Check rate limits
      if (this.isRateLimited(to, 'sms')) {
        throw new Error('Rate limit exceeded for SMS');
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(to)) {
        throw new Error('Invalid phone number format');
      }

      // Send SMS via Twilio
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      // Track usage
      if (userId) {
        await this.trackNotificationUsage(userId, 'sms', type);
      }

      // Update rate limiting
      this.updateRateLimit(to, 'sms');

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send bulk SMS notifications
   * @param {Array} recipients - Array of {phone, message, userId}
   * @param {string} type - Notification type
   */
  async sendBulkSMS(recipients, type = 'bulk') {
    const results = [];
    const batchSize = 50; // Process in batches to avoid overwhelming API

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        const result = await this.sendSMS(
          recipient.phone,
          recipient.message,
          recipient.userId,
          type
        );
        return { ...recipient, result };
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  // ========== WHATSAPP SERVICES ==========

  /**
   * Send WhatsApp message
   * @param {string} to - Phone number in international format
   * @param {string} message - Message content
   * @param {string} userId - User ID for tracking
   * @param {string} type - Message type
   */
  async sendWhatsAppMessage(to, message, userId = null, type = 'text') {
    try {
      // Check rate limits
      if (this.isRateLimited(to, 'whatsapp')) {
        throw new Error('Rate limit exceeded for WhatsApp');
      }

      // Format phone number (remove + for WhatsApp API)
      const formattedPhone = to.replace(/^\+/, '');

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Track usage
      if (userId) {
        await this.trackNotificationUsage(userId, 'whatsapp', type);
      }

      // Update rate limiting
      this.updateRateLimit(to, 'whatsapp');

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent'
      };

    } catch (error) {
      console.error('WhatsApp message failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send WhatsApp template message
   * @param {string} to - Phone number
   * @param {string} templateName - WhatsApp template name
   * @param {Array} parameters - Template parameters
   * @param {string} userId - User ID for tracking
   */
  async sendWhatsAppTemplate(to, templateName, parameters = [], userId = null) {
    try {
      const formattedPhone = to.replace(/^\+/, '');

      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en"
          },
          components: parameters.length > 0 ? [{
            type: "body",
            parameters: parameters.map(param => ({
              type: "text",
              text: param
            }))
          }] : []
        }
      };

      const response = await axios.post(
        `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (userId) {
        await this.trackNotificationUsage(userId, 'whatsapp', 'template');
      }

      return {
        success: true,
        messageId: response.data.messages[0].id,
        status: 'sent'
      };

    } catch (error) {
      console.error('WhatsApp template failed:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // ========== PRICE ALERT SYSTEM ==========

  /**
   * Check and send price alerts
   */
  async processPriceAlerts() {
    try {
      console.log('Processing price alerts...');

      // Get all users with active price alerts
      const users = await User.find({
        'notifications.priceAlerts': { $exists: true, $not: { $size: 0 } },
        'notifications.settings.priceAlerts': true,
        status: 'active'
      }).populate('notifications.priceAlerts');

      const alertsToProcess = [];

      for (const user of users) {
        for (const alert of user.notifications.priceAlerts) {
          if (!alert.isActive) continue;

          // Get latest price for the crop and market
          const latestPrice = await CropPrice.findOne({
            cropName: alert.cropName,
            'market.name': alert.market,
            lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within 24 hours
          }).sort({ lastUpdated: -1 });

          if (!latestPrice) continue;

          const currentPrice = latestPrice.pricePerUnit.value;
          let shouldAlert = false;
          let alertMessage = '';

          // Check alert conditions
          if (alert.condition === 'above' && currentPrice > alert.targetPrice) {
            shouldAlert = true;
            alertMessage = `🚨 PRICE ALERT: ${alert.cropName} in ${alert.market} is now ${latestPrice.pricePerUnit.currency} ${currentPrice}/${latestPrice.pricePerUnit.unit} (above your target of ${alert.targetPrice})`;
          } else if (alert.condition === 'below' && currentPrice < alert.targetPrice) {
            shouldAlert = true;
            alertMessage = `📉 PRICE ALERT: ${alert.cropName} in ${alert.market} is now ${latestPrice.pricePerUnit.currency} ${currentPrice}/${latestPrice.pricePerUnit.unit} (below your target of ${alert.targetPrice})`;
          } else if (alert.condition === 'change') {
            // Check for significant price change (e.g., 10% or more)
            const changeThreshold = alert.targetPrice || 10; // Default 10% change
            const previousPrice = await this.getPreviousPrice(alert.cropName, alert.market);
            
            if (previousPrice) {
              const changePercent = Math.abs((currentPrice - previousPrice) / previousPrice * 100);
              if (changePercent >= changeThreshold) {
                const trend = currentPrice > previousPrice ? '📈 UP' : '📉 DOWN';
                shouldAlert = true;
                alertMessage = `${trend} PRICE CHANGE: ${alert.cropName} in ${alert.market} changed by ${changePercent.toFixed(1)}% (now ${latestPrice.pricePerUnit.currency} ${currentPrice}/${latestPrice.pricePerUnit.unit})`;
              }
            }
          }

          // Check if we've already sent this alert recently
          const recentAlert = await this.checkRecentAlert(user._id, alert._id, currentPrice);
          if (shouldAlert && !recentAlert) {
            alertsToProcess.push({
              userId: user._id,
              alertId: alert._id,
              phone: user.phone,
              message: alertMessage,
              price: currentPrice,
              preferences: user.notifications.preferences
            });
          }
        }
      }

      // Send alerts
      const results = await this.sendPriceAlerts(alertsToProcess);
      console.log(`Processed ${results.length} price alerts`);

      return results;

    } catch (error) {
      console.error('Price alerts processing failed:', error);
      throw error;
    }
  }

  /**
   * Send price alerts to users
   * @param {Array} alerts - Array of alert objects
   */
  async sendPriceAlerts(alerts) {
    const results = [];

    for (const alert of alerts) {
      try {
        let result;

        // Send via preferred method
        if (alert.preferences?.method === 'whatsapp' && alert.preferences?.whatsapp) {
          result = await this.sendWhatsAppMessage(
            alert.phone,
            alert.message,
            alert.userId,
            'price_alert'
          );
        } else if (alert.preferences?.method === 'sms' || !alert.preferences?.method) {
          result = await this.sendSMS(
            alert.phone,
            alert.message,
            alert.userId,
            'price_alert'
          );
        }

        // Log the alert
        await this.logPriceAlert(alert.userId, alert.alertId, alert.price, result.success);

        results.push({
          userId: alert.userId,
          alertId: alert.alertId,
          success: result.success,
          error: result.error
        });

      } catch (error) {
        console.error(`Failed to send alert to user ${alert.userId}:`, error);
        results.push({
          userId: alert.userId,
          alertId: alert.alertId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // ========== SYSTEM NOTIFICATIONS ==========

  /**
   * Send system notification to user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} data - Additional data
   */
  async sendSystemNotification(userId, type, title, message, data = {}) {
    try {
      const user = await User.findById(userId);
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Check if user has enabled this type of notification
      const notificationSettings = user.notifications?.settings || {};
      if (notificationSettings[type] === false) {
        return { success: false, reason: 'User has disabled this notification type' };
      }

      const fullMessage = `${title}\n\n${message}`;
      let result;

      // Send via preferred method
      const preferences = user.notifications?.preferences || {};
      if (preferences.method === 'whatsapp' && user.phone) {
        result = await this.sendWhatsAppMessage(
          user.phone,
          fullMessage,
          userId,
          type
        );
      } else if (user.phone) {
        result = await this.sendSMS(
          user.phone,
          fullMessage,
          userId,
          type
        );
      }

      // Store notification in database for in-app notifications
      await User.findByIdAndUpdate(userId, {
        $push: {
          'notifications.inbox': {
            type,
            title,
            message,
            data,
            isRead: false,
            createdAt: new Date()
          }
        }
      });

      return result;

    } catch (error) {
      console.error('System notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome message to new user
   * @param {string} userId - User ID
   */
  async sendWelcomeMessage(userId) {
    const welcomeMessage = `🌾 Welcome to AgricTech! 
    
Your account is now active. You can:
• Get real-time crop prices
• Set price alerts
• Access the marketplace
• Take training courses

Reply HELP for assistance.`;

    return await this.sendSystemNotification(
      userId,
      'welcome',
      'Welcome to AgricTech!',
      welcomeMessage
    );
  }

  /**
   * Send subscription reminder
   * @param {string} userId - User ID
   * @param {number} daysLeft - Days until expiration
   */
  async sendSubscriptionReminder(userId, daysLeft) {
    const message = `⏰ Your AgricTech subscription expires in ${daysLeft} days.

Renew now to continue enjoying:
• Premium price analytics
• Unlimited price alerts  
• Marketplace access
• Training courses

Visit the app to renew your subscription.`;

    return await this.sendSystemNotification(
      userId,
      'subscription',
      'Subscription Reminder',
      message,
      { daysLeft, type: 'renewal_reminder' }
    );
  }

  // ========== MARKETPLACE NOTIFICATIONS ==========

  /**
   * Send marketplace notification
   * @param {string} buyerId - Buyer user ID
   * @param {string} sellerId - Seller user ID
   * @param {string} type - Notification type
   * @param {Object} data - Order/listing data
   */
  async sendMarketplaceNotification(buyerId, sellerId, type, data) {
    const notifications = [];

    try {
      switch (type) {
        case 'order_placed':
          if (sellerId) {
            const message = `📦 New Order Received!

Product: ${data.productName}
Quantity: ${data.quantity}
Amount: ${data.currency} ${data.amount}
Buyer: ${data.buyerName}

Check your dashboard to accept or decline.`;

            notifications.push(
              await this.sendSystemNotification(
                sellerId,
                'marketplace',
                'New Order Received',
                message,
                data
              )
            );
          }
          break;

        case 'order_accepted':
          if (buyerId) {
            const message = `✅ Order Accepted!

Your order for ${data.productName} has been accepted.
Delivery expected: ${data.deliveryDate}

Track your order in the marketplace section.`;

            notifications.push(
              await this.sendSystemNotification(
                buyerId,
                'marketplace',
                'Order Accepted',
                message,
                data
              )
            );
          }
          break;

        case 'order_shipped':
          if (buyerId) {
            const message = `🚚 Order Shipped!

Your order for ${data.productName} is on its way.
Tracking: ${data.trackingNumber || 'N/A'}
Expected delivery: ${data.deliveryDate}`;

            notifications.push(
              await this.sendSystemNotification(
                buyerId,
                'marketplace',
                'Order Shipped',
                message,
                data
              )
            );
          }
          break;

        case 'order_delivered':
          if (buyerId) {
            const message = `📦 Order Delivered!

Your order for ${data.productName} has been delivered.

Please confirm receipt and leave a review.`;

            notifications.push(
              await this.sendSystemNotification(
                buyerId,
                'marketplace',
                'Order Delivered',
                message,
                data
              )
            );
          }
          break;

        case 'payment_received':
          if (sellerId) {
            const message = `💰 Payment Received!

Amount: ${data.currency} ${data.amount}
From order: ${data.productName}
Commission: ${data.commission}

Payment will be processed within 2-3 business days.`;

            notifications.push(
              await this.sendSystemNotification(
                sellerId,
                'marketplace',
                'Payment Received',
                message,
                data
              )
            );
          }
          break;
      }

    } catch (error) {
      console.error('Marketplace notification failed:', error);
    }

    return notifications;
  }

  // ========== HELPER METHODS ==========

  /**
   * Check if phone number is rate limited
   * @param {string} phone - Phone number
   * @param {string} service - Service type (sms/whatsapp)
   */
  isRateLimited(phone, service) {
    const key = `${phone}_${service}`;
    const limit = this.rateLimits.get(key);
    
    if (!limit) return false;

    // Allow 5 messages per hour
    const hourlyLimit = 5;
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    // Clean old entries
    limit.timestamps = limit.timestamps.filter(ts => ts > hourAgo);
    
    return limit.timestamps.length >= hourlyLimit;
  }

  /**
   * Update rate limit tracking
   * @param {string} phone - Phone number
   * @param {string} service - Service type
   */
  updateRateLimit(phone, service) {
    const key = `${phone}_${service}`;
    const limit = this.rateLimits.get(key) || { timestamps: [] };
    
    limit.timestamps.push(Date.now());
    this.rateLimits.set(key, limit);
  }

  /**
   * Track notification usage
   * @param {string} userId - User ID
   * @param {string} service - Service type
   * @param {string} type - Notification type
   */
  async trackNotificationUsage(userId, service, type) {
    try {
      await UsageTracking.create({
        user: userId,
        feature: `notification_${service}`,
        action: type,
        count: 1,
        metadata: {
          service,
          type,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
  }

  /**
   * Get previous price for comparison
   * @param {string} cropName - Crop name
   * @param {string} market - Market name
   */
  async getPreviousPrice(cropName, market) {
    try {
      const previousPrice = await CropPrice.findOne({
        cropName,
        'market.name': market,
        lastUpdated: { 
          $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Before 24 hours ago
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Within last week
        }
      }).sort({ lastUpdated: -1 });

      return previousPrice?.pricePerUnit?.value || null;
    } catch (error) {
      console.error('Error getting previous price:', error);
      return null;
    }
  }

  /**
   * Check if alert was recently sent
   * @param {string} userId - User ID
   * @param {string} alertId - Alert ID
   * @param {number} currentPrice - Current price
   */
  async checkRecentAlert(userId, alertId, currentPrice) {
    try {
      const user = await User.findById(userId);
      const alertLog = user.notifications?.alertLog || [];
      
      const recentAlert = alertLog.find(log => 
        log.alertId.toString() === alertId.toString() &&
        log.sentAt > new Date(Date.now() - 60 * 60 * 1000) && // Within last hour
        Math.abs(log.price - currentPrice) < (currentPrice * 0.01) // Price hasn't changed by more than 1%
      );

      return !!recentAlert;
    } catch (error) {
      console.error('Error checking recent alert:', error);
      return false;
    }
  }

  /**
   * Log price alert
   * @param {string} userId - User ID
   * @param {string} alertId - Alert ID
   * @param {number} price - Current price
   * @param {boolean} success - Whether alert was sent successfully
   */
  async logPriceAlert(userId, alertId, price, success) {
    try {
      await User.findByIdAndUpdate(userId, {
        $push: {
          'notifications.alertLog': {
            alertId,
            price,
            success,
            sentAt: new Date()
          }
        }
      });

      // Keep only last 100 alert logs per user
      await User.findByIdAndUpdate(userId, {
        $push: {
          'notifications.alertLog': {
            $each: [],
            $slice: -100
          }
        }
      });
    } catch (error) {
      console.error('Error logging alert:', error);
    }
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up rate limits periodically
   */
  cleanupRateLimits() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    for (const [key, limit] of this.rateLimits.entries()) {
      limit.timestamps = limit.timestamps.filter(ts => ts > hourAgo);
      if (limit.timestamps.length === 0) {
        this.rateLimits.delete(key);
      }
    }
  }
}

// Export singleton instance
module.exports = new NotificationService();
