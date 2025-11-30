const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  announceNewProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', getProducts); // Reuse getProducts with search query
router.get('/count', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const count = await Product.count();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/reseed', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const path = require('path');
    const seedPath = path.join(__dirname, '../utils/newSeed.js');
    
    exec(`node "${seedPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Manual reseed failed:', error);
        return res.status(500).json({ message: 'Reseed failed', error: error.message });
      } else {
        console.log('✅ Manual reseed completed:', stdout);
        return res.json({ message: 'Database reseeded successfully with 50 products', output: stdout });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', getProductById);
router.post('/', protect, admin, createProduct);
router.post('/:id/announce', protect, admin, announceNewProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;
