// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/admin/panel
 * @desc    Get admin panel data with pending requests
 * @access  Private (Admin only)
 */
router.get('/panel', isAuthenticated, isAdmin, adminController.getAdminPanel);

/**
 * @route   POST /api/admin/approve/:walletAddress
 * @desc    Approve a borrow request
 * @access  Private (Admin only)
 */
router.post('/approve/:walletAddress', isAuthenticated, isAdmin, adminController.approveBorrowRequest);

/**
 * @route   POST /api/admin/reject/:walletAddress
 * @desc    Reject a borrow request
 * @access  Private (Admin only)
 */
router.post('/reject/:walletAddress', isAuthenticated, isAdmin, adminController.rejectBorrowRequest);

module.exports = router;