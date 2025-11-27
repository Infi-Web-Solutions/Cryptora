// src/controllers/authController.js
const WalletUser = require('../models/WalletUser');
const { toChecksumAddress, isRegistered, selfRegisterUser } = require('../utils/web3');

/**
 * Connect wallet (login)z
 * @route POST /api/auth/connect-wallet
 */
const connectWallet = async (req, res) => {
  try {
    console.log(`Request received: ${req.method} ${req.path}`);
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const checksumAddress = toChecksumAddress(walletAddress);

    if (!checksumAddress) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    // Create or get the user
    let user = await WalletUser.findOne({ walletAddress: checksumAddress.toLowerCase() });

    if (!user) {
      user = new WalletUser({
        walletAddress: checksumAddress.toLowerCase()
      });
      try {
        await user.save();
      } catch (dbError) {
        console.error('DB save error for new user:', dbError);
        if (dbError.code === 11000) { // Duplicate key error
          // Try to find again in case of race condition
          user = await WalletUser.findOne({ walletAddress: checksumAddress.toLowerCase() });
          if (!user) {
            throw new Error('Failed to create user due to duplicate key');
          }
        } else {
          throw dbError;
        }
      }
    }

    // Update last login
    user.lastLogin = new Date();
    try {
      await user.save();
    } catch (dbError) {
      console.error('DB save error for last login update:', dbError);
      // Continue anyway, as user is already created
    }

    // Set session
    req.session.userId = user._id;
    req.session.walletAddress = checksumAddress.toLowerCase();

    res.json({
      success: true,
      message: 'Wallet connected successfully',
      user: {
        id: user._id,
        walletAddress: checksumAddress,
        isStaff: user.isStaff,
        isSuperuser: user.isSuperuser
      }
    });
  } catch (error) {
    console.error('Connect wallet error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Register wallet on blockchain
 * @route POST /api/auth/register-wallet
 */
const registerWallet = async (req, res) => {
  try {
    const { walletAddress, privateKey } = req.body;

    if (!walletAddress || !privateKey) {
      return res.status(400).json({ error: 'Both wallet address and private key are required' });
    }

    const checksumAddress = toChecksumAddress(walletAddress);

    // Check if already registered on-chain
    const registered = await isRegistered(checksumAddress);
    if (registered) {
      return res.status(400).json({ 
        error: 'Wallet is already registered',
        alreadyRegistered: true 
      });
    }

    // Register user on-chain
    const txHash = await selfRegisterUser(checksumAddress, privateKey);

    if (txHash) {
      // Create user in database
      let user = await WalletUser.findOne({ walletAddress: checksumAddress.toLowerCase() });
      if (!user) {
        user = new WalletUser({
          walletAddress: checksumAddress.toLowerCase()
        });
        await user.save();
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Set session (login the user)
      req.session.userId = user._id;
      req.session.walletAddress = checksumAddress.toLowerCase();

      res.json({
        success: true,
        message: 'Registration transaction submitted and user logged in',
        txHash: txHash,
        walletAddress: checksumAddress,
        user: {
          id: user._id,
          walletAddress: checksumAddress,
          isStaff: user.isStaff,
          isSuperuser: user.isSuperuser
        }
      });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  } catch (error) {
    console.error('Register wallet error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin login with password
 * @route POST /api/auth/admin-login
 */
const adminLogin = async (req, res) => {
  try {
    const { walletAddress, password } = req.body;

    if (!walletAddress || !password) {
      return res.status(400).json({ error: 'Both wallet address and password are required' });
    }

    const checksumAddress = toChecksumAddress(walletAddress);

    // Find user
    const user = await WalletUser.findOne({ walletAddress: checksumAddress.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is superuser
    if (!user.isSuperuser) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set session
    req.session.userId = user._id;
    req.session.walletAddress = checksumAddress.toLowerCase();
    req.session.isAdmin = true;

    res.json({
      success: true,
      message: 'Admin logged in successfully',
      user: {
        id: user._id,
        walletAddress: checksumAddress,
        isStaff: user.isStaff,
        isSuperuser: user.isSuperuser
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

/**
 * Get current authenticated user
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await WalletUser.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        isStaff: user.isStaff,
        isSuperuser: user.isSuperuser,
        lastLogin: user.lastLogin,
        dateJoined: user.dateJoined
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check session status
 * @route GET /api/auth/session
 */
const checkSession = (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ 
      authenticated: true,
      walletAddress: req.session.walletAddress,
      isAdmin: req.session.isAdmin || false
    });
  } else {
    res.json({ authenticated: false });
  }
};

module.exports = {
  connectWallet,
  registerWallet,
  adminLogin,
  logout,
  getCurrentUser,
  checkSession
};