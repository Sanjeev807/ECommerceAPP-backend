const admin = require('firebase-admin');
const logger = require('../utils/logger');

class FCMService {
  constructor() {
    this.isInitialized = admin.apps.length > 0;
  }

  async sendNotification(token, title, message, data = {}) {
    try {
      if (!token) {
        throw new Error('FCM token is required');
      }

      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      if (admin.apps.length === 0) {
        logger.warn('Firebase Admin SDK is not initialized - skipping FCM notification');
        return { success: false, error: 'Firebase not initialized' };
      }

      console.log('📤 Preparing FCM notification...');
      console.log('  ├─ To token:', token.substring(0, 20) + '...');
      console.log('  ├─ Title:', title);
      console.log('  ├─ Message:', message);
      console.log('  └─ Data:', JSON.stringify(data));

      // Convert all data values to strings (FCM requirement)
      const stringData = {};
      Object.keys(data).forEach(key => {
        const value = data[key];
        // Skip undefined, null, or empty values
        if (value !== undefined && value !== null && value !== '') {
          stringData[key] = typeof value === 'string' ? value : JSON.stringify(value);
        }
      });
      stringData.timestamp = new Date().toISOString();

      const payload = {
        notification: {
          title,
          body: message
        },
        data: stringData,
        token,
        webpush: {
          notification: {
            title,
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'ecommerce-notification',
            requireInteraction: false
          },
          fcmOptions: {
            link: data.link || '/'
          }
        }
      };

      const response = await admin.messaging().send(payload);
      logger.info(`✅ FCM notification sent successfully: ${response}`);
      console.log(`✅ FCM sent! Message ID: ${response}`);
      
      return {
        success: true,
        messageId: response
      };
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        logger.warn('🔄 Invalid FCM token detected - cleaning up');
        // Don't spam console with error messages for invalid tokens
        return {
          success: false,
          error: 'INVALID_TOKEN',
          message: 'FCM token is invalid or expired',
          shouldRemoveToken: true
        };
      }
      
      // Log other FCM errors normally
      logger.error('❌ Error sending FCM notification:', error.message);
      console.error('❌ FCM Error:', error.message);
      console.error('   Error code:', error.code);
      
      return {
        success: false,
        error: error.code || 'FCM_ERROR',
        message: error.message
      };
    }
  }

  async sendMulticastNotification(tokens, title, message, data = {}) {
    try {
      if (!tokens || tokens.length === 0) {
        throw new Error('At least one FCM token is required');
      }

      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      if (admin.apps.length === 0) {
        logger.warn('Firebase Admin SDK is not initialized - skipping FCM notifications');
        return { success: false, error: 'Firebase not initialized' };
      }

      const payload = {
        notification: {
          title,
          body: message
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        tokens: Array.isArray(tokens) ? tokens : [tokens],
        webpush: {
          notification: {
            title,
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: true
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      logger.info(`✅ Sent ${response.successCount} notifications, ${response.failureCount} failed`);
      
      // Handle failed notifications and clean up invalid tokens
      if (response.failureCount > 0) {
        const User = require('../models/User');
        const { Op } = require('sequelize');
        
        const invalidTokens = [];
        
        response.responses.forEach((resp, index) => {
          if (!resp.success && resp.error) {
            const errorCode = resp.error.code;
            if (errorCode === 'messaging/invalid-registration-token' || 
                errorCode === 'messaging/registration-token-not-registered') {
              invalidTokens.push(tokens[index]);
              logger.warn(`Invalid FCM token found: ${tokens[index]}`);
            }
          }
        });
        
        // Clean up invalid tokens from database
        if (invalidTokens.length > 0) {
          try {
            await User.update(
              { fcmToken: null },
              { 
                where: { 
                  fcmToken: { [Op.in]: invalidTokens }
                }
              }
            );
            logger.info(`Cleaned up ${invalidTokens.length} invalid FCM tokens from database`);
          } catch (updateError) {
            logger.error('Error cleaning up invalid FCM tokens:', updateError.message);
          }
        }
      }
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses
      };
    } catch (error) {
      logger.error('Error sending multicast notification:', error.message);
      console.error('FCM Multicast Error Details:', error);
      
      // Don't let FCM errors crash the server
      return {
        success: false,
        error: error.code || 'FCM_MULTICAST_ERROR',
        message: error.message
      };
    }
  }

  async sendToUser(userId, title, message, data = {}) {
    try {
      const User = require('../models/User');
      const user = await User.findByPk(userId);

      if (!user) {
        logger.warn(`User ${userId} not found when sending notification`);
        return { success: false, error: 'User not found' };
      }

      if (!user.fcmToken) {
        logger.warn(`User ${userId} has no FCM token registered`);
        return { success: false, error: 'No FCM token' };
      }

      const result = await this.sendNotification(user.fcmToken, title, message, {
        ...data,
        userId: userId.toString()
      });

      // If token is invalid, optionally clear it from the user record
      if (result && result.shouldRemoveToken) {
        logger.warn(`Clearing invalid FCM token for user ${userId}`);
        try {
          await User.update({ fcmToken: null }, { where: { id: userId } });
        } catch (updateError) {
          logger.error('Error clearing invalid FCM token:', updateError.message);
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error in sendToUser for user ${userId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async sendToAllUsers(title, message, data = {}) {
    try {
      const User = require('../models/User');
      const { Op } = require('sequelize');
      
      // Only get users with valid FCM tokens (not null and not empty)
      const users = await User.findAll({
        where: {
          fcmToken: { 
            [Op.and]: [
              { [Op.ne]: null },
              { [Op.ne]: '' }
            ]
          }
        }
      });

      if (users.length === 0) {
        logger.warn('No users with valid FCM tokens found');
        return { success: false, error: 'No users with tokens' };
      }

      const tokens = users.map(user => user.fcmToken).filter(token => token && token.trim() !== '');
      
      if (tokens.length === 0) {
        logger.warn('No valid FCM tokens found after filtering');
        return { success: false, error: 'No valid tokens' };
      }

      logger.info(`Sending notification to ${tokens.length} users with valid tokens`);
      return await this.sendMulticastNotification(tokens, title, message, data);
    } catch (error) {
      logger.error('Error sending notification to all users:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ========== ORDER NOTIFICATIONS ==========
  async sendOrderNotification(userId, status, orderId) {
    const notifications = {
      placed: {
        title: '🎉 Order Placed Successfully!',
        body: 'Your order has been placed successfully!'
      },
      confirmed: {
        title: '✅ Order Confirmed',
        body: 'Great news! Your order has been confirmed and is being prepared.'
      },
      processing: {
        title: '🔄 Order Processing',
        body: 'Your order is being processed. We\'ll update you soon!'
      },
      shipped: {
        title: '🚚 Your item is shipped. Track now!',
        body: 'Exciting! Your order is on the way. Track your delivery now!'
      },
      out_for_delivery: {
        title: '🏃 Your order is out for delivery.',
        body: 'Almost there! Your order will arrive soon. Get ready to receive it!'
      },
      delivered: {
        title: '✅ Order delivered! We hope you enjoy it.',
        body: 'Your order has been delivered successfully. Thank you for shopping with us!'
      },
      cancelled: {
        title: '❌ Your order has been cancelled.',
        body: 'Your order has been cancelled as requested.'
      }
    };

    const notification = notifications[status] || {
      title: 'Order Update',
      body: `Your order status has been updated to: ${status}`
    };

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'order',
      status: status,
      orderId: orderId.toString(),
      link: `/orders/${orderId}`
    });
  }

  // ========== PROMOTIONAL NOTIFICATIONS ==========
  async sendPromotionalNotification(title, body, promoType = 'general') {
    return await this.sendToAllUsers(title, body, {
      type: 'promotional',
      promoType: promoType,
      link: '/products'
    });
  }

  getRandomPromotionalMessage() {
    const promotions = [
      {
        title: '⚡ Flash Sale! 70% OFF on Electronics — Limited Time!',
        body: 'Hurry! Massive discounts on electronics. Shop now before it ends!'
      },
      {
        title: '👗 Fashion Loot Deal! Buy 1 Get 2 FREE!',
        body: 'Amazing fashion deals waiting for you. Don\'t miss this crazy offer!'
      },
      {
        title: '🍿 Hungry? Try our trending snacks under ₹99!',
        body: 'Delicious snacks at unbeatable prices. Order now and satisfy your cravings!'
      },
      {
        title: '🎯 Top Picks for You — Customized deals now live!',
        body: 'Handpicked deals based on your preferences. Check them out now!'
      },
      {
        title: '💰 Only Today: Extra 20% OFF on your cart!',
        body: 'Special discount just for today. Add items to cart and save big!'
      },
      {
        title: '🔥 Super Saver Sale — Up to 80% OFF!',
        body: 'Biggest sale of the season. Everything must go!'
      },
      {
        title: '🎁 Mystery Box Deal — Surprise Gifts Inside!',
        body: 'Order now and get surprise gifts worth ₹500. Limited boxes available!'
      },
      {
        title: '⏰ Midnight Sale — Extra 30% OFF!',
        body: 'Can\'t sleep? Shop now and grab amazing midnight deals!'
      }
    ];

    return promotions[Math.floor(Math.random() * promotions.length)];
  }

  // ========== WISHLIST & STOCK NOTIFICATIONS ==========
  async sendWishlistNotification(userId, productName, notificationType = 'stock') {
    const notifications = {
      stock: {
        title: '🔔 Your wishlist item is now back in stock!',
        body: `Great news! ${productName} is back in stock. Grab it before it's gone!`
      },
      price_drop: {
        title: '💰 Price dropped for your saved product — Don\'t miss out!',
        body: `${productName} is now available at a lower price. Check it out!`
      }
    };

    const notification = notifications[notificationType] || notifications.stock;

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'wishlist',
      notificationType: notificationType,
      productName: productName,
      link: '/wishlist'
    });
  }

  // ========== ENGAGEMENT NOTIFICATIONS ==========
  async sendEngagementNotification(userId, userName) {
    const engagementMessages = [
      {
        title: `👋 Welcome back${userName ? ', ' + userName : ''}! New deals are waiting for you.`,
        body: 'We\'ve got fresh deals just for you. Check them out now!'
      },
      {
        title: '🔥 Trending now: Bestsellers selling out fast!',
        body: 'Don\'t miss our top-selling products. Limited stock available!'
      },
      {
        title: '🎁 Exclusive offer unlocked for you — Tap to view!',
        body: `${userName || 'You'} have special offers waiting. Shop now!`
      },
      {
        title: '💝 Your favorites are on sale!',
        body: 'Products similar to your interests are now discounted. Explore now!'
      },
      {
        title: '🛍️ New Arrivals Just For You!',
        body: 'Check out the latest products matching your style. Browse now!'
      }
    ];

    const randomMessage = engagementMessages[Math.floor(Math.random() * engagementMessages.length)];

    return await this.sendToUser(userId, randomMessage.title, randomMessage.body, {
      type: 'engagement',
      link: '/products'
    });
  }

  // ========== ORDER NOTIFICATIONS ==========
  async sendOrderNotification(userId, userName, orderStatus, orderId, orderDetails = {}) {
    const notifications = {
      placed: {
        title: '📦 Order Placed Successfully!',
        body: `Hi ${userName || 'there'}! Your order #${orderId} has been placed successfully. We'll notify you when it ships.`
      },
      shipped: {
        title: '✈️ Order Shipped!',
        body: `Great news ${userName || 'there'}! Your order #${orderId} has been shipped and is on its way.`
      },
      out_for_delivery: {
        title: '🚚 Out for Delivery',
        body: `${userName || 'Your'} order #${orderId} is out for delivery! It should arrive today.`
      },
      delivered: {
        title: '✔️ Order Delivered Successfully!',
        body: `Your order #${orderId} has been delivered! Thank you for shopping with E-Shop.`
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Your order #${orderId} has been cancelled. Refund will be processed within 3-5 business days.`
      }
    };

    const notification = notifications[orderStatus] || notifications.placed;

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'order',
      status: orderStatus,
      orderId: orderId,
      link: `/orders/${orderId}`,
      ...orderDetails
    });
  }

  // ========== WISHLIST & STOCK NOTIFICATIONS ==========
  async sendWishlistNotification(userId, userName, type, productName, productId) {
    const notifications = {
      back_in_stock: {
        title: '💖 Wishlist Item Back in Stock!',
        body: `Good news ${userName || 'there'}! ${productName} is now back in stock. Grab it before it's gone!`
      },
      price_drop: {
        title: '⬇️ Price Drop Alert!',
        body: `${productName} from your wishlist just got cheaper! Don't miss this opportunity.`
      },
      similar_products: {
        title: '⭐ New Similar Products Available',
        body: `We found new products similar to ${productName} that you might love!`
      }
    };

    const notification = notifications[type] || notifications.back_in_stock;

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'wishlist',
      action: type,
      productId: productId,
      productName: productName,
      link: `/products/${productId}`
    });
  }

  // ========== ENGAGEMENT NOTIFICATIONS ==========
  async sendEngagementNotification(userId, userName, type = 'welcome_back') {
    const notifications = {
      welcome_back: {
        title: '🚀 Welcome Back to E-Shop!',
        body: `Hi ${userName || 'there'}! Check out what's new and trending just for you.`
      },
      trending_products: {
        title: '🌟 Trending Products Right Now',
        body: `${userName || 'Don\'t'} miss out on today's hottest products! Limited stock available.`
      },
      cart_reminder: {
        title: '🛒 Items Left in Your Cart',
        body: `${userName || 'You'} have items waiting in your cart. Complete your purchase before they sell out!`
      },
      exclusive_offer: {
        title: '🎁 You Have an Exclusive Offer!',
        body: `${userName || 'Special'} discount just for you! Use it before it expires.`
      }
    };

    const notification = notifications[type] || notifications.welcome_back;

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'engagement',
      action: type,
      link: type === 'cart_reminder' ? '/cart' : '/',
      timestamp: new Date().toISOString()
    });
  }

  // ========== PROMOTIONAL NOTIFICATIONS ==========
  async sendPromotionalNotification(userId, userName, type, details = {}) {
    const notifications = {
      flash_sale: {
        title: '🔥 Flash Sale Alert!',
        body: `${userName || 'Hurry'}! Flash sale is live now. Up to ${details.discount || '70%'} off on selected items!`
      },
      discount_offer: {
        title: '🛍️ Special Discount Just for You!',
        body: `${userName || 'Exclusive'} ${details.discount || '50%'} off on ${details.category || 'your favorite products'}!`
      },
      limited_deal: {
        title: '⚡ Limited-Time Deal!',
        body: `Only ${details.timeLeft || '24 hours'} left! Get ${details.discount || 'amazing deals'} before they expire.`
      },
      personalized: {
        title: '🎯 Handpicked Just for You!',
        body: `${userName || 'We'} found products you'll love based on your preferences. Check them out!`
      },
      festive_offer: {
        title: '🏷️ Special Festive Offers!',
        body: `${userName || 'Celebrate'} the season with our exclusive festive discounts and offers!`
      }
    };

    const notification = notifications[type] || notifications.discount_offer;

    // Ensure all data values are strings or remove undefined/null values
    const notificationData = {
      type: 'promotional',
      action: type,
      link: details.link || '/offers'
    };
    
    // Only add non-null/undefined values as strings
    if (details.discount) notificationData.discount = String(details.discount);
    if (details.category) notificationData.category = String(details.category);
    if (details.validUntil) notificationData.validUntil = String(details.validUntil);

    return await this.sendToUser(userId, notification.title, notification.body, notificationData);
  }

  // ========== ACCOUNT NOTIFICATIONS ==========
  async sendAccountNotification(userId, userName, action = 'login') {
    const notifications = {
      login: {
        title: '🔑 Login Successful',
        body: `Welcome back${userName ? ', ' + userName : ''}! Ready for some amazing shopping?`
      },
      profile_update: {
        title: '👤 Profile Updated Successfully',
        body: `${userName || 'Your'} profile information has been updated successfully.`
      },
      password_change: {
        title: '🔄 Password Changed',
        body: `${userName || 'Your'} password has been changed successfully. Your account is secure.`
      },
      register: {
        title: '🎉 Welcome to E-Shop!',
        body: `Hi ${userName || 'there'}, welcome to E-Shop! Start exploring amazing products now.`
      }
    };

    const notification = notifications[action] || notifications.login;

    return await this.sendToUser(userId, notification.title, notification.body, {
      type: 'account',
      action: action,
      link: action === 'login' ? '/' : '/profile'
    });
  }
}

module.exports = new FCMService();
