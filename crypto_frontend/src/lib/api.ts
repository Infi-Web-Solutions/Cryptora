const API_BASE_URL = '';

// Generic API request function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`API Request: ${url}`);
  const config: RequestInit = {
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

// Market Data APIs
export const marketDataApi = {
  // Get global market data from CoinGecko
  getGlobalData: () => apiRequest('/api/dashboard/market'),

  // Get global historical market data
  getGlobalHistoricalData: (days: number = 7) =>
    apiRequest(`/api/dashboard/global-historical?days=${days}`),

  // Get historical market data
  getHistoricalData: (symbol: string, days: number = 7) =>
    apiRequest(`/api/dashboard/historical?symbol=${symbol}&days=${days}`),

  // Get live prices for multiple symbols
  getLivePrices: (symbols: string[]) =>
    apiRequest(`/api/dashboard/prices?symbols=${symbols.join(',')}`),

  // Get top coins
  getTopCoins: (limit: number = 10, page: number = 1) => apiRequest(`/api/dashboard/top-coins?limit=${limit}&page=${page}`),
};

// Dashboard APIs
export const dashboardApi = {
  // Get full dashboard data
  getDashboard: (walletAddress?: string) => {
    const headers: Record<string, string> = {};
    if (walletAddress) {
      headers['wallet-address'] = walletAddress;
    }
    return apiRequest('/api/dashboard', { headers });
  },

  // Get portfolio data
  getPortfolio: (walletAddress?: string) => {
    const params = walletAddress ? `?wallet=${walletAddress}` : '';
    return apiRequest(`/api/dashboard/portfolio${params}`);
  },

  // Get coin details
  getCoinDetails: (symbol: string) => apiRequest(`/api/dashboard/coin/${symbol}`),

  // Record buy price after transaction confirmation
  recordBuyPrice: (data: { symbol: string; price: number; quantity: number; type?: string; tx_hash?: string; txHash?: string ; wallet_address: string }) =>
    apiRequest('/api/dashboard/record-buy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Trading APIs
export const tradingApi = {
  // Get current price for a symbol
  getPrice: (symbol: string) => apiRequest(`/api/trading/price/${symbol}`),

  // Buy cryptocurrency
  buy: (data: { symbol: string; quantity: number; price: number }) =>
    apiRequest('/api/trading/buy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sell cryptocurrency
  sell: (data: { symbol: string; quantity: number; price: number }) =>
    apiRequest('/api/trading/sell', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Transaction APIs
export const transactionApi = {
  // Get transaction history
  getHistory: (walletAddress?: string) => {
    const headers: Record<string, string> = {};
    if (walletAddress) {
      headers['wallet-address'] = walletAddress;
    }
    return apiRequest('/api/transactions', { headers });
  },

  // Get recent transactions
  getRecent: () => apiRequest('/api/transactions/recent'),

  // Get transaction summary
  getSummary: () => apiRequest('/api/transactions/summary'),
};

// User APIs
export const userApi = {
  // Login with wallet
  login: (walletAddress: string) =>
    apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    }),

  // Register wallet
  register: (walletAddress: string) =>
    apiRequest('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    }),

  // Admin login
  adminLogin: (walletAddress: string, password: string) =>
    apiRequest('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, password }),
    }),

  // Get user profile
  getProfile: () => apiRequest('/api/users/profile'),
};

// Portfolio APIs (New - Wallet-based with blockchain integration)
export const portfolioApi = {
  // Get complete portfolio data with holdings
  getPortfolio: (walletAddress?: string) => {
    const params = walletAddress ? `?wallet=${walletAddress}` : '';
    return apiRequest(`/api/portfolio${params}`);
  },

  // Request to borrow virtual funds (admin submits on behalf of user)
  borrowVirtualFunds: (amount: number) =>
    apiRequest('/api/portfolio/borrow', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Repay borrowed virtual funds (user signs with private key)
  repayVirtualFunds: (amount: number, privateKey: string) =>
    apiRequest('/api/portfolio/repay', {
      method: 'POST',
      body: JSON.stringify({ amount, privateKey }),
    }),
};

// Borrow/Lending APIs (Existing)
export const borrowApi = {
  // Request virtual funds
  requestFunds: (amount: number) =>
    apiRequest('/api/borrow/request', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Repay borrowed funds
  repay: (amount: number) =>
    apiRequest('/api/borrow/repay', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  // Get pending requests (admin)
  getPendingRequests: () => apiRequest('/api/borrow/pending'),

  // Approve request (admin)
  approveRequest: (userWallet: string) =>
    apiRequest(`/api/borrow/approve/${userWallet}`, { method: 'POST' }),

  // Reject request (admin)
  rejectRequest: (userWallet: string) =>
    apiRequest(`/api/borrow/reject/${userWallet}`, { method: 'POST' }),
};

// Admin APIs (New)
export const adminApi = {
  // Get pending borrow requests
  getPendingRequests: () => apiRequest('/api/admin/panel'),

  // Approve borrow request
  approveRequest: (userWallet: string) =>
    apiRequest(`/api/admin/approve/${userWallet}`, { method: 'POST' }),

  // Reject borrow request
  rejectRequest: (userWallet: string) =>
    apiRequest(`/api/admin/reject/${userWallet}`, { method: 'POST' }),
};

// Convenience functions for common operations
export const getPortfolio = portfolioApi.getPortfolio; // Use new wallet-based portfolio
export const getCoinDetails = dashboardApi.getCoinDetails;
export const getCurrentPrice = tradingApi.getPrice;
export const buyCoin = tradingApi.buy;
export const sellCoin = tradingApi.sell;
export const recordBuyPrice = dashboardApi.recordBuyPrice;
export const requestFunds = portfolioApi.borrowVirtualFunds; // Use new wallet-based borrow
export const repayFunds = portfolioApi.repayVirtualFunds; // Use new wallet-based repay
export const getTransactions = transactionApi.getHistory;

export default {
  marketDataApi,
  dashboardApi,
  tradingApi,
  transactionApi,
  userApi,
  portfolioApi,
  borrowApi,
  adminApi,
};
