const User = require('../models/User');
const Notification = require('../models/Notification');

exports.sendNotificationToUser = async (userId, title, body, data = {}, type = 'general') => {
  try {
    await Notification.create({
      userId: userId,
      title,
      body,
      type,
      data: JSON.stringify(data),
      sentAt: new Date()
    });
    return { success: true, method: 'database_only' };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
};

// Stub functions for testing
exports.sendNewArrivalNotification = async (product) => {
  return { success: true, message: 'New arrival notification simulated' };
};

exports.sendPriceDropNotification = async (productId, oldPrice, newPrice, userIds) => {
  return { success: true, message: 'Price drop notification simulated' };
};

exports.sendBackInStockNotification = async (productId, userIds) => {
  return { success: true, message: 'Back in stock notification simulated' };
};

exports.sendCartReminderNotification = async (userId, cartItems) => {
  return await exports.sendNotificationToUser(userId, 'Cart Reminder', 'Items in cart', { cartItems }, 'cart_reminder');
};

exports.sendAbandonedCartOfferNotification = async (userId, cartItems, discount) => {
  return await exports.sendNotificationToUser(userId, 'Special Offer', `${discount}% off`, { discount }, 'abandoned_cart');
};

exports.sendOrderConfirmationNotification = async (userId, orderId, amount) => {
  return await exports.sendNotificationToUser(userId, 'Order Confirmed', `Order #${orderId}`, { orderId }, 'order_confirmation');
};

exports.sendOrderShippedNotification = async (userId, orderId, trackingNumber) => {
  return await exports.sendNotificationToUser(userId, 'Order Shipped', `Order #${orderId}`, { orderId }, 'order_shipped');
};

exports.sendOrderDeliveredNotification = async (userId, orderId) => {
  return await exports.sendNotificationToUser(userId, 'Order Delivered', `Order #${orderId}`, { orderId }, 'order_delivered');
};

exports.sendDailyDealNotification = async (dealTitle, description, discount, productIds) => {
  return { success: true, message: 'Daily deal notification simulated' };
};

exports.sendProductRecommendationNotification = async (userId, productIds) => {
  return await exports.sendNotificationToUser(userId, 'Product Recommendation', 'Items for you', { productIds }, 'product_recommendation');
};

exports.sendLoyaltyPointsNotification = async (userId, points, total, action) => {
  return await exports.sendNotificationToUser(userId, 'Loyalty Points', `${action} ${points} points`, { points }, 'loyalty_points');
};

exports.sendAppUpdateNotification = async (version, features) => {
  return { success: true, message: 'App update notification simulated' };
};

exports.sendLoginAlertNotification = async (userId, device, ip) => {
  return await exports.sendNotificationToUser(userId, 'Login Alert', `Login from ${device}`, { device, ip }, 'login_alert');
};

exports.sendPasswordChangeNotification = async (userId) => {
  return await exports.sendNotificationToUser(userId, 'Password Changed', 'Password updated', {}, 'password_change');
};

exports.sendPaymentFailedNotification = async (userId, orderId, reason) => {
  return await exports.sendNotificationToUser(userId, 'Payment Failed', `Order #${orderId}`, { orderId, reason }, 'payment_failed');
};

exports.sendRateExperienceNotification = async (userId, orderId) => {
  return await exports.sendNotificationToUser(userId, 'Rate Experience', `Order #${orderId}`, { orderId }, 'rate_experience');
};

exports.sendFeedbackRequestNotification = async (userId, type) => {
  return await exports.sendNotificationToUser(userId, 'Feedback Request', 'Share your thoughts', { type }, 'feedback_request');
};

exports.sendSeasonalSaleNotification = async (saleName, description, discount) => {
  return { success: true, message: 'Seasonal sale notification simulated' };
};

exports.sendPromotionalNotification = async (title, body, data = {}) => {
  return { success: true, message: 'Promotional notification simulated' };
};

exports.sendOrderNotification = async (userId, orderId, status) => {
  return await exports.sendNotificationToUser(userId, `Order ${status}`, `Order #${orderId}`, { orderId, status }, 'order');
};
