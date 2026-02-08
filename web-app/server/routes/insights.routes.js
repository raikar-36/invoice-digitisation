const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insights.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authorize('OWNER', 'ACCOUNTANT'));

// Main analytics endpoint with momentum & sparklines
router.get('/analytics', insightsController.getAnalytics);

// Cache management endpoints (OWNER only)
router.post('/cache/clear', authorize(['OWNER']), insightsController.clearCache);
router.get('/cache/stats', authorize(['OWNER']), insightsController.getCacheStats);

module.exports = router;
