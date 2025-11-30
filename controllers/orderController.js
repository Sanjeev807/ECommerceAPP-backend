const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendNotificationToUser } = require('../services/notificationService');
const fcmService = require('../services/fcmService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Calculate total and verify stock
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.id || item.productId);
      
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.id || item.productId}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}` 
        });
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.images ? product.images[0] : null
      });

      totalAmount += product.price * item.quantity;

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'completed'
    });

    // Clear cart after order
    await Cart.update(
      { items: [] },
      { where: { userId: req.user.id } }
    );

    // Send order placed notification
    await sendNotificationToUser(
      req.user.id,
      '📦 Order Placed Successfully!',
      `Your order #${order.id} of ₹${totalAmount.toLocaleString()} has been placed. Waiting for admin confirmation.`,
      { type: 'order_placed', orderId: order.id, amount: totalAmount },
      'order'
    );

    // Send FCM push notification
    try {
      await fcmService.sendOrderNotification(req.user.id, 'placed', order.id);
    } catch (fcmError) {
      console.error('FCM notification failed:', fcmError.message);
    }

    res.status(201).json({
      id: order.id,
      userId: order.userId,
      items: order.items,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderDate: order.orderDate,
      createdAt: order.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['orderDate', 'DESC']]
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (order && order.userId === req.user.id) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (order) {
      order.status = status;
      
      if (status === 'delivered') {
        order.deliveryDate = new Date();
      }

      await order.save();

      // Send push notification about status update
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
        out_for_delivery: {
          title: '🏃 Order Out for Delivery',
          body: `Your order #${order.id} is out for delivery. It will arrive soon!`,
          type: 'order_out_for_delivery'
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
        type: 'order_update'
      };

      await sendNotificationToUser(
        order.userId,
        notification.title,
        notification.body,
        { type: notification.type, orderId: order.id, status },
        'order'
      );

      // Send FCM push notification
      try {
        await fcmService.sendOrderNotification(order.userId, status, order.id);
      } catch (fcmError) {
        console.error('FCM notification failed:', fcmError.message);
      }

      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Cannot cancel order that has been shipped or delivered' 
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findByPk(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Send cancellation notification
    await sendNotificationToUser(
      req.user.id,
      '❌ Order Cancelled',
      `Your order #${order.id} has been cancelled successfully.`,
      { type: 'order_cancelled', orderId: order.id },
      'order'
    );

    // Send FCM push notification
    try {
      await fcmService.sendOrderNotification(req.user.id, 'cancelled', order.id);
    } catch (fcmError) {
      console.error('FCM notification failed:', fcmError.message);
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
