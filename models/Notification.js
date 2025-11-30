const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a title' }
    }
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a message body' }
    }
  },
  type: {
    type: DataTypes.ENUM(
      'order', 'promotion', 'general', 'delivery', 'cart',
      'new_arrival', 'price_drop', 'back_in_stock', 'cart_reminder', 
      'abandoned_cart', 'order_confirmation', 'order_shipped', 'order_delivered',
      'daily_deal', 'product_recommendation', 'loyalty_points', 'app_update',
      'login_alert', 'password_change', 'payment_failed', 'rate_experience', 'feedback_request'
    ),
    defaultValue: 'general'
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'notifications'
});

module.exports = Notification;
