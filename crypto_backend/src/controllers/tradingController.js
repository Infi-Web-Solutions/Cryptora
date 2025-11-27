const { buyCoinTransaction, sellCoinTransaction } = require('../utils/utils');
const { getLivePrice } = require('../utils/marketData');

// Buy coin
const buyCoin = async (req, res) => {
  try {
    const { symbol, price, quantity } = req.body;
    const user = req.user;

    if (!symbol || !price || !quantity) {
      return res.status(400).json({ error: 'Symbol, price, and quantity required' });
    }

    const result = await buyCoinTransaction(user.wallet_address, symbol, price, quantity);

    res.json({
      message: `Successfully bought ${quantity} ${symbol.toUpperCase()} at $${price}`,
      tx_hash: result.txHash,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Buy coin error:', error);
    res.status(500).json({ error: error.message || 'Failed to buy coin' });
  }
};

// Sell coin
const sellCoin = async (req, res) => {
  try {
    const { symbol, price, quantity } = req.body;
    const user = req.user;

    if (!symbol || !price || !quantity) {
      return res.status(400).json({ error: 'Symbol, price, and quantity required' });
    }

    const result = await sellCoinTransaction(user.wallet_address, symbol, price, quantity);

    res.json({
      message: `Successfully sold ${quantity} ${symbol.toUpperCase()} at $${price}`,
      tx_hash: result.txHash,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Sell coin error:', error);
    res.status(500).json({ error: error.message || 'Failed to sell coin' });
  }
};

// Get current price for a symbol
const getCurrentPrice = async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const price = await getLivePrice(symbol.toUpperCase());

    if (price === 0) {
      return res.status(404).json({ error: 'Price not found for symbol' });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      price: price,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get current price error:', error);
    res.status(500).json({ error: 'Failed to get current price' });
  }
};

// Get prices for multiple symbols
const getMultiplePrices = async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({ error: 'Symbols required' });
    }

    const symbolList = symbols.split(',');
    const prices = {};

    for (const symbol of symbolList) {
      prices[symbol.toUpperCase()] = await getLivePrice(symbol.toUpperCase());
    }

    res.json({
      prices: prices,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get multiple prices error:', error);
    res.status(500).json({ error: 'Failed to get prices' });
  }
};

module.exports = {
  buyCoin,
  sellCoin,
  getCurrentPrice,
  getMultiplePrices
};
