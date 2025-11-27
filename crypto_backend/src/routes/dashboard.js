const express = require('express');
const router = express.Router();
const { walletAuth, optionalWalletAuth } = require('../middleware/auth');
const {
  getDashboard,
  getPortfolio,
  getMarketData,
  getGlobalHistoricalData,
  getHistoricalData,
  getLivePrices,
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  getTopCoinsController,
  getCoinDetails,
  recordBuyPrice
} = require('../controllers/dashboardController');

// ✅ Test route to verify route is working
router.get('/ping', (req, res) => {
  res.json({ message: 'Dashboard route OK' });
});

// Dashboard
router.get('/', walletAuth, getDashboard);

// Portfolio
router.get('/portfolio', optionalWalletAuth, getPortfolio);

// Market data
router.get('/market', getMarketData);
router.get('/global-historical', getGlobalHistoricalData);
router.get('/top-coins', getTopCoinsController);
router.get('/historical', getHistoricalData);
router.get('/prices', getLivePrices);
router.get('/coin/:symbol', getCoinDetails);

// Watchlist
router.post('/watchlist', walletAuth, addToWatchlist);
router.delete('/watchlist', walletAuth, removeFromWatchlist);
router.get('/watchlist', walletAuth, getUserWatchlist);

// Record buy price after transaction confirmation
router.post('/record-buy', recordBuyPrice);

module.exports = router;
