const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const promotionalNotificationService = require('../services/promotionalNotificationService');
const User = require('../models/User');

router.post('/auto-offer-notification', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.fcmToken) {
      return res.status(200).json({ 
        success: false, 
        message: 'FCM token not registered. Please enable notifications.',
        tokenRequired: true
      });
    }

    const userPreferences = {
      category: req.body.category || user.preferredCategory
    };

    const result = await promotionalNotificationService.sendPromotionalNotification(
      userId,
      user.fcmToken,
      userPreferences
    );

    res.json({
      success: true,
      message: 'Promotional notification sent successfully',
      promotion: {
        title: result.promotion.title,
        message: result.promotion.message,
        category: result.promotion.category
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send promotional notification',
      error: error.message 
    });
  }
});

router.post('/category-offer-notification', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category is required' 
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.fcmToken) {
      return res.status(200).json({ 
        success: false, 
        message: 'FCM token not registered',
        tokenRequired: true
      });
    }

    const result = await promotionalNotificationService.sendCategorySpecificPromotion(
      userId,
      user.fcmToken,
      category
    );

    res.json({
      success: true,
      message: 'Category-specific promotional notification sent',
      promotion: {
        title: result.promotion.title,
        message: result.promotion.message,
        category: result.promotion.category
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send category notification',
      error: error.message 
    });
  }
});

router.post('/bulk-offer-notifications', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const users = await User.findAll({
      where: {
        fcmToken: { 
          [require('sequelize').Op.ne]: null 
        }
      }
    });

    if (users.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No users with FCM tokens found',
        results: { success: 0, failed: 0 }
      });
    }

    const results = await promotionalNotificationService.sendBulkPromotionalNotifications(users);

    res.json({
      success: true,
      message: `Sent promotional notifications to ${results.success} users`,
      results: {
        totalUsers: users.length,
        successCount: results.success,
        failureCount: results.failed
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk notifications',
      error: error.message 
    });
  }
});

module.exports = router;
