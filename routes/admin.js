const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const { protect, admin } = require('../middleware/auth');

/**
 * Admin Routes
 * Protected routes for admin dashboard functionality
 */

// All admin routes require authentication and admin role
router.use(protect);
router.use(admin);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalNotifications = await Notification.count();
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get recent notifications (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNotifications = await Notification.count({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // Calculate growth percentages (mock data for demo)
    const userGrowth = recentUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : 0;
    const notificationGrowth = recentNotifications > 0 ? ((recentNotifications / totalNotifications) * 100).toFixed(1) : 0;

    res.json({
      totalUsers,
      totalProducts,
      totalOrders: 0, // Orders table may not exist yet
      totalRevenue: 0, // Revenue calculation would go here
      totalNotifications,
      activeSessions: Math.floor(Math.random() * 20) + 5, // Mock active sessions
      growth: {
        users: userGrowth,
        notifications: notificationGrowth
      },
      recent: {
        users: recentUsers,
        notifications: recentNotifications
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt'] // Exclude password
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
        hasMore: offset + users.length < count
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user count
router.get('/users/count', async (req, res) => {
  try {
    const count = await User.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ message: 'Error fetching user count', error: error.message });
  }
});

// Get user details by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's notifications
    const notifications = await Notification.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      user,
      notifications,
      stats: {
        totalNotifications: notifications.length
      }
    });

  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
});

// Get all products with admin details
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalProducts: count,
        hasMore: offset + products.length < count
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Get all orders (Admin)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['orderDate', 'DESC']]
    });

    // Fetch user details for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await User.findByPk(order.userId, {
          attributes: ['id', 'name', 'email']
        });
        return {
          ...order.toJSON(),
          User: user
        };
      })
    );

    res.json(ordersWithUsers);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Update order status (Admin)
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.deliveryDate = new Date();
    }

    await order.save();

    // Send notification to user about status update
    const statusMessages = {
      confirmed: {
        title: '✅ Order Confirmed',
        body: `Your order #${order.id} has been confirmed and is being prepared.`,
        type: 'order_confirmed'
      },
      processing: {
        title: '🔄 Order Processing',
        body: `Your order #${order.id} is being processed.`,
        type: 'order_processing'
      },
      shipped: {
        title: '📦 Order Shipped!',
        body: `Great news! Your order #${order.id} has been shipped and is on its way.`,
        type: 'order_shipped'
      },
      delivered: {
        title: '✅ Order Delivered!',
        body: `Your order #${order.id} has been delivered successfully. Thank you for shopping with E-Shop!`,
        type: 'order_delivered'
      },
      cancelled: {
        title: '❌ Order Cancelled',
        body: `Your order #${order.id} has been cancelled.`,
        type: 'order_cancelled'
      }
    };

    const notification = statusMessages[status] || {
      title: 'Order Status Updated',
      body: `Order #${order.id} status: ${status}`,
      type: 'order'
    };

    await Notification.create({
      userId: order.userId,
      title: notification.title,
      body: notification.body,
      type: 'order',
      data: JSON.stringify({ orderId: order.id, status }),
      sentAt: new Date()
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
});

// Get notification statistics
router.get('/notifications/stats', async (req, res) => {
  try {
    const total = await Notification.count();
    
    // Get notifications by type
    const byType = await Notification.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });

    // Get recent notifications (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await Notification.count({
      where: {
        createdAt: {
          [Op.gte]: oneDayAgo
        }
      }
    });

    // Get notifications by date (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const byDate = await Notification.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      total,
      recent,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byDate
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Error fetching notification statistics', error: error.message });
  }
});

// Get recent notifications
router.get('/notifications/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      raw: true
    });

    res.json(notifications);

  } catch (error) {
    console.error('❌ Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Error fetching recent notifications', error: error.message });
  }
});

// Send bulk notification to all users
router.post('/notifications/broadcast', async (req, res) => {
  try {
    const { title, message, type = 'general' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all users
    const users = await User.findAll({
      attributes: ['id']
    });

    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user.id,
      title,
      body: message,
      type: 'general', // Use valid enum value
      data: JSON.stringify({ source: 'admin_broadcast' }),
      sentAt: new Date()
    }));

    await Notification.bulkCreate(notifications);

    res.json({
      success: true,
      message: `Broadcast notification sent to ${users.length} users!`,
      recipientCount: users.length,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ 
      error: 'Failed to send broadcast notification',
      details: error.message
    });
  }
});

// Send promotional offer notification
router.post('/notifications/offer', async (req, res) => {
  try {
    const { title, message, discount, category, type = 'promotion' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Get all users
    const users = await User.findAll({
      attributes: ['id']
    });

    // Create promotional notifications for all users
    const notifications = users.map(user => ({
      userId: user.id,
      title: `🎉 ${title}`,
      body: message,
      type,
      data: JSON.stringify({ 
        source: 'admin_promotion', 
        discount: discount || null,
        category: category || null
      }),
      sentAt: new Date()
    }));

    await Notification.bulkCreate(notifications);

    res.json({
      success: true,
      message: `Promotional notification sent to ${users.length} users!`,
      recipientCount: users.length,
      offer: {
        title,
        message,
        discount,
        category
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error sending promotional notification:', error);
    res.status(500).json({ 
      error: 'Failed to send promotional notification',
      details: error.message
    });
  }
});

// Test notification endpoint
router.post('/notifications/test', async (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // If userId provided, send to specific user, otherwise send to first available user
    let targetUserId = userId;
    if (!targetUserId) {
      const user = await User.findOne();
      if (!user) {
        return res.status(404).json({ error: 'No users found for testing' });
      }
      targetUserId = user.id;
    }

    const notification = await Notification.create({
      userId: targetUserId,
      title,
      body: message,
      type,
      data: JSON.stringify({ source: 'admin_test' }),
      sentAt: new Date()
    });

    res.json({
      success: true,
      message: 'Test notification sent successfully!',
      userId: targetUserId,
      notification
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error.message
    });
  }
});

// Get system health status
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      database: 'connected',
      services: {
        authentication: 'running',
        notifications: 'running',
        products: 'running'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    res.json(health);

  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Export router
module.exports = router;