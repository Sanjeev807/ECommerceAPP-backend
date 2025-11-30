const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendNotificationToUser } = require('../services/notificationService');
const fcmService = require('../services/fcmService');
const User = require('../models/User');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      // Populate product details for items
      const itemsWithProducts = await Promise.all(
        cart.items.map(async (item) => {
          const product = await Product.findByPk(item.productId);
          return {
            ...item,
            product: product
          };
        })
      );
      
      res.json({
        ...cart.toJSON(),
        items: itemsWithProducts
      });
    } else {
      res.json({ userId: req.user.id, items: [] });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Check if product exists (using Sequelize syntax)
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      // Check if product already in cart
      const items = cart.items || [];
      const itemIndex = items.findIndex(item => item.productId === productId);

      if (itemIndex > -1) {
        // Update quantity
        items[itemIndex].quantity += quantity;
      } else {
        // Add new item
        items.push({ productId: productId, quantity });
      }
      
      cart.items = items;
      await cart.save();
    } else {
      // Create new cart
      cart = await Cart.create({
        userId: req.user.id,
        items: [{ productId: productId, quantity }]
      });
    }

    // Return cart with populated product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findByPk(item.productId);
        return {
          ...item,
          product: product
        };
      })
    );

    res.json({
      ...cart.toJSON(),
      items: itemsWithProducts
    });

    // Send immediate cart notification via FCM
    try {
      const user = await User.findByPk(req.user.id);
      if (user && user.fcmToken) {
        console.log('📤 Sending cart notification...');
        await fcmService.sendToUser(
          req.user.id,
          '🛒 Added to Cart!',
          `${product.name} is now in your cart. Complete your purchase before it sells out!`,
          {
            type: 'cart',
            action: 'item_added',
            productId: productId.toString(),
            productName: product.name,
            link: '/cart'
          }
        );
        console.log('✅ Cart notification sent!');
      }
    } catch (notificationError) {
      console.log('Cart notification failed:', notificationError.message);
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const items = cart.items || [];
    const itemIndex = items.findIndex(item => item.productId === parseInt(req.params.itemId));
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Check stock (using Sequelize syntax)
    const product = await Product.findByPk(items[itemIndex].productId);
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    items[itemIndex].quantity = quantity;
    cart.items = items;
    await cart.save();

    // Return cart with populated product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findByPk(item.productId);
        return {
          ...item,
          product: product
        };
      })
    );

    res.json({
      ...cart.toJSON(),
      items: itemsWithProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const items = cart.items || [];
    cart.items = items.filter(item => item.productId !== parseInt(req.params.itemId));
    
    await cart.save();

    // Return cart with populated product details
    const itemsWithProducts = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findByPk(item.productId);
        return {
          ...item,
          product: product
        };
      })
    );

    res.json({
      ...cart.toJSON(),
      items: itemsWithProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.user.id } });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
