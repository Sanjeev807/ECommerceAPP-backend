const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const fcmService = require('../services/fcmService');
const User = require('../models/User');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, page = 1, limit = 1000 } = req.query;

    let where = {};
    let order = [];

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Search by name or description
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    // Sort options
    if (sort === 'price_low') order.push(['price', 'ASC']);
    else if (sort === 'price_high') order.push(['price', 'DESC']);
    else if (sort === 'rating') order.push(['rating', 'DESC']);
    else order.push(['createdAt', 'DESC']);

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      order,
      limit: Number(limit),
      offset
    });

    // If no products exist, auto-seed the database
    if (count === 0 && !search && !category) {
      console.log('📦 No products found in database. Auto-seeding...');
      try {
        const { exec } = require('child_process');
        const path = require('path');
        const seedPath = path.join(__dirname, '../utils/newSeed.js');
        
        exec(`node ${seedPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Auto-seed failed:', error);
          } else {
            console.log('✅ Auto-seed completed with 50 products:', stdout);
          }
        });
        
        // Return empty result for now, user can refresh
        return res.json({
          products: [],
          page: Number(page),
          pages: 0,
          total: 0,
          message: 'Database is being seeded. Please refresh in a moment.'
        });
      } catch (seedError) {
        console.error('❌ Error during auto-seed:', seedError);
      }
    }

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isFeatured: true },
      limit: 10
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      // Send engagement notification to random users about popular products
      try {
        const randomUsers = await User.findAll({
          where: { fcmToken: { [Op.ne]: null } },
          order: sequelize.random(),
          limit: 3
        });
        
        randomUsers.forEach(async (user) => {
          setTimeout(async () => {
            await fcmService.sendEngagementNotification(
              user.id, 
              user.name, 
              'trending_products'
            );
          }, Math.random() * 30000); // Random delay 0-30 seconds
        });
      } catch (notifError) {
        console.log('Product engagement notification failed:', notifError.message);
      }
      
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // Send new product notifications to all users immediately
    try {
      console.log('📤 Sending new product notifications...');
      const users = await User.findAll({
        where: { fcmToken: { [Op.ne]: null } },
        limit: 20 // Notify first 20 users immediately
      });
      
      if (users.length > 0) {
        const notifications = users.map(user => 
          fcmService.sendToUser(
            user.id,
            '🆕 New Product Alert!',
            `Check out ${product.name} - just added to ${product.category}! Limited stock available.`,
            {
              type: 'new_product',
              productId: product.id.toString(),
              productName: product.name,
              category: product.category,
              link: `/products/${product.id}`
            }
          )
        );
        
        await Promise.all(notifications);
        console.log(`✅ New product notifications sent to ${users.length} users!`);
      }
    } catch (notifError) {
      console.log('New product notification failed:', notifError.message);
    }
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const [updated] = await Product.update(req.body, {
      where: { id: req.params.id },
      returning: true
    });

    if (updated) {
      const product = await Product.findByPk(req.params.id);
      
      // Send notifications for price drops IMMEDIATELY
      if (req.body.price && req.body.originalPrice && req.body.price < req.body.originalPrice) {
        try {
          console.log('📤 Sending price drop notifications...');
          const users = await User.findAll({
            where: { fcmToken: { [Op.ne]: null } },
            limit: 15
          });
          
          const discount = Math.round(((req.body.originalPrice - req.body.price) / req.body.originalPrice) * 100);
          
          const notifications = users.map(user =>
            fcmService.sendToUser(
              user.id,
              `💰 Price Drop Alert - ${discount}% OFF!`,
              `${product.name} is now ₹${req.body.price}! Was ₹${req.body.originalPrice}. Grab it before stock runs out!`,
              {
                type: 'price_drop',
                productId: product.id.toString(),
                productName: product.name,
                discount: discount.toString(),
                oldPrice: req.body.originalPrice.toString(),
                newPrice: req.body.price.toString(),
                link: `/products/${product.id}`
              }
            )
          );
          
          await Promise.all(notifications);
          console.log(`✅ Price drop notifications sent to ${users.length} users!`);
        } catch (notifError) {
          console.log('Price drop notification failed:', notifError.message);
        }
      }
      
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send new product announcement notification
// @route   POST /api/products/:id/announce
// @access  Private/Admin
exports.announceNewProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Get all users with FCM tokens
    const users = await User.findAll({
      where: { fcmToken: { [Op.ne]: null } }
    });
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'No users to notify' });
    }
    
    // Send new arrival notifications
    let successCount = 0;
    let failureCount = 0;
    
    for (const user of users) {
      try {
        await fcmService.sendToUser(
          user.id,
          '🚀 New Arrival Alert!',
          `Check out ${product.name} - now available in ${product.category}!`,
          {
            type: 'new_product',
            productId: product.id,
            productName: product.name,
            category: product.category,
            link: `/products/${product.id}`
          }
        );
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Failed to send notification to user ${user.id}:`, error.message);
      }
    }
    
    res.json({
      message: 'New product announcement sent',
      product: {
        id: product.id,
        name: product.name,
        category: product.category
      },
      notifications: {
        total: users.length,
        success: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    console.error('Error announcing new product:', error);
    res.status(500).json({ message: error.message });
  }
};
