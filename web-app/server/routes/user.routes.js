const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Owner-only routes
router.post('/', authorize('OWNER'), userController.createUser);
router.get('/', authorize('OWNER'), userController.getAllUsers);
router.patch('/:id/deactivate', authorize('OWNER'), userController.deactivateUser);
router.patch('/:id/role', authorize('OWNER'), userController.changeUserRole);

module.exports = router;
