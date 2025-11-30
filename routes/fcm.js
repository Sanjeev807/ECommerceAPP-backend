const express = require('express');
const router = express.Router();
const fcmService = require('../services/fcmService');
const { protect, admin } = require('../middleware/auth');
const promotionalScheduler = require('../services/promotionalScheduler');
const logger = require('../utils/logger');

// @desc    Send promotional notification to all users
// @route   POST /api/fcm/promotional
// @access  Private/Admin
router.post('/promotional', protect, admin, async (req, res) => {
  try {
    const { title, body, promoType } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const result = await fcmService.sendPromotionalNotification(
      title,
      body,
      promoType || 'manual'
    );

    res.json({
      message: 'Promotional notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending promotional notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send random promotional notification
// @route   POST /api/fcm/promotional/random
// @access  Private/Admin
router.post('/promotional/random', protect, admin, async (req, res) => {
  try {
    const promo = fcmService.getRandomPromotionalMessage();
    const result = await fcmService.sendPromotionalNotification(
      promo.title,
      promo.body,
      'random'
    );

    res.json({
      message: 'Random promotional notification sent successfully',
      notification: promo,
      result
    });
  } catch (error) {
    logger.error('Error sending random promotional notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send engagement notification to user
// @route   POST /api/fcm/engagement/:userId
// @access  Private
router.post('/engagement/:userId', protect, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Users can only send to themselves unless admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const User = require('../models/User');
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const result = await fcmService.sendEngagementNotification(userId, user.name);

    res.json({
      message: 'Engagement notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending engagement notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send wishlist notification
// @route   POST /api/fcm/wishlist
// @access  Private
router.post('/wishlist', protect, async (req, res) => {
  try {
    const { userId, productName, notificationType } = req.body;

    if (!userId || !productName) {
      return res.status(400).json({ message: 'userId and productName are required' });
    }

    // Users can only send to themselves unless admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await fcmService.sendWishlistNotification(
      userId,
      productName,
      notificationType || 'stock'
    );

    res.json({
      message: 'Wishlist notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending wishlist notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send custom notification to user
// @route   POST /api/fcm/send-to-user
// @access  Private/Admin
router.post('/send-to-user', protect, admin, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: 'userId, title and body are required' });
    }

    const result = await fcmService.sendToUser(userId, title, body, data || {});

    res.json({
      message: 'Notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Send custom notification to all users
// @route   POST /api/fcm/broadcast
// @access  Private/Admin
router.post('/broadcast', protect, admin, async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const result = await fcmService.sendToAllUsers(title, body, data || {});

    res.json({
      message: 'Broadcast notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending broadcast notification:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get promotional scheduler status
// @route   GET /api/fcm/scheduler/status
// @access  Private/Admin
router.get('/scheduler/status', protect, admin, (req, res) => {
  try {
    const status = promotionalScheduler.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting scheduler status:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Start promotional scheduler
// @route   POST /api/fcm/scheduler/start
// @access  Private/Admin
router.post('/scheduler/start', protect, admin, (req, res) => {
  try {
    promotionalScheduler.start();
    res.json({ message: 'Promotional scheduler started successfully' });
  } catch (error) {
    logger.error('Error starting scheduler:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Stop promotional scheduler
// @route   POST /api/fcm/scheduler/stop
// @access  Private/Admin
router.post('/scheduler/stop', protect, admin, (req, res) => {
  try {
    promotionalScheduler.stop();
    res.json({ message: 'Promotional scheduler stopped successfully' });
  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update FCM token for current user
// @route   POST /api/fcm/token
// @access  Private
router.post('/token', protect, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const User = require('../models/User');
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    logger.info(`FCM token updated for user ${user.email}`);

    res.json({ message: 'FCM token updated successfully' });
  } catch (error) {
    logger.error('Error updating FCM token:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Test notification (send to current user)
// @route   POST /api/fcm/test
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const result = await fcmService.sendToUser(
      req.user.id,
      '🧪 Test Notification',
      'This is a test notification from E-Shop. FCM is working correctly!',
      { type: 'test', timestamp: new Date().toISOString() }
    );

    res.json({
      message: 'Test notification sent successfully',
      result
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/send-notification', protect, async (req, res) => {
  try {
    const { title, message, token, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const result = await fcmService.sendNotification(token, title, message, data || {});

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send notification'
    });
  }
});

router.post('/send-multicast', protect, async (req, res) => {
  try {
    const { title, message, tokens, data } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tokens array is required'
      });
    }

    const result = await fcmService.sendMulticastNotification(tokens, title, message, data || {});

    res.status(200).json({
      success: true,
      message: 'Multicast notification sent successfully',
      successCount: result.successCount,
      failureCount: result.failureCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send multicast notification'
    });
  }
});

module.exports = router;
