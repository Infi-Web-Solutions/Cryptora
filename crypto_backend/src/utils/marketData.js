const axios = require('axios');

// Simple in-memory cache
const cache = new Map();

const getCachedOrFetch = async (key, fetchFn, ttl = 30000) => { // 30 seconds TTL
  const now = Date.now();
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (now - timestamp < ttl) {
      return data;
    }
  }

  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
};

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const getCoingeckoMarketData = async () => {
  try {
    return await getCachedOrFetch('global', async () => {
      return await retryWithBackoff(async () => {
        const response = await axios.get('https://api.coingecko.com/api/v3/global', { timeout: 10000 });
        if (response.status === 200) {
          const data = response.data.data;
          return {
            total_market_cap: data.total_market_cap?.usd || 0,
            total_volume: data.total_volume?.usd || 0,
            market_cap_change_percentage_24h: data.market_cap_change_percentage_24h || 0,
            market_cap_percentage: data.market_cap_percentage || { btc: 0, eth: 0 },
            active_cryptocurrencies: data.active_cryptocurrencies || 0,
            markets: data.markets || 0,
            last_updated: data.updated_at || ''
          };
        }
        throw new Error('Invalid response status');
      });
    });
  } catch (error) {
    console.error('Error fetching global market data:', error);
    // Fallback
    return {
      total_market_cap: 0,
      total_volume: 0,
      market_cap_change_percentage_24h: 0,
      market_cap_percentage: { btc: 0, eth: 0 },
      active_cryptocurrencies: 0,
      markets: 0,
      last_updated: ''
    };
  }
};

const getHistoricalMarketData = async (symbol, days = 7) => {
  try {
    // Convert days to milliseconds
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);

    // Determine interval based on time range
    let interval = '1d';
    if (days <= 1) interval = '1m';
    else if (days <= 7) interval = '15m';
    else if (days <= 30) interval = '1h';
    else if (days <= 90) interval = '4h';

    // Format symbol for Binance
    const binanceSymbol = `${symbol.toUpperCase()}USDT`;

    // Fetch kline data from Binance
    const url = 'https://api.binance.com/api/v3/klines';
    const params = {
      symbol: binanceSymbol,
      interval: interval,
      startTime: startTime,
      endTime: endTime,
      limit: 1000
    };

    const response = await axios.get(url, { params });

    if (response.status === 200) {
      const klines = response.data;

      // Format data for chart
      const prices = klines.map(k => [parseInt(k[0]), parseFloat(k[4])]); // [timestamp, closing_price]
      const volumes = klines.map(k => [parseInt(k[0]), parseFloat(k[5])]); // [timestamp, volume]
      const market_caps = []; // Binance doesn't provide market cap

      return {
        prices,
        volumes,
        market_caps
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching historical market data:', error.message);
    return null;
  }
};

const getLivePrice = async (symbol) => {
  symbol = symbol.toUpperCase();

  // Binance mapping
  const binanceMap = {
    'BNB': 'BNBUSDT',
    'USDT': 'USDTUSDT',
    'XRP': 'XRPUSDT',
    'SOL': 'SOLUSDT',
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'STETH': 'STETHUSDT',
    'ADA': 'ADAUSDT',
    'DOGE': 'DOGEUSDT',
    'DOT': 'DOTUSDT',
    'MATIC': 'MATICUSDT',
    'CRV': 'CRVUSDT'
  };

  const binanceSymbol = binanceMap[symbol] || `${symbol}USDT`;

  try {
    const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`, { timeout: 5000 });
    return parseFloat(response.data.price);
  } catch (error) {
    console.log(`Binance API error for ${symbol}:`, error.message);
  }

  // Fallback to CoinGecko
  const coingeckoMap = {
    'BNB': 'binancecoin',
    'USDT': 'tether',
    'XRP': 'ripple',
    'SOL': 'solana',
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'STETH': 'staked-ether',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'CRV': 'curve-dao-token'
  };

  const coingeckoId = coingeckoMap[symbol] || symbol.toLowerCase();

  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`, { timeout: 5000 });
    return parseFloat(response.data[coingeckoId]?.usd || 0);
  } catch (error) {
    console.log(`CoinGecko API error for ${symbol}:`, error.message);
    return 0;
  }
};

const getCoinDetails = async (symbol) => {
  try {
    const normalizedSymbol = symbol.toLowerCase();

    // Get CoinGecko ID first
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${symbol}`;
    const searchResponse = await axios.get(searchUrl);

    let coinId = normalizedSymbol;
    if (searchResponse.status === 200) {
      const coins = searchResponse.data.coins || [];
      const coin = coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
      if (coin) {
        coinId = coin.id;
      }
    }

    // Get detailed coin data
    const detailUrl = `https://api.coingecko.com/api/v3/coins/${coinId}`;
    const detailResponse = await axios.get(detailUrl);

    if (detailResponse.status === 200) {
      return detailResponse.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching coin details:', error.message);
    return null;
  }
};

const getTopCoins = async (limit = 50, page = 1) => {
  try {
    return await getCachedOrFetch(`topCoins_${limit}_${page}`, async () => {
      return await retryWithBackoff(async () => {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit,
            page: page,
            sparkline: false
          },
          timeout: 10000
        });

        if (response.status === 200) {
          return response.data;
        }
        throw new Error('Invalid response status');
      });
    });
  } catch (error) {
    console.error('Error fetching top coins from API:', error);
    // Fallback to hardcoded top coins, but for pagination, return empty if page >1
    if (page > 1) return [];
    const fallbackCoins = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 0, market_cap: 0, market_cap_rank: 1, price_change_percentage_24h: 0 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 0, market_cap: 0, market_cap_rank: 2, price_change_percentage_24h: 0 },
      { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 1, market_cap: 0, market_cap_rank: 3, price_change_percentage_24h: 0 },
      { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 0, market_cap: 0, market_cap_rank: 4, price_change_percentage_24h: 0 },
      { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 0, market_cap: 0, market_cap_rank: 5, price_change_percentage_24h: 0 },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', current_price: 0, market_cap: 0, market_cap_rank: 6, price_change_percentage_24h: 0 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', current_price: 0, market_cap: 0, market_cap_rank: 7, price_change_percentage_24h: 0 },
      { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', current_price: 0, market_cap: 0, market_cap_rank: 8, price_change_percentage_24h: 0 },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', current_price: 0, market_cap: 0, market_cap_rank: 9, price_change_percentage_24h: 0 },
      { id: 'matic-network', symbol: 'matic', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png', current_price: 0, market_cap: 0, market_cap_rank: 10, price_change_percentage_24h: 0 }
    ];
    return fallbackCoins.slice(0, limit);
  }
};

module.exports = {
  getCoingeckoMarketData,
  getHistoricalMarketData,
  getLivePrice,
  getCoinDetails,
  getTopCoins
};
