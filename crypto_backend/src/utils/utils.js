const { ethers } = require('ethers');
const User = require('../models/User');
const BuyPrice = require('../models/BuyPrice');
const Transaction = require('../models/Transaction');
const {
  getVirtualBalance,
  getBorrowedAmount,
  getCoinBalance,
  getTransactionHistory,
  getUserHoldings,
  buyCoin,
  sellCoin,
  requestVirtualFundsFor,
  repayVirtualFunds
} = require('./blockchain');
const { getLivePrice } = require('./marketData');

// Update buy price aggregates
const updateBuyPriceAggregates = async (user, symbol, priceUsd, quantity) => {
  try {
    const rec = await BuyPrice.findOneAndUpdate(
      { user: user._id, symbol: symbol.toUpperCase() },
      {},
      { upsert: true, new: true }
    );

    const qty = parseFloat(quantity);
    const price = parseFloat(priceUsd);

    rec.total_quantity = parseFloat(rec.total_quantity || 0) + qty;
    rec.total_cost_usd = parseFloat(rec.total_cost_usd || 0) + (qty * price);

    if (rec.total_quantity > 0) {
      rec.average_price_usd = rec.total_cost_usd / rec.total_quantity;
    }

    rec.price_usd = price;
    await rec.save();

    return rec;
  } catch (error) {
    console.error('Error updating buy price aggregates:', error);
    throw error;
  }
};

// Buy coin with transaction recording
const buyCoinTransaction = async (userWallet, symbol, price, quantity) => {
  try {
    console.log(`[DEBUG] Starting buy transaction for ${userWallet}: ${quantity} ${symbol} at $${price}`);

    // Check balance
    const virtualBalance = await getVirtualBalance(userWallet);
    const totalCost = parseFloat(price) * parseFloat(quantity);

    if (virtualBalance < totalCost * 100) {
      throw new Error(`Insufficient virtual USD balance. You need $${totalCost.toFixed(2)} but have $${(virtualBalance / 100).toFixed(2)}.`);
    }

    // Execute blockchain transaction
    const priceCents = Math.round(parseFloat(price) * 100);
    const txHash = await buyCoin(userWallet, symbol, priceCents, parseInt(quantity));
    console.log(`[DEBUG] Blockchain buy transaction completed with hash: ${txHash}`);

    // Update buy price aggregates
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (user) {
      await updateBuyPriceAggregates(user, symbol, price, quantity);
    }

    // Record transaction
    const usdValue = parseFloat(quantity) * parseFloat(price);
    const transaction = new Transaction({
      user: user._id,
      type: 'buy',
      symbol: symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      usd_value: usdValue,
      buy_price: parseFloat(price),
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();
    console.log(`[DEBUG] Transaction saved to DB with tx_hash: ${txHash}`);

    return { txHash, transaction };
  } catch (error) {
    console.error('Error in buy coin transaction:', error);
    throw error;
  }
};

// Sell coin with transaction recording
const sellCoinTransaction = async (userWallet, symbol, price, quantity) => {
  try {
    // Check balance
    const coinBalance = await getCoinBalance(userWallet, symbol);
    if (coinBalance < parseFloat(quantity)) {
      throw new Error(`Insufficient ${symbol} balance. You have ${coinBalance}, tried to sell ${quantity}.`);
    }

    // Execute blockchain transaction
    const priceCents = Math.round(parseFloat(price) * 100);
    const txHash = await sellCoin(userWallet, symbol, priceCents, parseInt(quantity));

    // Record transaction
    const usdValue = parseFloat(quantity) * parseFloat(price);
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });

    const transaction = new Transaction({
      user: user._id,
      type: 'sell',
      symbol: symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      usd_value: usdValue,
      buy_price: null, // Will be set from DB average
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();

    return { txHash, transaction };
  } catch (error) {
    console.error('Error in sell coin transaction:', error);
    throw error;
  }
};

// Request funds
const requestFundsTransaction = async (user, amount) => {
  try {
    const txHash = await requestVirtualFundsFor(user.wallet_address, parseInt(amount));

    const transaction = new Transaction({
      user: user._id,
      type: 'fund',
      symbol: 'USD',
      quantity: parseInt(amount),
      usd_value: parseFloat(amount),
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();

    return { txHash, transaction };
  } catch (error) {
    console.error('Error requesting funds:', error);
    throw error;
  }
};

// Repay funds
const repayFundsTransaction = async (user, amount) => {
  try {
    const txHash = await repayVirtualFunds(user.wallet_address, parseInt(amount));

    const transaction = new Transaction({
      user: user._id,
      type: 'repay',
      symbol: 'USD',
      quantity: parseInt(amount),
      usd_value: parseFloat(amount),
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();

    return { txHash, transaction };
  } catch (error) {
    console.error('Error repaying funds:', error);
    throw error;
  }
};

// Get user holdings from DB transactions (like Django extracts from DB)
const getUserHoldingsFromDB = async (userWallet) => {
  try {
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (!user) return [];

    const transactions = await Transaction.find({ user: user._id }).sort({ timestamp: 1 });

    const holdings = {};

    for (const tx of transactions) {
      if (tx.type === 'buy') {
        if (!holdings[tx.symbol]) holdings[tx.symbol] = 0;
        holdings[tx.symbol] += parseFloat(tx.quantity);
      } else if (tx.type === 'sell') {
        if (!holdings[tx.symbol]) holdings[tx.symbol] = 0;
        holdings[tx.symbol] -= parseFloat(tx.quantity);
      }
    }

    const holdingsArray = [];
    for (const symbol in holdings) {
      if (holdings[symbol] > 0) {
        holdingsArray.push({
          symbol: symbol,
          amount: holdings[symbol]
        });
      }
    }

    return holdingsArray;
  } catch (error) {
    console.error('Error getting user holdings from DB:', error);
    return [];
  }
};

// Get user holdings with live prices (extract from DB like Django)
const getUserHoldingsWithPrices = async (userWallet) => {
  try {
    const holdings = await getUserHoldingsFromDB(userWallet);
    const holdingsWithPrices = [];

    for (const holding of holdings) {
      const livePrice = await getLivePrice(holding.symbol);
      holdingsWithPrices.push({
        symbol: holding.symbol,
        amount: holding.amount,
        live_price: livePrice,
        total_value: holding.amount * livePrice
      });
    }

    return holdingsWithPrices;
  } catch (error) {
    console.error('Error getting user holdings with prices:', error);
    return [];
  }
};

// Get average buy price from DB
const getAvgBuyPrice = async (userWallet, symbol) => {
  try {
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (!user) return 0;

    const record = await BuyPrice.findOne({ user: user._id, symbol: symbol.toUpperCase() });
    if (!record) return 0;

    return parseFloat(record.average_price_usd || record.price_usd || 0);
  } catch (error) {
    console.error('Error getting average buy price:', error);
    return 0;
  }
};

// Calculate portfolio summary
const getPortfolioSummary = async (userWallet) => {
  try {
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (!user) return { total_balance: 0, total_income: 0, total_expense: 0 };

    // Get virtual balance
    const virtualBalanceCents = await getVirtualBalance(userWallet);
    const virtualBalance = virtualBalanceCents / 100;

    // Get holdings and calculate values like Django
    const holdings = await getUserHoldingsWithPrices(userWallet);
    let totalHoldingsValue = 0;
    let totalCostBasis = 0;

    for (const holding of holdings) {
      if (holding.amount > 0) {
        totalHoldingsValue += holding.total_value;

        // Get average buy price
        const avgBuyPrice = await getAvgBuyPrice(userWallet, holding.symbol);
        if (avgBuyPrice > 0) {
          totalCostBasis += holding.amount * avgBuyPrice;
        }
      }
    }

    // Calculate profit like Django: total_profit = total_holdings_value - total_cost_basis
    const totalProfit = totalHoldingsValue - totalCostBasis;

    return {
      total_balance: virtualBalance,
      total_income: totalProfit,
      total_expense: totalHoldingsValue
    };
  } catch (error) {
    console.error('Error calculating portfolio summary:', error);
    return { total_balance: 0, total_income: 0, total_expense: 0 };
  }
};

// Get transaction history with enriched data
const getEnrichedTransactionHistory = async (userWallet, filters = {}) => {
  try {
    const user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (!user) return [];

    let query = { user: user._id };

    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.start_date) query.timestamp = { $gte: new Date(filters.start_date) };
    if (filters.end_date) query.timestamp = { ...query.timestamp, $lte: new Date(filters.end_date) };

    const transactions = await Transaction.find(query).sort({ timestamp: -1 });

    // Enrich with buy prices for sells
    const enriched = [];
    for (const tx of transactions) {
      let buyPrice = tx.buy_price;

      if (tx.type === 'sell' && !buyPrice && tx.symbol) {
        const record = await BuyPrice.findOne({ user: user._id, symbol: tx.symbol.toUpperCase() });
        if (record) {
          buyPrice = parseFloat(record.average_price_usd || record.price_usd || 0);
        }
      }

      enriched.push({
        type: tx.type,
        symbol: tx.symbol,
        quantity: parseFloat(tx.quantity),
        usd_value: parseFloat(tx.usd_value),
        buy_price: buyPrice,
        timestamp: tx.timestamp,
        tx_hash: tx.tx_hash
      });
    }

    return enriched.filter(tx => tx.usd_value && tx.usd_value !== 0);
  } catch (error) {
    console.error('Error getting enriched transaction history:', error);
    return [];
  }
};

module.exports = {
  updateBuyPriceAggregates,
  buyCoinTransaction,
  sellCoinTransaction,
  requestFundsTransaction,
  repayFundsTransaction,
  getUserHoldingsWithPrices,
  getAvgBuyPrice,
  getPortfolioSummary,
  getEnrichedTransactionHistory
};
