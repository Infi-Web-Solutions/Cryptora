const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
// require('dotenv').config();

// Existing Routes
const dashboardRoutes = require('./src/routes/dashboard');
const tradingRoutes = require('./src/routes/trading');
const borrowRoutes = require('./src/routes/borrow');
const userRoutes = require('./src/routes/users');

// New Wallet-based Routes
const authRoutes = require('./src/routes/auth');
const portfolioRoutes = require('./src/routes/portfolio');
const adminRoutes = require('./src/routes/admin');
const walletTransactionRoutes = require('./src/routes/transactions');

// Model
const Coin = require('./src/models/Coin');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/crypto_platform',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Crypto Platform API is running...',
    version: '2.0.0',
    endpoints: {
      // Authentication
      auth: '/api/auth',
      // Portfolio & Wallet
      portfolio: '/api/portfolio',
      admin: '/api/admin',
      walletTransactions: '/api/transactions/history',
      // Existing endpoints
      dashboard: '/api/dashboard',
      trading: '/api/trading',
      borrow: '/api/borrow',
      transactions: '/api/transactions',
      users: '/api/users'
    }
  });
});

// Ping route
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ===== NEW WALLET-BASED API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
// Use '/api/transactions/history' for wallet transactions to avoid conflicts
app.use('/api/transactions', walletTransactionRoutes);

// ===== EXISTING API ROUTES =====
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/users', userRoutes);

// Legacy coin POST route
app.post('/coin', async (req, res) => {
  try {
    const { name, symbol, coingecko_id, current_price, image } = req.body;
    const coin = new Coin({ name, symbol, coingecko_id, current_price, image });
    await coin.save();
    res.status(201).json(coin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crypto_platform')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
