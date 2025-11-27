const express = require('express');
const router = express.Router();
const { walletAuth } = require('../middleware/auth');
const { getTransactionHistory } = require('../controllers/transactionController');

// Transaction history
router.get('/', walletAuth, getTransactionHistory);
// router.get('/history', walletAuth, getTransactionHistory);

module.exports = router;
