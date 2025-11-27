const express = require('express');
const router = express.Router();
const { walletAuth, adminRequired } = require('../middleware/auth');
const {
  requestFunds,
  repayFunds,
  getPendingRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/borrowController');

// User borrow/repay
router.post('/request', walletAuth, requestFunds);
router.post('/repay', walletAuth, repayFunds);

// Admin endpoints
router.get('/pending', walletAuth, adminRequired, getPendingRequests);
router.post('/approve/:user_wallet', walletAuth, adminRequired, approveRequest);
router.post('/reject/:user_wallet', walletAuth, adminRequired, rejectRequest);

module.exports = router;
