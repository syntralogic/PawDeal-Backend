const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/:id', productController.getProductById);
router.get('/seller/:sellerId', productController.getProductsBySeller);

// Protected routes (require authentication)
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);
router.put('/:id/stock', authenticate, productController.updateProductStock);

module.exports = router;