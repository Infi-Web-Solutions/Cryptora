const express = require('express');
const router = express.Router();
const { walletAuth, adminRequired } = require('../middleware/auth');
const {
  walletLogin,
  getUserProfile,
  getAllUsers,
  updateUserStatus
} = require('../controllers/userController');

// Authentication
router.post('/wallet-login', walletLogin);

// User profile
router.get('/profile', walletAuth, getUserProfile);

// Admin endpoints
// router.post('/admin-register', walletAuth, adminRequired, adminRegisterUserController);
router.get('/all', walletAuth, adminRequired, getAllUsers);
router.put('/:user_id/status', walletAuth, adminRequired, updateUserStatus);

module.exports = router;
