// src/routes/portfolio.js
const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * @route GET /api/portfolio
 * @desc Get portfolio data with holdings
 * @access Public (but requires wallet in query or session)
 */
router.get('/', portfolioController.getPortfolio);

/**
 * @route POST /api/portfolio/borrow
 * @desc Request to borrow virtual funds
 * @access Private
 */
router.post('/borrow', requireAuth, portfolioController.borrowVirtualFunds);

/**
 * @route POST /api/portfolio/repay
 * @desc Repay borrowed virtual funds
 * @access Private
 */
router.post('/repay', requireAuth, portfolioController.repayVirtualFunds);

module.exports = router;