const Notification = require('../models/Notification');
const { sendNotificationToUser, sendNotificationToAll } = require('../services/notificationService');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (notification) {
      notification.isRead = true;
      await notification.save();
      res.json(notification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { 
        where: { 
          userId: req.user.id, 
          isRead: false 
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send notification to specific user
// @route   POST /api/notifications/send
// @access  Private/Admin
exports.sendToUser = async (req, res) => {
  try {
    const { userId, title, body, type, data } = req.body;

    await sendNotificationToUser(userId, title, body, data, type);

    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send notification to all users
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
exports.sendToAll = async (req, res) => {
  try {
    const { title, body, type, data } = req.body;

    const result = await sendNotificationToAll(title, body, data, type);

    res.json({ 
      message: 'Broadcast sent successfully',
      successCount: result.successCount,
      failureCount: result.failureCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (notification) {
      await notification.destroy();
      res.json({ message: 'Notification deleted' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
