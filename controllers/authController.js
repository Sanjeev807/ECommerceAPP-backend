const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { sendNotificationToUser } = require('../services/notificationService');
const fcmService = require('../services/fcmService');

// Generate JWT Token
const generateToken = (id) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
  } catch (error) {
    logger.error('JWT token generation failed:', error);
    throw new Error('Failed to generate authentication token');
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, fcmToken } = req.body;

    console.log('📝 Registration attempt for:', email);

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      fcmToken
    });

    if (user) {
      logger.info(`New user registered: ${user.email}`);
      console.log('✅ User created successfully:', user.email);
      
      // Send FCM push notification for registration (optional, don't fail if it errors)
      if (user.fcmToken) {
        try {
          // Use the correct method name and add more robust error handling
          if (fcmService && typeof fcmService.sendAccountNotification === 'function') {
            await fcmService.sendAccountNotification(user.id, user.name, 'register');
            console.log('📱 Registration FCM notification sent');
          } else {
            console.log('⚠️ FCM service not available, skipping notification');
          }
        } catch (fcmError) {
          logger.error('FCM notification failed (non-critical):', fcmError);
          console.log('⚠️ FCM notification failed, but registration succeeded');
        }
      }
      
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      logger.warn(`Failed to create user: ${email}`);
      console.log('❌ Failed to create user in database');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error('Error in user registration:', error);
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;
    
    console.log(`🔐 Login attempt for: ${email}`);
    console.log(`📱 FCM Token provided: ${fcmToken ? 'Yes' : 'No'}`);

    // Check for user email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`✅ Login successful for: ${email}`);

    // Update FCM token if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
      console.log(`✅ FCM token updated for user: ${user.email}`);
    }

    // Send notifications (optional, don't fail login if they error)
    try {
      // Send login notification to database
      await sendNotificationToUser(
        user.id,
        '🔐 Login Successful',
        `Welcome back, ${user.name}! You have successfully logged in.`,
        { type: 'login' },
        'login_alert'
      );
      console.log('✅ Database notification sent');
    } catch (notifyError) {
      console.log('⚠️ Database notification failed (non-critical):', notifyError.message);
    }

    // Send FCM push notifications for login (optional)
    if (user.fcmToken) {
      try {
        console.log(`📲 Sending FCM notifications to user: ${user.email}`);
        
        // Check if FCM service is available and has the required methods
        if (fcmService && typeof fcmService.sendToUser === 'function') {
          const notifications = [
            fcmService.sendToUser(
              user.id,
              `🎉 Welcome Back, ${user.name}!`,
              'Great to see you again! Your favorite deals are waiting for you.',
              { type: 'account', action: 'login', link: '/' }
            ),
            fcmService.sendToUser(
              user.id,
              '✅ Login Successful',
              'You\'re all set! Push notifications are enabled for exclusive deals and updates.',
              { type: 'account', action: 'login_confirmed', link: '/' }
            )
          ];
          
          await Promise.all(notifications);
          console.log(`✅ FCM notifications sent successfully!`);
        } else {
          console.log('⚠️ FCM service methods not available, skipping notifications');
        }
      } catch (fcmError) {
        logger.error('FCM notification failed (non-critical):', fcmError);
        console.log('⚠️ FCM notifications failed, but login succeeded');
      }
    } else {
      console.log('⚠️ No FCM token available, skipping push notifications');
    }

    logger.info(`User logged in: ${user.email}`);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user.id)
    });
  } catch (error) {
    logger.error('Login error:', error);
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      // Send profile update notification
      await sendNotificationToUser(
        updatedUser.id,
        '🧾 Profile Updated Successfully',
        'Your profile information has been updated.',
        { type: 'account' },
        'profile_update'
      );

      // Send FCM push notification
      if (updatedUser.fcmToken) {
        try {
          await fcmService.sendAccountNotification(updatedUser.id, updatedUser.name, 'profile_update');
        } catch (fcmError) {
          logger.error('FCM notification failed:', fcmError);
        }
      }

      res.json({
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        token: generateToken(updatedUser.id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update FCM Token
// @route   PUT /api/auth/fcm-token
// @access  Private
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (user) {
      user.fcmToken = fcmToken;
      await user.save();
      
      res.json({ message: 'FCM token updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user (send notifications and clear FCM token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user) {
      const userName = user.name;
      const userToken = user.fcmToken;
      
      // Send logout notifications BEFORE clearing token
      if (userToken) {
        try {
          console.log(`📲 Sending logout FCM notifications to user: ${user.email}`);
          
          const notifications = [
            fcmService.sendToUser(
              user.id,
              `👋 See You Soon, ${userName}!`,
              'Thanks for shopping with E-Shop! Your cart is saved for next time.',
              { type: 'account', action: 'logout', link: '/' }
            ),
            fcmService.sendToUser(
              user.id,
              '🎁 Don\'t Miss Out!',
              'New deals arrive daily. Log back in anytime to catch exclusive offers!',
              { type: 'engagement', action: 'comeback', link: '/login' }
            )
          ];
          
          await Promise.all(notifications);
          console.log(`✅ Logout notifications sent successfully!`);
        } catch (fcmError) {
          console.error('❌ Logout FCM notification failed:', fcmError.message);
        }
      }
      
      // Clear FCM token after sending notifications
      user.fcmToken = null;
      await user.save();
      
      logger.info(`User logged out: ${user.email}`);
      res.json({ message: 'Logged out successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    logger.error('Error during logout:', error);
    res.status(500).json({ message: error.message });
  }
};
