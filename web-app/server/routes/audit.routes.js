const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// Get audit logs for specific invoice
router.get('/invoice/:id', auditController.getInvoiceAudit);

// Get all audit logs (Owner only)
router.get('/', authorize('OWNER'), auditController.getAllAudit);

module.exports = router;
