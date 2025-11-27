const User = require('../models/User');
const { contract } = require('../utils/web3');

// Wallet authentication middleware
const walletAuth = async (req, res, next) => {
  try {
    const walletAddress = req.headers['wallet-address'] || req.query.wallet || req.body.wallet_address;

    if (!walletAddress) {
      return res.status(401).json({ error: 'Wallet address required' });
    }

    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();

    // Find or create user
    let user = await User.findOne({ wallet_address: normalizedAddress });
    if (!user) {
      user = new User({ wallet_address: normalizedAddress });
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin check middleware
const adminRequired = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin in contract
    const contractAdmin = await contract.admin();
    const isAdmin = req.user.wallet_address.toLowerCase() === contractAdmin.toLowerCase() ||
                   req.user.is_staff;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Optional auth middleware (doesn't fail if no wallet)
const optionalWalletAuth = async (req, res, next) => {
  try {
    const walletAddress = req.headers['wallet-address'] || req.query.wallet || req.body.wallet_address;

    if (walletAddress) {
      const normalizedAddress = walletAddress.toLowerCase();
      let user = await User.findOne({ wallet_address: normalizedAddress });
      if (!user) {
        user = new User({ wallet_address: normalizedAddress });
        await user.save();
      }
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Optional wallet auth error:', error);
    next(); // Continue even if auth fails
  }
};


// src/middleware/auth.js
const WalletUser = require('../models/WalletUser');
const { isAdminAddress } = require('../utils/web3');

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
};

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await WalletUser.findById(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if superuser in database
    if (user.isSuperuser) {
      req.user = user;
      return next();
    }

    // Check on-chain admin status
    const isAdminOnChain = await isAdminAddress(user.walletAddress);
    if (isAdminOnChain) {
      req.user = user;
      return next();
    }

    return res.status(403).json({ error: 'Admin access required' });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Admin verification failed' });
  }
};

// Attach user to request if authenticated
const attachUser = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await WalletUser.findById(req.session.userId);
      req.user = user;
    } catch (error) {
      console.error('Error attaching user:', error);
    }
  }
  next();
};

module.exports = {
  walletAuth,
  adminRequired,
  optionalWalletAuth,
  isAuthenticated,
  isAdmin,
  attachUser
};
