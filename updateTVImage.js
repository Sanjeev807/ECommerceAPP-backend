require('dotenv').config();
const { sequelize } = require('./config/database');
const Product = require('./models/Product');

async function updateTVImage() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Find the TV product
    const tvProduct = await Product.findOne({
      where: {
        name: 'Smart LED TV 55 inch 4K Ultra HD'
      }
    });
    
    if (!tvProduct) {
      console.log('❌ TV product not found');
      return;
    }
    
    console.log('📺 Found TV product:', tvProduct.name);
    console.log('🖼️ Current image:', tvProduct.images);
    
    // Update the image
    const newImage = 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=500&q=80';
    
    await tvProduct.update({
      images: [newImage]
    });
    
    console.log('✅ TV image updated successfully!');
    console.log('🆕 New image:', newImage);
    
  } catch (error) {
    console.error('❌ Error updating TV image:', error);
  } finally {
    await sequelize.close();
    console.log('🔒 Database connection closed');
  }
}

updateTVImage();