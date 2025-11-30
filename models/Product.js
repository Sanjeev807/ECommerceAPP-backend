const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a product name' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a product description' }
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price cannot be negative' }
    }
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    validate: {
      min: { args: [0], msg: 'Original price cannot be negative' }
    }
  },
  discount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Discount cannot be negative' },
      max: { args: [100], msg: 'Discount cannot exceed 100%' }
    }
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Beauty', 'Toys', 'Grocery']],
        msg: 'Invalid category'
      }
    }
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Stock cannot be negative' }
    }
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Rating cannot be negative' },
      max: { args: [5], msg: 'Rating cannot exceed 5' }
    }
  },
  reviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Reviews count cannot be negative' }
    }
  },
  specifications: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'products'
});

module.exports = Product;
