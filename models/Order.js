const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
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
  items: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Shipping address is required' }
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('card', 'upi', 'netbanking', 'cod'),
    allowNull: false
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Total amount cannot be negative' }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  orderDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'orders'
});

module.exports = Order;
