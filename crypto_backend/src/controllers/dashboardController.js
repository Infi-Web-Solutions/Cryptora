const axios = require('axios');
const mongoose = require('mongoose');
const { getCoingeckoMarketData, getHistoricalMarketData, getLivePrice, getTopCoins } = require('../utils/marketData');
const { getGlobalHistoricalMarketData } = require('../utils/globalHistoricalData');
const { getUserHoldingsWithPrices, getPortfolioSummary } = require('../utils/utils');
const { getVirtualBalance, getBorrowedAmount } = require('../utils/web3');
const User = require('../models/User');
const Coin = require('../models/Coin');
const Watchlist = require('../models/Watchlist');

// Dashboard view
const getDashboard = async (req, res) => {
  try {
    const walletAddress = req.query.wallet || req.headers['wallet-address'];

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const userWallet = walletAddress.toLowerCase();

    // Find or create user
    let user = await User.findOne({ wallet_address: userWallet });
    if (!user) {
      user = new User({ wallet_address: userWallet });
      await user.save();
    }

    // Get market data
    const marketData = await getCoingeckoMarketData();
    const topCoins = await getTopCoins(10);

    // Get user data
    const virtualBalance = await getVirtualBalance(userWallet);
    const borrowedAmount = await getBorrowedAmount(userWallet);
    const watchlistEntries = await Watchlist.find({ user: user._id }).populate('coin');
    const watchlist = watchlistEntries.map(entry => entry.coin.symbol);
    const holdings = await getUserHoldingsWithPrices(userWallet);
    const portfolioSummary = await getPortfolioSummary(userWallet);

    res.json({
      market_data: marketData,
      top_coins: topCoins,
      user_data: {
        wallet_address: userWallet,
        virtual_balance: virtualBalance / 100, // Convert cents to dollars
        borrowed_amount: borrowedAmount / 100,
        watchlist: watchlist,
        holdings: holdings,
        portfolio_summary: portfolioSummary
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// Portfolio view
const getPortfolio = async (req, res) => {
  try {
    const walletAddress = req.query.wallet || (req.user ? req.user.wallet_address : null);

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const user = await User.findOne({ wallet_address: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get balances
    const virtualBalanceCents = await getVirtualBalance(walletAddress);
    const borrowedCents = await getBorrowedAmount(walletAddress);

    // Get holdings
    const holdings = await getUserHoldingsWithPrices(walletAddress);

    // Get watchlist
    const watchlistEntries = await Watchlist.find({ user: user._id }).populate('coin');
    const watchlist = watchlistEntries.map(entry => entry.coin.symbol);

    // Get coin info for holdings
    const coinMap = {};
    const topCoins = await getTopCoins(50);
    topCoins.forEach(coin => {
      coinMap[coin.symbol.toUpperCase()] = {
        id: coin.id,
        name: coin.name,
        image: coin.image,
        market_cap_rank: coin.market_cap_rank
      };
    });

    // Build holdings with coin info
    const holdingsWithInfo = [];
    for (const holding of holdings) {
      const coinInfo = coinMap[holding.symbol] || { id: holding.symbol.toLowerCase(), name: holding.symbol };
      holdingsWithInfo.push({
        symbol: holding.symbol,
        name: coinInfo.name,
        image: coinInfo.image,
        balance: holding.amount,
        quantity: holding.amount,
        live_price: holding.live_price,
        total_value: holding.total_value
      });
    }

    const filteredHoldings = holdingsWithInfo.filter(h => h.quantity > 0);

    res.json({
      wallet: walletAddress,
      usd_balance_virtual: virtualBalanceCents / 100,
      usd_balance_raw: virtualBalanceCents,
      watchlist: watchlist,
      holdings: holdingsWithInfo,
      filtered_holdings: filteredHoldings,
      borrowed: borrowedCents / 100
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
};

// Market data endpoints

const getMarketData = async (req, res) => {
  try {
    const marketData = await getCoingeckoMarketData();
    res.json(marketData);
  } catch (error) {
    console.error('Market data error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
};

const getGlobalHistoricalData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await getGlobalHistoricalMarketData(days);
    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch global historical data' });
    }
    res.json(data);
  } catch (error) {
    console.error('Global historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch global historical data' });
  }
};

const getHistoricalData = async (req, res) => {
  try {
    const { symbol, days = 7 } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const data = await getHistoricalMarketData(symbol, parseInt(days));
    res.json(data);
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};

const getLivePrices = async (req, res) => {
  try {
    const { symbols } = req.query;
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols required' });
    }

    const symbolList = symbols.split(',');
    const prices = {};

    for (const symbol of symbolList) {
      prices[symbol] = await getLivePrice(symbol);
    }

    res.json(prices);
  } catch (error) {
    console.error('Live prices error:', error);
    res.status(500).json({ error: 'Failed to fetch live prices' });
  }
};

// Watchlist management
const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = req.user;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    // Check if coin exists
    let coin = await Coin.findOne({ symbol: symbol.toUpperCase() });
    if (!coin) {
      // Try to create coin from API
      const coinData = await getTopCoins(1, symbol);
      if (coinData.length > 0) {
        coin = new Coin({
          name: coinData[0].name,
          symbol: coinData[0].symbol.toUpperCase(),
          coingecko_id: coinData[0].id,
          current_price: coinData[0].current_price,
          image: coinData[0].image
        });
        await coin.save();
      }
    }

    // Add to watchlist
    const watchlistEntry = new Watchlist({
      user: user._id,
      coin: coin._id
    });

    await watchlistEntry.save();
    res.json({ message: 'Added to watchlist', watchlist: watchlistEntry });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    const user = req.user;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const coin = await Coin.findOne({ symbol: symbol.toUpperCase() });
    if (!coin) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    await Watchlist.findOneAndDelete({ user: user._id, coin: coin._id });
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
};

const getUserWatchlist = async (req, res) => {
  try {
    const user = req.user;

    const watchlist = await Watchlist.find({ user: user._id }).populate('coin');
    const symbols = watchlist.map(w => w.coin.symbol);

    res.json(symbols);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
};

const getTopCoinsController = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const topCoins = await getTopCoins(limit, page);
    res.json(topCoins);
  } catch (error) {
    console.error('Top coins error:', error);
    res.status(500).json({ error: 'Failed to fetch top coins' });
  }
};

// Get coin details
const getCoinDetails = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol required' });
    }

    const symbolUpper = symbol.toUpperCase();
    const binanceSymbol = `${symbolUpper}USDT`;

    // CoinGecko ID mapping for common symbols
    const coinMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'STETH': 'staked-ether',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'SOL': 'solana',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'ENA': 'enjincoin',
      'MATIC': 'matic-network'
    };

    let coinId = coinMap[symbolUpper];

    if (!coinId) {
      // Fallback to search if not in map
      const searchUrl = `https://api.coingecko.com/api/v3/search?query=${symbolUpper}`;
      const searchResponse = await axios.get(searchUrl, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
      if (searchResponse.status !== 200) {
        return res.status(404).json({ error: 'Coin not found' });
      }
      const searchData = searchResponse.data;
      if (searchData.coins) {
        for (const coin of searchData.coins) {
          if (coin.symbol.toUpperCase() === symbolUpper) {
            coinId = coin.id;
            break;
          }
        }
      }
    }

    if (!coinId) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    let coinInfo = null;
    try {
      const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false`;
      const coingeckoResponse = await axios.get(coingeckoUrl, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
      if (coingeckoResponse.status === 200) {
        const coinData = coingeckoResponse.data;
        if (coinData && coinData.length > 0) {
          coinInfo = coinData[0];
        }
      }
    } catch (error) {
      console.error('Error fetching CoinGecko data:', error);
    }

    // Fallback coin info
    if (!coinInfo) {
      const fallbackCoins = {
        'BTC': { name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'ETH': { name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'STETH': { name: 'Staked ETH', image: 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'BNB': { name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'USDT': { name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 1, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 1, 'low_24h': 1, circulating_supply: 0, total_volume: 0 },
        'SOL': { name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'ADA': { name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'XRP': { name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'DOGE': { name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'DOT': { name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'ENA': { name: 'Enjin Coin', image: 'https://assets.coingecko.com/coins/images/110/large/enjincoin.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 },
        'MATIC': { name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png', current_price: 0, market_cap: 0, 'price_change_percentage_24h': 0, 'high_24h': 0, 'low_24h': 0, circulating_supply: 0, total_volume: 0 }
      };
      coinInfo = fallbackCoins[symbolUpper] || { name: symbolUpper, image: '', current_price: 0, market_cap: 0, price_change_percentage_24h: 0, high_24h: 0, low_24h: 0, circulating_supply: 0, total_volume: 0 };
    }

    // Fetch from Binance for ticker
    const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
    let tickerData = {};
    try {
      const tickerResponse = await axios.get(tickerUrl, { headers: { 'Accept': 'application/json' }, timeout: 10000 });
      if (tickerResponse.status === 200) {
        tickerData = tickerResponse.data;
      }
    } catch (error) {
      // Ignore Binance error, use CoinGecko data
    }

    // Format market cap
    const marketCap = coinInfo.market_cap || 0;
    let marketCapDisplay = 'N/A';
    if (marketCap >= 1000000000) {
      marketCapDisplay = `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      marketCapDisplay = `$${(marketCap / 1000000).toFixed(1)}M`;
    } else if (marketCap > 0) {
      marketCapDisplay = `$${marketCap.toLocaleString()}`;
    }

    const context = {
      name: coinInfo.name || symbolUpper,
      symbol: symbolUpper,
      image: coinInfo.image || '',
      current_price: parseFloat(tickerData.lastPrice || coinInfo.current_price || 0),
      price_change_24h: parseFloat(tickerData.priceChangePercent || coinInfo.price_change_percentage_24h || 0),
      market_cap: marketCap,
      market_cap_display: marketCapDisplay,
      high_24h: parseFloat(tickerData.highPrice || coinInfo.high_24h || 0),
      low_24h: parseFloat(tickerData.lowPrice || coinInfo.low_24h || 0),
      circulating_supply: coinInfo.circulating_supply || 0,
      total_supply: coinInfo.total_supply || 0,
      volume_24h: parseFloat(tickerData.volume || coinInfo.total_volume || 0),
    };

    res.json(context);
  } catch (error) {
    console.error('Coin details error:', error);
    res.status(500).json({ error: 'Failed to fetch coin details' });
  }
};

// Record buy price after transaction confirmation
const recordBuyPrice = async (req, res) => {
  try {
    const walletAddress = req.body.wallet_address || req.headers['wallet-address'];

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const userWallet = walletAddress.toLowerCase();

    // Find or create user
    let user = await User.findOne({ wallet_address: userWallet });
    if (!user) {
      user = new User({ wallet_address: userWallet });
      await user.save();
    }

    const { symbol, price, quantity, type = 'buy', tx_hash, txHash } = req.body;

    if (!symbol || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields: symbol, price, quantity' });
    }

    const symbolUpper = symbol.toUpperCase();
    const priceUsd = parseFloat(price);
    const qty = parseFloat(quantity);
    const txType = type.toLowerCase();

    // user is already found

    // Only update BuyPrice aggregates for buys
    if (txType === 'buy') {
      const BuyPrice = require('../models/BuyPrice');
      let rec = await BuyPrice.findOne({ user: user._id, symbol: symbolUpper });
      if (!rec) {
        rec = new BuyPrice({
          user: user._id,
          symbol: symbolUpper,
          price_usd: priceUsd,
          total_quantity: 0,
          total_cost_usd: 0,
          average_price_usd: 0,
        });
      }

      rec.total_quantity = parseFloat(rec.total_quantity || 0) + qty;
      rec.total_cost_usd = parseFloat(rec.total_cost_usd || 0) + (qty * priceUsd);
      if (rec.total_quantity > 0) {
        rec.average_price_usd = rec.total_cost_usd / rec.total_quantity;
      }
      rec.price_usd = priceUsd;
      await rec.save();
    }

    // Record the transaction in Transaction model
    const Transaction = require('../models/Transaction');
    const ts = new Date();

    // Use tx_hash or txHash
    const transactionHash = tx_hash || txHash;

    // Calculate usd_value based on type
    let usdValue;
    if (txType === 'sell') {
      usdValue = qty; // Will be corrected later with buy_price
    } else {
      usdValue = qty * priceUsd;
    }

    // If we received a tx_hash, try to find a recent matching DB row and attach the hash
    let updated = false;
    if (transactionHash) {
      const windowStart = new Date(ts.getTime() - 10 * 60 * 1000); // 10 minutes ago
      const candidates = await Transaction.find({
        user: user._id,
        type: txType,
        symbol: symbolUpper,
        tx_hash: null,
        timestamp: { $gte: windowStart }
      }).sort({ timestamp: -1 });

      for (const cand of candidates) {
        // Compare quantities; usd_value may not match for sells
        const candQty = parseFloat(cand.quantity || 0);

        if (Math.abs(candQty - qty) < 0.001) {
          cand.tx_hash = transactionHash;
          if (txType === 'sell' && cand.usd_value && parseFloat(cand.usd_value.toString()) === qty) {
            // Update usd_value if it was set to qty
            cand.usd_value = new mongoose.Types.Decimal128(usdValue.toString());
          }
          await cand.save();
          updated = true;
          break;
        }
      }
    }

    if (!updated) {
      await Transaction.create({
        user: user._id,
        type: txType,
        symbol: symbolUpper,
        quantity: new mongoose.Types.Decimal128(qty.toString()),
        usd_value: new mongoose.Types.Decimal128(usdValue.toString()),
        buy_price: txType === 'buy' ? new mongoose.Types.Decimal128(priceUsd.toString()) : null,
        timestamp: ts,
        tx_hash: transactionHash || null,
      });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Record buy price error:', error);
    res.status(500).json({ error: error.message || 'Failed to record buy price' });
  }
};

module.exports = {
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
};
