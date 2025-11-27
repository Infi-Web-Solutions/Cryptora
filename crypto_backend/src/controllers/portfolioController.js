// src/controllers/portfolioController.js
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const BuyPrice = require('../models/BuyPrice');
const Transaction = require('../models/Transaction');
const Watchlist = require('../models/Watchlist');
const {
  toChecksumAddress,
  getVirtualBalance,
  getBorrowedAmount,
  getCoinBalance,
  getUserHoldings,
  requestVirtualFundsFor,
  requestVirtualFunds,
  repayVirtualFunds: repayVirtualFundsUtil,
  isRegistered,
  cache,
  CONTRACT_ADDRESS
} = require('../utils/web3');

/**
 * Get live price from CoinGecko
 */

const getLivePrice = async (symbol) => {
  try {
    const cacheKey = `live_price_${symbol}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const coinMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'STETH': 'staked-ether',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'SOL': 'solana',
      'ADA': 'cardano',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'ENA': 'enjincoin',
      'MATIC': 'matic-network'
    };

    const coinId = coinMap[symbol.toUpperCase()] || symbol.toLowerCase();
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers: { 'Accept': 'application/json' }, timeout: 5000 }
    );

    const price = response.data[coinId]?.usd || 0;
    cache.set(cacheKey, price, 60);
    return price;
  } catch (error) {
    console.error('Error fetching live price:', error.message);
    return 0;
  }
};

/**
 * Get average buy price from transactions
 */
const getAvgBuyPrice = (transactions, symbol) => {
  let totalQuantity = 0;
  let totalSpent = 0;
  for (const tx of transactions) {
    if (!Array.isArray(tx) || tx.length < 5) continue;
    const [txType, txSymbol, txQuantity, txPrice] = tx;
    if (txType.toLowerCase() === 'buy' && txSymbol.toUpperCase() === symbol.toUpperCase()) {
      totalQuantity += txQuantity;
      totalSpent += txPrice * txQuantity;
    }
  }
  return totalQuantity > 0 ? totalSpent / totalQuantity : 0;
};

/**
 * Get portfolio data
 * @route GET /api/portfolio
 */

const getPortfolio = async (req, res) => {
  try {
    const walletAddress = req.query.wallet || req.user?.wallet_address || req.headers['wallet-address'] || req.body.wallet_address;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const userWallet = toChecksumAddress(walletAddress.toLowerCase());

    // Find or create user
    let user = await User.findOne({ wallet_address: userWallet.toLowerCase() });
    if (!user) {
      user = new User({ wallet_address: userWallet.toLowerCase() });
      await user.save();
    }

    // Get balances
    let usdBalanceCents = 0;
    let usdBalanceVirtual = 0;
    let borrowedCents = 0;
    let borrowed = 0;
    try {
      usdBalanceCents = await getVirtualBalance(userWallet);
      usdBalanceVirtual = usdBalanceCents / 100.0;
    } catch (error) {
      console.error('Error getting virtual balance:', error);
      usdBalanceVirtual = 0;
    }
    try {
      borrowedCents = await getBorrowedAmount(userWallet);
      borrowed = borrowedCents / 100.0;
    } catch (error) {
      console.error('Error getting borrowed amount:', error);
      borrowed = 0;
    }

    // Get watchlist
    let watchlist = [];
    try {
      const watchlistEntries = await Watchlist.find({ user: user._id }).populate('coin');
      watchlist = watchlistEntries.map(entry => entry.coin?.symbol).filter(Boolean);
    } catch (error) {
      console.error('Error getting watchlist:', error);
    }

    // Get transaction data
    let transactionData = [];
    try {
      const transactionRecords = await Transaction.find({ user: user._id }).sort({ timestamp: -1 });
      transactionData = transactionRecords.map(tx => {
        const quantity = parseFloat(tx.quantity.toString());
        const usdValue = parseFloat(tx.usd_value.toString());
        const price = quantity > 0 ? usdValue / quantity : 0;
        return [
          tx.type,
          tx.symbol,
          quantity,
          price,
          tx.timestamp
        ];
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
    }

    // Filter transactions
    const txType = req.query.type;
    const filteredTransactions = [];
    for (const tx of transactionData) {
      if (!Array.isArray(tx) || tx.length < 5) continue;
      if (txType && tx[0] !== txType) continue;
      filteredTransactions.push({
        timestamp: tx[4],
        type: tx[0],
        symbol: tx[1],
        quantity: tx[2],
        amount: tx[2],
        usd_value: tx[2]
      });
    }

    // Get coin info
    let coinMap = cache.get('coingecko_coin_map');
    if (!coinMap) {
      try {
        const marketsUrl = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false";
        const allCoinsUrl = "https://api.coingecko.com/api/v3/coins/list";
        const [marketsResponse, allCoinsResponse] = await Promise.all([
          axios.get(marketsUrl, { headers: { 'Accept': 'application/json' }, timeout: 10000 }),
          axios.get(allCoinsUrl, { headers: { 'Accept': 'application/json' }, timeout: 10000 })
        ]);

        coinMap = {};
        if (marketsResponse.data) {
          marketsResponse.data.forEach(coin => {
            const symbol = coin.symbol?.toUpperCase();
            if (symbol) {
              coinMap[symbol] = {
                id: coin.id,
                name: coin.name,
                image: coin.image,
                market_cap_rank: coin.market_cap_rank
              };
            }
          });
        }

        if (allCoinsResponse.data) {
          allCoinsResponse.data.forEach(coin => {
            const symbol = coin.symbol?.toUpperCase();
            if (symbol && !coinMap[symbol]) {
              coinMap[symbol] = {
                id: coin.id,
                name: coin.name,
                image: null
              };
            }
          });
        }

        cache.set('coingecko_coin_map', coinMap, 600);
      } catch (error) {
        console.error('Error fetching coin info:', error);
        coinMap = {
          'BTC': { id: 'bitcoin', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
          'ETH': { id: 'ethereum', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
          'STETH': { id: 'staked-ether', name: 'Staked ETH', image: 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png' },
          'BNB': { id: 'binancecoin', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
          'USDT': { id: 'tether', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png' },
          'SOL': { id: 'solana', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
          'ADA': { id: 'cardano', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
          'XRP': { id: 'ripple', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
          'DOGE': { id: 'dogecoin', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png' },
          'DOT': { id: 'polkadot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png' },
          'ENA': { id: 'enjincoin', name: 'Enjin Coin', image: 'https://assets.coingecko.com/coins/images/110/large/enjincoin.png' },
          'MATIC': { id: 'matic-network', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png' }
        };
      }
    }

    // Build holdings
    const holdings = [];
    const userCoins = new Set();

    // Add symbols from transactions
    transactionData.forEach(tx => {
      if (tx[1]) userCoins.add(tx[1].toUpperCase());
    });

    // Add symbols from contract holdings
    try {
      const holdingsData = await getUserHoldings(userWallet);
      let symbols = [];
      if (Array.isArray(holdingsData) && holdingsData.length > 0) {
        symbols = holdingsData[0] || [];
      }
      symbols.forEach(s => userCoins.add(s.toUpperCase()));
    } catch (error) {
      console.error('Error getting user holdings:', error);
    }

    // Add default coins
    const defaultCoins = ["BTC", "ETH", "USDT", "BNB", "SOL", "ADA", "XRP", "DOGE", "DOT", "MATIC", "STETH"];
    defaultCoins.forEach(coin => userCoins.add(coin));

    for (const symbol of userCoins) {
      try {
        const coinInfo = coinMap[symbol] || { id: symbol.toLowerCase(), name: symbol };
        const balance = await getCoinBalance(userWallet, symbol);
        const balanceFloat = parseFloat(balance) || 0.0;

        // Average buy price from transactions
        const avgPrice = getAvgBuyPrice(transactionData, symbol);

        const livePrice = await getLivePrice(symbol);
        const livePriceFloat = parseFloat(livePrice) || 0.0;

        // For USDC, set live price to 1.0 if it's 0
        const finalLivePrice = (symbol === 'USDC' && livePriceFloat === 0.0) ? 1.0 : livePriceFloat;

        let imageUrl = coinInfo.image;
        if (!imageUrl && coinInfo.id) {
          try {
            const url = `https://api.coingecko.com/api/v3/coins/${coinInfo.id}`;
            const response = await axios.get(url, { headers: { 'Accept': 'application/json' }, timeout: 5000 });
            if (response.status === 200) {
              const data = response.data;
              imageUrl = data?.image?.large;
            }
          } catch (error) {
            // Ignore
          }
        }
        if (!imageUrl) {
          imageUrl = 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png';
        }

        const name = coinInfo.name;
        if (balanceFloat > 0) {
          holdings.push({
            image: imageUrl,
            symbol: symbol,
            name: name,
            balance: balanceFloat,
            quantity: balanceFloat,
            buyPrice: avgPrice,
            avgPrice: avgPrice,
            livePrice: finalLivePrice,
            totalValue: balanceFloat * finalLivePrice
          });
        }
      } catch (error) {
        console.error(`Error processing coin ${symbol}:`, error);
      }
    }

    const filteredHoldings = holdings.filter(coin => coin.quantity > 0);

    res.json({
      wallet: userWallet,
      usdBalanceVirtual: usdBalanceVirtual,
      usdBalanceRaw: usdBalanceCents,
      watchlist: watchlist,
      transactions: filteredTransactions,
      holdings: holdings,
      filteredHoldings: filteredHoldings,
      borrowed: borrowed,
      contractAddress: CONTRACT_ADDRESS
    });
  } catch (error) {
    console.error('Portfolio error:', error);
    res.status(500).json({ error: 'Failed to load portfolio' });
  }
};

/**
 * Request to borrow virtual funds (creates pending request for admin approval)
 * @route POST /api/portfolio/borrow
 */
WALLET_ADDRESS = "0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750"
const borrowVirtualFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const walletAddress = req.session?.walletAddress;
    console.log('borrowVirtualFunds walletAddress', walletAddress);
    if (!walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const amountCents = Math.floor(parseFloat(amount) * 100);
    const userWallet = toChecksumAddress(walletAddress);

    // Check if user is registered in smart contract
    const registered = await isRegistered(userWallet);
    if (!registered) {
      return res.status(400).json({
        error: 'You are not registered in the smart contract. Please register first before making borrow requests.'
      });
    }

    // Admin submits request FOR user (matches Django logic)
    console.log(`[BORROW] Requesting ${amountCents} cents for ${userWallet}`);
    const txHash = await requestVirtualFundsFor(userWallet, amountCents);

    // Record the borrow transaction
    const Transaction = require('../models/Transaction');
    const amountDollars = amountCents / 100;
    await Transaction.create({
      user: user._id,
      type: 'fund',
      symbol: null,
      quantity: new mongoose.Types.Decimal128(amountDollars.toString()),
      usd_value: new mongoose.Types.Decimal128(amountDollars.toString()),
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });

    res.json({
      success: true,
      message: `Borrow request submitted for $${(amountCents / 100).toFixed(2)}. TX: ${txHash.substring(0, 10)}...`,
      txHash: txHash
    });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ error: error.message || 'Failed to request funds' });
  }
};

/**
 * Repay borrowed virtual funds
 * @route POST /api/portfolio/repay
 */
const repayVirtualFunds = async (req, res) => {
  try {
    const { amount, privateKey } = req.body;
    const walletAddress = req.session?.walletAddress;

    if (!walletAddress) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!privateKey) {
      return res.status(400).json({ error: 'Private key is required for repayment' });
    }

    // Validate private key format
    if (!privateKey.match(/^(0x)?[0-9a-fA-F]{64}$/)) {
      return res.status(400).json({ error: 'Invalid private key format' });
    }

    const amountCents = Math.floor(parseFloat(amount) * 100);
    const userWallet = toChecksumAddress(walletAddress);

    // User signs and submits their own repayment transaction
    console.log(`[REPAY] Repaying ${amountCents} cents for ${userWallet}`);
    const txHash = await repayVirtualFundsUtil(userWallet, amountCents, privateKey);

    // Record the repay transaction
    const Transaction = require('../models/Transaction');
    const amountDollars = amountCents / 100;
    await Transaction.create({
      user: user._id,
      type: 'repay',
      symbol: null,
      quantity: new mongoose.Types.Decimal128(amountDollars.toString()),
      usd_value: new mongoose.Types.Decimal128(amountDollars.toString()),
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });

    res.json({
      success: true,
      message: `Repaid $${(amountCents / 100).toFixed(2)}. TX: ${txHash.substring(0, 10)}...`,
      txHash: txHash
    });
  } catch (error) {
    console.error('Repay error:', error);
    res.status(500).json({ error: error.message || 'Failed to repay funds' });
  }
};

module.exports = {
  getPortfolio,
  borrowVirtualFunds,
  repayVirtualFunds
};