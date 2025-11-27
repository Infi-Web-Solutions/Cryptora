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

const getGlobalHistoricalMarketData = async (days = 7) => {
  try {
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);

    let interval = '1d';
    if (days <= 1) interval = '1m';
    else if (days <= 7) interval = '15m';
    else if (days <= 30) interval = '1h';
    else if (days <= 90) interval = '4h';

    const binanceSymbol = 'BTCUSDT';

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

      const market_caps = klines.map(k => [parseInt(k[0]), parseFloat(k[4])]);
      const total_volumes = klines.map(k => [parseInt(k[0]), parseFloat(k[5])]);

      return {
        market_caps,
        total_volumes
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching global historical market data:', error.message);
    return null;
  }
};

module.exports = {
  getGlobalHistoricalMarketData
};
