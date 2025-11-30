const fcmService = require('./fcmService');

class PromotionalNotificationService {
  constructor() {
    this.promotionalMessages = [
      {
        title: '🔥 Hot Deals Today!',
        message: 'Flat 50% Off on Electronics! Limited time offer - Shop now!',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        category: 'Electronics',
        type: 'discount'
      },
      {
        title: '🎉 Big Sale Alert!',
        message: 'Massive discounts on Fashion & Accessories! Hurry before it\'s gone!',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        category: 'Fashion',
        type: 'sale'
      },
      {
        title: '⚡ Flash Sale Live!',
        message: 'Get up to 70% OFF on Home & Living items. Don\'t miss out!',
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
        category: 'Home & Living',
        type: 'flash'
      },
      {
        title: '🎁 Special Offer Just for You!',
        message: 'Extra 30% cashback on your first purchase today!',
        image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
        category: 'All',
        type: 'cashback'
      },
      {
        title: '📱 Trending Now!',
        message: 'New arrivals in Smartphones & Gadgets. Shop the latest tech!',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
        category: 'Electronics',
        type: 'trending'
      },
      {
        title: '🛍️ Weekend Special!',
        message: 'Buy 1 Get 1 Free on selected items. Limited stock available!',
        image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800',
        category: 'All',
        type: 'bogo'
      },
      {
        title: '💎 Premium Collection!',
        message: 'Exclusive designer wear now available. Elevate your style!',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
        category: 'Fashion',
        type: 'premium'
      },
      {
        title: '🏃 Fitness Gear Sale!',
        message: 'Up to 60% off on Sports & Fitness equipment. Get fit, save big!',
        image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        category: 'Sports & Fitness',
        type: 'discount'
      },
      {
        title: '📚 Book Lovers Paradise!',
        message: 'Best-selling books at unbeatable prices. Read more, spend less!',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',
        category: 'Books',
        type: 'discount'
      },
      {
        title: '🎮 Gamers Alert!',
        message: 'Hot deals on gaming consoles & accessories. Level up your game!',
        image: 'https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?w=800',
        category: 'Electronics',
        type: 'gaming'
      },
      {
        title: '🌟 New Year Mega Sale!',
        message: 'Start fresh with amazing deals across all categories!',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
        category: 'All',
        type: 'seasonal'
      },
      {
        title: '⏰ Midnight Madness!',
        message: 'Crazy deals active now! Shop before sunrise and save BIG!',
        image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
        category: 'All',
        type: 'flash'
      },
      {
        title: '🎯 Deal of the Day!',
        message: 'Smart LED TV at ₹44,999 only! Original price ₹64,999. Save ₹20,000!',
        image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800',
        category: 'Electronics',
        type: 'deal'
      },
      {
        title: '💝 Fashion Fiesta!',
        message: 'Trendy outfits starting at just ₹499. Upgrade your wardrobe now!',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
        category: 'Fashion',
        type: 'trending'
      },
      {
        title: '🚀 Free Delivery Today!',
        message: 'Zero delivery charges on all orders. Shop without limits!',
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
        category: 'All',
        type: 'shipping'
      }
    ];

    this.userNotificationHistory = new Map();
  }

  getRandomPromotion() {
    const randomIndex = Math.floor(Math.random() * this.promotionalMessages.length);
    return this.promotionalMessages[randomIndex];
  }

  getSmartPromotion(userId, userPreferences = {}) {
    const history = this.userNotificationHistory.get(userId) || [];
    
    const availablePromotions = this.promotionalMessages.filter(promo => {
      const recentlySent = history.some(h => 
        h.title === promo.title && 
        (Date.now() - h.timestamp) < 3600000
      );
      return !recentlySent;
    });

    if (availablePromotions.length === 0) {
      return this.getRandomPromotion();
    }

    if (userPreferences.category) {
      const categoryMatch = availablePromotions.find(p => 
        p.category === userPreferences.category || p.category === 'All'
      );
      if (categoryMatch) return categoryMatch;
    }

    const randomIndex = Math.floor(Math.random() * availablePromotions.length);
    return availablePromotions[randomIndex];
  }

  updateNotificationHistory(userId, promotion) {
    const history = this.userNotificationHistory.get(userId) || [];
    history.push({
      title: promotion.title,
      timestamp: Date.now()
    });

    if (history.length > 10) {
      history.shift();
    }

    this.userNotificationHistory.set(userId, history);
  }

  async sendPromotionalNotification(userId, fcmToken, userPreferences = {}) {
    try {
      const promotion = this.getSmartPromotion(userId, userPreferences);

      const notificationData = {
        type: 'promotional',
        category: promotion.category,
        promoType: promotion.type,
        image: promotion.image,
        action: 'open_app',
        url: '/'
      };

      const result = await fcmService.sendNotification(
        fcmToken,
        promotion.title,
        promotion.message,
        notificationData
      );

      this.updateNotificationHistory(userId, promotion);

      return {
        success: true,
        promotion,
        messageId: result.messageId
      };
    } catch (error) {
      throw error;
    }
  }

  async sendBulkPromotionalNotifications(users) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        if (user.fcmToken) {
          await this.sendPromotionalNotification(
            user.id,
            user.fcmToken,
            { category: user.preferredCategory }
          );
          results.success++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user.id,
          error: error.message
        });
      }
    }

    return results;
  }

  async sendCategorySpecificPromotion(userId, fcmToken, category) {
    try {
      const categoryPromotions = this.promotionalMessages.filter(p => 
        p.category === category || p.category === 'All'
      );

      if (categoryPromotions.length === 0) {
        return this.sendPromotionalNotification(userId, fcmToken);
      }

      const randomIndex = Math.floor(Math.random() * categoryPromotions.length);
      const promotion = categoryPromotions[randomIndex];

      const notificationData = {
        type: 'promotional',
        category: promotion.category,
        promoType: promotion.type,
        image: promotion.image,
        action: 'open_category',
        url: `/categories?category=${category}`
      };

      const result = await fcmService.sendNotification(
        fcmToken,
        promotion.title,
        promotion.message,
        notificationData
      );

      this.updateNotificationHistory(userId, promotion);

      return {
        success: true,
        promotion,
        messageId: result.messageId
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PromotionalNotificationService();
