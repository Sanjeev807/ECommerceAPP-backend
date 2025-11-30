require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/database');
const initializeFirebase = require('./config/firebaseAdmin');
const logger = require('./utils/logger');

const app = express();

// Trust proxy for accurate IP detection
app.set('trust proxy', true);

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to log when response is finished
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    logger.request(req, res, duration);
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Connect to PostgreSQL and sync models
(async () => {
  try {
    console.log('🚀 Starting E-commerce server...');
    await connectDB();
    await sequelize.sync({ alter: true }); // This will update table schemas based on model changes
    logger.info('Database tables synchronized successfully');
    console.log('📊 Database tables synchronized successfully');
    
    // Check if database needs seeding
    const Product = require('./models/Product');
    const productCount = await Product.count();
    console.log(`📦 Found ${productCount} products in database`);
    
    if (productCount === 0) {
      console.log('📦 No products found. Auto-seeding database...');
      try {
        const { exec } = require('child_process');
        const path = require('path');
        const seedPath = path.join(__dirname, './utils/newSeed.js');
        
        exec(`node "${seedPath}"`, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Auto-seed failed:', error);
          } else {
            console.log('✅ Auto-seed completed with 50 products');
          }
        });
      } catch (seedError) {
        console.error('❌ Error during auto-seed:', seedError);
      }
    }
  } catch (error) {
    logger.error('Error syncing database tables:', error);
    console.error('❌ Error syncing database tables:', error);
    process.exit(1);
  }
})();

// Initialize Firebase Admin SDK for Push Notifications
let firebaseEnabled = false;
try {
  firebaseEnabled = initializeFirebase();
  if (firebaseEnabled) {
    logger.info('Firebase Admin SDK initialized successfully');
    console.log('✅ Firebase Admin SDK initialized successfully');
    logger.info('📱 Push notifications enabled via Firebase Cloud Messaging');
    
    // Start promotional notification scheduler
    const promotionalScheduler = require('./services/promotionalScheduler');
    promotionalScheduler.start();
    logger.info('🎯 Promotional notification scheduler started');
    console.log('🎯 Promotional notification scheduler started');
  } else {
    console.log('⚠️  Firebase not initialized - Running in development mode');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With'
  ]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for admin panel
app.use(express.static('../frontend'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/fcm', require('./routes/fcm'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'E-commerce API with Push Notifications is running!',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders',
      notifications: '/api/notifications',
      admin: '/api/admin',
      fcm: '/api/send-notification'
    }
  });
});

// Detailed health check for debugging
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      server: 'running',
      database: 'connected',
      firebase: firebaseEnabled ? 'enabled' : 'disabled',
      port: process.env.PORT || 5000,
      endpoints: {
        auth: '/api/auth',
        products: '/api/products',
        cart: '/api/cart',
        orders: '/api/orders',
        notifications: '/api/notifications',
        admin: '/api/admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      server: 'running',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, err);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

// Enhanced error handling for server startup
const startServer = () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`🚀 E-commerce server running on port ${PORT}`);
      logger.info(`📱 Push notifications enabled via Firebase Cloud Messaging`);
      logger.info(`🏪 Admin panel: http://localhost:${PORT}/admin.html`);
      logger.info(`🌐 API endpoints: http://localhost:${PORT}/api`);
      logger.info(`📊 Health check: http://localhost:${PORT}/`);
      
      console.log(`🚀 E-commerce server running on port ${PORT}`);
      console.log(`📱 Push notifications enabled via Firebase Cloud Messaging`);
      console.log(`🏪 Admin panel: http://localhost:${PORT}/admin.html`);
      console.log(`🌐 API endpoints: http://localhost:${PORT}/api`);
      console.log(`📊 Health check: http://localhost:${PORT}/`);
      console.log('✅ Server startup complete!');
      console.log('\n🎯 Ready for user registration and login!');
      console.log('   - Registration endpoint: POST /api/auth/register');
      console.log('   - Login endpoint: POST /api/auth/login');
      console.log('   - Health check: GET /health\n');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try stopping any other instances or use a different port');
      } else {
        console.error('❌ Server error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Global error handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  console.error('❌ Unhandled Promise Rejection:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process for FCM token errors
  if (error.message && error.message.includes('messaging/registration-token-not-registered')) {
    logger.warn('FCM token error handled gracefully');
    console.warn('⚠️  FCM token error handled gracefully - continuing server operation');
    return;
  }
  // For other critical errors, you might want to exit
  // process.exit(1);
});

startServer();
