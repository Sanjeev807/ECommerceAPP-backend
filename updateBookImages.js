require('dotenv').config();
const { sequelize } = require('./config/database');
const Product = require('./models/Product');

const updateProductImages = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Update Harry Potter book image
    const harryPotterResult = await Product.update(
      { 
        images: ['https://images-na.ssl-images-amazon.com/images/I/71HSkVXqPcL._SY466_.jpg'] 
      },
      { 
        where: { name: "Harry Potter and the Philosopher's Stone" }
      }
    );

    // Update The Alchemist book image
    const alchemistResult = await Product.update(
      { 
        images: ['https://images-na.ssl-images-amazon.com/images/I/51Z-QHKAQaL._SX319_BO1,204,203,200_.jpg'] 
      },
      { 
        where: { name: 'The Alchemist by Paulo Coelho' }
      }
    );

    // Update Atomic Habits book image
    const atomicHabitsResult = await Product.update(
      { 
        images: ['https://images-na.ssl-images-amazon.com/images/I/51-nXsSRfZL._SX328_BO1,204,203,200_.jpg'] 
      },
      { 
        where: { name: 'Atomic Habits by James Clear' }
      }
    );

    // Update Rich Dad Poor Dad book image
    const richDadResult = await Product.update(
      { 
        images: ['https://images-na.ssl-images-amazon.com/images/I/51Wa7Gax8xL._SX331_BO1,204,203,200_.jpg'] 
      },
      { 
        where: { name: 'Rich Dad Poor Dad by Robert Kiyosaki' }
      }
    );

    console.log('✅ Product images updated successfully!');
    console.log(`📚 Harry Potter: ${harryPotterResult[0]} rows updated`);
    console.log(`📚 The Alchemist: ${alchemistResult[0]} rows updated`);
    console.log(`📚 Atomic Habits: ${atomicHabitsResult[0]} rows updated`);
    console.log(`📚 Rich Dad Poor Dad: ${richDadResult[0]} rows updated`);
    console.log('');
    console.log('🎯 All book images now show proper book covers!');
    console.log('🔄 Refresh your frontend to see the updated images.');

  } catch (error) {
    console.error('❌ Error updating product images:', error);
  } finally {
    await sequelize.close();
  }
};

updateProductImages();