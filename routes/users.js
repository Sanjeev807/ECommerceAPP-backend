const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');
const logger = require('../utils/logger');

// @desc    Get all users (admin only) 
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'name', 'role', 'fcmToken', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const userStats = {
      total: users.length,
      withFcmTokens: users.filter(user => user.fcmToken).length,
      withoutFcmTokens: users.filter(user => !user.fcmToken).length,
      admins: users.filter(user => user.role === 'admin').length,
      users: users.filter(user => user.role === 'user').length
    };

    logger.info(`Admin ${req.user.email} requested user list`);

    res.json({
      users,
      stats: userStats
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const usersWithTokens = await User.count({
      where: { fcmToken: { [require('sequelize').Op.ne]: null } }
    });
    const adminUsers = await User.count({
      where: { role: 'admin' }
    });

    res.json({
      totalUsers,
      usersWithTokens,
      usersWithoutTokens: totalUsers - usersWithTokens,
      adminUsers,
      regularUsers: totalUsers - adminUsers
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user statistics' });
  }
});

// @desc    Update user FCM token (admin only)
// @route   PUT /api/users/:id/fcm-token
// @access  Private/Admin
router.put('/:id/fcm-token', protect, admin, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.params.id;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    logger.info(`Admin ${req.user.email} updated FCM token for user ${user.email}`);

    res.json({
      message: 'FCM token updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        fcmToken: user.fcmToken
      }
    });
  } catch (error) {
    logger.error('Error updating FCM token:', error);
    res.status(500).json({ message: 'Error updating FCM token' });
  }
});

// @desc    Bulk update FCM tokens
// @route   POST /api/users/bulk-fcm-token
// @access  Private/Admin
router.post('/bulk-fcm-token', protect, admin, async (req, res) => {
  try {
    const { fcmToken, userIds } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const updateResult = await User.update(
      { fcmToken },
      {
        where: {
          id: userIds
        }
      }
    );

    const updatedCount = updateResult[0];

    logger.info(`Admin ${req.user.email} bulk updated FCM tokens for ${updatedCount} users`);

    res.json({
      message: `FCM token updated for ${updatedCount} users`,
      updatedCount,
      fcmToken
    });
  } catch (error) {
    logger.error('Error bulk updating FCM tokens:', error);
    res.status(500).json({ message: 'Error bulk updating FCM tokens' });
  }
});

// @desc    Clear FCM tokens for all users
// @route   DELETE /api/users/fcm-tokens
// @access  Private/Admin
router.delete('/fcm-tokens', protect, admin, async (req, res) => {
  try {
    const updateResult = await User.update(
      { fcmToken: null },
      {
        where: {}
      }
    );

    const clearedCount = updateResult[0];

    logger.info(`Admin ${req.user.email} cleared all FCM tokens (${clearedCount} users)`);

    res.json({
      message: `FCM tokens cleared for ${clearedCount} users`,
      clearedCount
    });
  } catch (error) {
    logger.error('Error clearing FCM tokens:', error);
    res.status(500).json({ message: 'Error clearing FCM tokens' });
  }
});

module.exports = router;