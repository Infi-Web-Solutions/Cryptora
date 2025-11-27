const express = require('express');
const router = express.Router();
const { walletAuth } = require('../middleware/auth');
const {
  buyCoin,
  sellCoin,
  getCurrentPrice,
  getMultiplePrices
} = require('../controllers/tradingController');

// Trading endpoints
router.post('/buy', walletAuth, buyCoin);
router.post('/sell', walletAuth, sellCoin);

// Price endpoints
router.get('/price/:symbol', getCurrentPrice);
router.get('/prices', getMultiplePrices);

module.exports = router;
