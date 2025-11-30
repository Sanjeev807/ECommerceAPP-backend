require('dotenv').config();
const { sequelize } = require('../config/database');
const Product = require('../models/Product');

// Updated product images with reliable URLs
const productImageUpdates = [
  // Electronics
  {
    name: 'Smart LED TV 55 inch 4K Ultra HD',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Dell Inspiron 15 Laptop - Core i5 11th Gen',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'iPhone 14 Pro Max 256GB',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Apple Watch Series 9 GPS 45mm',
    images: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'JBL Flip 6 Portable Bluetooth Speaker',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Anker PowerCore 20000mAh Power Bank',
    images: ['https://images.unsplash.com/photo-1609592085451-54edfacb6775?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Canon EOS M50 Mark II Mirrorless Camera',
    images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'TP-Link AC1200 WiFi Router Dual Band',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Sony PlayStation 5 Console',
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80']
  },

  // Fashion
  {
    name: 'Premium Cotton Graphic T-Shirt',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: "Levi's 511 Slim Fit Denim Jeans",
    images: ['https://static.vecteezy.com/system/resources/previews/029/720/312/large_2x/front-and-back-view-blue-jeans-isolated-on-white-background-with-clipping-path-free-photo.jpg']
  },
  {
    name: 'Nike Air Max 270 Running Shoes',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Premium Fleece Hoodie Sweatshirt',
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Stylish Leather Handbag for Women',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Fossil Analog Watch for Men',
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Gold Plated Jewelry Set - Necklace & Earrings',
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Van Heusen Formal Shirt for Men',
    images: ['https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Ray-Ban Aviator Sunglasses',
    images: ['https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Winter Puffer Jacket - Unisex',
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?auto=format&fit=crop&w=800&q=80']
  },

  // Home & Living
  {
    name: 'Premium Cotton Bed Sheet Set - Queen Size',
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Ceramic Decorative Flower Vase',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Fine Bone China Dinnerware Set - 24 Pieces',
    images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Aromatic Scented Candles Gift Set - 6 Pack',
    images: ['https://images.unsplash.com/photo-1602874801006-a9b86183c34d?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Ceramic Coffee Mug Set - 6 Pieces',
    images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Blackout Curtains - Window Drapes 2 Panels',
    images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Soft Shaggy Area Rug 5x7 Feet',
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Velvet Throw Pillow Covers - 4 Pack',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Wooden Photo Frame Set - 8 Pieces',
    images: ['https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Woven Storage Baskets Set - 3 Pieces',
    images: ['https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80']
  },

  // Books - Using high-quality book cover images
  {
    name: 'The Alchemist by Paulo Coelho',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Atomic Habits by James Clear',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Pride and Prejudice by Jane Austen',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Indian Cooking for Beginners - Recipe Book',
    images: ['https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: "The Gruffalo - Children's Picture Book",
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Rich Dad Poor Dad by Robert Kiyosaki',
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: "Harry Potter and the Philosopher's Stone",
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'You Can Win by Shiv Khera',
    images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'The Girl on the Train by Paula Hawkins',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Sapiens: A Brief History of Humankind',
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=800&q=80']
  },

  // Sports & Fitness
  {
    name: 'Premium NBR Yoga Mat 6mm with Bag',
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Optimum Nutrition Whey Protein 2kg',
    images: ['https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Cast Iron Adjustable Dumbbells 20kg Pair',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Stainless Steel Sports Water Bottle 1000ml',
    images: ['https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Nike Revolution 6 Running Shoes',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Fitbit Charge 5 Fitness Tracker',
    images: ['https://images.unsplash.com/photo-1551816230-ef5deaed4a26?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Speed Skipping Rope with Counter',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Red Leather Ball',
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Gym Workout Gloves - Weight Lifting',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80']
  },
  {
    name: 'Resistance Bands Set - 5 Levels',
    images: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80']
  }
];

const updateProductImages = async () => {
  try {
    console.log('🔄 Starting product image updates...');
    
    await sequelize.authenticate();
    console.log('✅ Database connected');

    let updatedCount = 0;
    
    for (const update of productImageUpdates) {
      try {
        const [rowsUpdated] = await Product.update(
          { images: update.images },
          { 
            where: { 
              name: {
                [require('sequelize').Op.iLike]: `%${update.name}%`
              }
            } 
          }
        );
        
        if (rowsUpdated > 0) {
          console.log(`✅ Updated images for: ${update.name}`);
          updatedCount++;
        } else {
          console.log(`⚠️  Product not found: ${update.name}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${update.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Image update completed!`);
    console.log(`📊 Updated ${updatedCount} products out of ${productImageUpdates.length}`);
    
    // Verify a few products
    const sampleProducts = await Product.findAll({
      where: { category: 'Books' },
      attributes: ['name', 'images'],
      limit: 3
    });
    
    console.log('\n📚 Sample updated book products:');
    sampleProducts.forEach(p => {
      console.log(`${p.name}: ${JSON.stringify(p.images)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    process.exit(1);
  }
};

updateProductImages();