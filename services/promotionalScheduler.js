const cron = require('node-cron');
const fcmService = require('./fcmService');
const logger = require('../utils/logger');

class PromotionalScheduler {
  constructor() {
    this.scheduledJobs = [];
    this.isRunning = false;
  }

  /**
   * Start all promotional notification schedulers
   */
  start() {
    if (this.isRunning) {
      logger.warn('Promotional scheduler is already running');
      return;
    }

    logger.info('🚀 Starting promotional notification scheduler...');

    // Schedule 0: Daily FCM token cleanup (6 AM daily)
    const tokenCleanup = cron.schedule('0 6 * * *', async () => {
      logger.info('🧹 Running daily FCM token cleanup...');
      try {
        await this.cleanupInvalidFCMTokens();
      } catch (error) {
        logger.error('Error during FCM token cleanup:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 1: Morning promotional notifications (9 AM daily)
    const morningPromo = cron.schedule('0 9 * * *', async () => {
      logger.info('⏰ Sending morning promotional notifications...');
      try {
        const promo = fcmService.getRandomPromotionalMessage();
        const result = await fcmService.sendPromotionalNotification(
          promo.title,
          promo.body,
          'morning_promo'
        );
        if (result && !result.success) {
          logger.warn('Morning promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending morning promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 2: Afternoon flash sale (2 PM daily)
    const afternoonPromo = cron.schedule('0 14 * * *', async () => {
      logger.info('⏰ Sending afternoon flash sale notifications...');
      try {
        const result = await fcmService.sendPromotionalNotification(
          '⚡ Afternoon Flash Sale — 60% OFF!',
          'Limited time offer! Grab your favorites at amazing discounts. Ends in 4 hours!',
          'flash_sale'
        );
        if (result && !result.success) {
          logger.warn('Afternoon promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending afternoon promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 3: Evening deals (6 PM daily)
    const eveningPromo = cron.schedule('0 18 * * *', async () => {
      logger.info('⏰ Sending evening deal notifications...');
      try {
        const promo = fcmService.getRandomPromotionalMessage();
        const result = await fcmService.sendPromotionalNotification(
          promo.title,
          promo.body,
          'evening_deals'
        );
        if (result && !result.success) {
          logger.warn('Evening promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending evening promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 4: Weekend special (Saturday & Sunday at 11 AM)
    const weekendPromo = cron.schedule('0 11 * * 6,0', async () => {
      logger.info('⏰ Sending weekend special notifications...');
      try {
        const result = await fcmService.sendPromotionalNotification(
          '🎉 Weekend Bonanza — Extra 25% OFF!',
          'It\'s the weekend! Treat yourself with our special weekend offers. Shop now!',
          'weekend_special'
        );
        if (result && !result.success) {
          logger.warn('Weekend promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending weekend promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 5: Midnight sale (12 AM daily)
    const midnightPromo = cron.schedule('0 0 * * *', async () => {
      logger.info('⏰ Sending midnight sale notifications...');
      try {
        const result = await fcmService.sendPromotionalNotification(
          '🌙 Midnight Madness — 50% OFF Everything!',
          'Can\'t sleep? Shop now and grab insane midnight deals. Limited time only!',
          'midnight_sale'
        );
        if (result && !result.success) {
          logger.warn('Midnight promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending midnight promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    // Schedule 6: Random promotional notifications every 4 hours
    const randomPromo = cron.schedule('0 */4 * * *', async () => {
      logger.info('⏰ Sending random promotional notification...');
      try {
        const promo = fcmService.getRandomPromotionalMessage();
        const result = await fcmService.sendPromotionalNotification(
          promo.title,
          promo.body,
          'random_promo'
        );
        if (result && !result.success) {
          logger.warn('Random promo notification failed:', result.error);
        }
      } catch (error) {
        logger.error('Error sending random promo:', error.message);
        // Don't re-throw, just log and continue
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.scheduledJobs = [
      morningPromo,
      afternoonPromo,
      eveningPromo,
      weekendPromo,
      midnightPromo,
      randomPromo
    ];

    this.isRunning = true;
    logger.info('✅ Promotional scheduler started successfully with 6 scheduled jobs');
  }

  /**
   * Stop all promotional schedulers
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Promotional scheduler is not running');
      return;
    }

    logger.info('⏹️ Stopping promotional notification scheduler...');
    
    this.scheduledJobs.forEach(job => {
      job.stop();
    });

    this.scheduledJobs = [];
    this.isRunning = false;
    
    logger.info('✅ Promotional scheduler stopped successfully');
  }

  /**
   * Send promotional notification immediately
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {string} promoType - Type of promotion
   */
  async sendNow(title, body, promoType = 'manual') {
    try {
      logger.info('📢 Sending immediate promotional notification...');
      const result = await fcmService.sendPromotionalNotification(title, body, promoType);
      
      if (result && result.success) {
        logger.info('✅ Promotional notification sent successfully');
      } else {
        logger.warn('⚠️ Promotional notification partially failed:', result?.error);
      }
      
      return result;
    } catch (error) {
      logger.error('Error sending promotional notification:', error.message);
      // Return error response instead of throwing
      return {
        success: false,
        error: error.message,
        message: 'Failed to send promotional notification'
      };
    }
  }

  /**
   * Send random promotional notification now
   */
  async sendRandomNow() {
    const promo = fcmService.getRandomPromotionalMessage();
    return await this.sendNow(promo.title, promo.body, 'manual_random');
  }

  /**
   * Clean up invalid FCM tokens from database
   */
  async cleanupInvalidFCMTokens() {
    try {
      const User = require('../models/User');
      const { Op } = require('sequelize');
      
      // Find users with potentially invalid tokens (empty strings, very short tokens, etc.)
      const invalidTokenPatterns = {
        [Op.or]: [
          { fcmToken: '' },
          { fcmToken: { [Op.like]: '% %' } }, // Tokens with spaces
          { fcmToken: { [Op.like]: '%undefined%' } },
          { fcmToken: { [Op.like]: '%null%' } },
          // Very short tokens (valid FCM tokens are usually much longer)
          { fcmToken: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] } }
        ]
      };

      const usersWithInvalidTokens = await User.findAll({
        where: {
          fcmToken: { [Op.ne]: null },
          ...invalidTokenPatterns
        },
        attributes: ['id', 'email', 'fcmToken']
      });

      if (usersWithInvalidTokens.length > 0) {
        await User.update(
          { fcmToken: null },
          { 
            where: { 
              id: { [Op.in]: usersWithInvalidTokens.map(u => u.id) }
            }
          }
        );
        logger.info(`🧹 Cleaned up ${usersWithInvalidTokens.length} invalid FCM tokens`);
      } else {
        logger.info('🧹 No invalid FCM tokens found during cleanup');
      }
    } catch (error) {
      logger.error('Error during FCM token cleanup:', error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.scheduledJobs.length,
      jobs: [
        { name: 'Morning Promo', schedule: '9 AM daily', status: this.isRunning ? 'active' : 'stopped' },
        { name: 'Afternoon Flash Sale', schedule: '2 PM daily', status: this.isRunning ? 'active' : 'stopped' },
        { name: 'Evening Deals', schedule: '6 PM daily', status: this.isRunning ? 'active' : 'stopped' },
        { name: 'Weekend Special', schedule: '11 AM Sat & Sun', status: this.isRunning ? 'active' : 'stopped' },
        { name: 'Midnight Sale', schedule: '12 AM daily', status: this.isRunning ? 'active' : 'stopped' },
        { name: 'Random Promo', schedule: 'Every 4 hours', status: this.isRunning ? 'active' : 'stopped' }
      ]
    };
  }
}

module.exports = new PromotionalScheduler();
