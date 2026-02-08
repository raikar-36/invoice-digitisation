const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Comprehensive analytics endpoint
router.get('/analytics', reportController.getAnalytics);

// Dashboard metrics
router.get('/dashboard', reportController.getDashboardMetrics);

// Revenue flow timeline
router.get('/revenue-flow', reportController.getRevenueFlow);

// Top customers
router.get('/top-customers', reportController.getTopCustomers);

// Product performance
router.get('/product-performance', reportController.getProductPerformance);

// Weekly pattern
router.get('/weekly-pattern', reportController.getWeeklyPattern);

// Status distribution
router.get('/status-distribution', reportController.getStatusDistribution);

// Cache management endpoints (OWNER only)
router.post('/cache/clear', authorize(['OWNER']), reportController.clearCache);
router.get('/cache/stats', authorize(['OWNER']), reportController.getCacheStats);

module.exports = router;
