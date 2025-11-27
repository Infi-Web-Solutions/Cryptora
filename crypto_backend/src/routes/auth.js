// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { walletLogin } = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @route   POST /api/auth/connect-wallet
 * @desc    Connect wallet (login)
 * @access  Public
 */
router.post('/connect-wallet', authController.connectWallet);

/**
 * @route   POST /api/auth/wallet-login
 * @desc    Wallet login
 * @access  Public
 */
router.post('/wallet-login', walletLogin);

/**
 * @route   POST /api/auth/register-wallet
 * @desc    Register wallet on blockchain
 * @access  Public
 */
router.post('/register-wallet', authController.registerWallet);

/**
 * @route   POST /api/auth/admin-login
 * @desc    Admin login with password
 * @access  Public
 */
router.post('/admin-login', authController.adminLogin);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', isAuthenticated, authController.getCurrentUser);

/**
 * @route   GET /api/auth/session
 * @desc    Check session status
 * @access  Public
 */
router.get('/session', authController.checkSession);

module.exports = router;