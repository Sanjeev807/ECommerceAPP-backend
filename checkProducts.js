require('dotenv').config();
const { sequelize } = require('./config/database');
const Product = require('./models/Product');

const checkProducts = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Check if products exist
    const productCount = await Product.count();
    console.log(`📦 Total products in database: ${productCount}`);

    if (productCount === 0) {
      console.log('⚠️ No products found! Running seed script...');
      
      // Import and run seed script
      const seedScript = require('./utils/seed');
      if (typeof seedScript === 'function') {
        await seedScript();
      } else {
        console.log('💡 Please run: node utils/seed.js');
      }
    } else {
      // Show first 5 products
      const products = await Product.findAll({
        limit: 5,
        attributes: ['id', 'name', 'price', 'category', 'stock']
      });
      
      console.log('📋 Sample products:');
      products.forEach(product => {
        console.log(`  - ${product.name} (${product.category}) - $${product.price} - Stock: ${product.stock}`);
      });
    }

    console.log('');
    console.log('🎯 Products API should be available at:');
    console.log('   GET http://localhost:5000/api/products');
    console.log('   GET http://localhost:5000/api/products/featured');

  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await sequelize.close();
  }
};

checkProducts();