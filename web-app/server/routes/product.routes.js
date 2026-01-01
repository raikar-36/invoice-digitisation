const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

module.exports = router;
