const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/price-range', productController.getProductPriceRange);
router.post('/find-similar', productController.findSimilarProducts);
router.post('/', productController.createProduct);

module.exports = router;
