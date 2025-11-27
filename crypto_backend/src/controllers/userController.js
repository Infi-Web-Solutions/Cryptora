const User = require('../models/User');
const { selfRegisterUser, adminRegisterUser, isUserRegistered } = require('../utils/blockchain');

// Wallet login
const walletLogin = async (req, res) => {
  try {
    const { wallet_address } = req.body;

    if (!wallet_address) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    // Normalize wallet address
    const normalizedAddress = wallet_address.toLowerCase();

    // Create or get user
    let user = await User.findOne({ wallet_address: normalizedAddress });
    if (!user) {
      user = new User({ wallet_address: normalizedAddress });
      await user.save();
    }

    res.json({
      message: `Wallet ${normalizedAddress.slice(0, 6)}... connected!`,
      user: {
        id: user._id,
        wallet_address: user.wallet_address,
        is_active: user.is_active,
        is_staff: user.is_staff,
        date_joined: user.date_joined
      }
    });
  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Register wallet
const registerWallet = async (req, res) => {
  try {
    const { wallet_address, private_key } = req.body;

    if (!wallet_address || !private_key) {
      return res.status(400).json({ error: 'Wallet address and private key required' });
    }

    // Check if already registered
    const alreadyRegistered = await isUserRegistered(wallet_address);
    if (alreadyRegistered) {
      return res.json({ message: 'Wallet is already registered.' });
    }

    // Register using private key
    const txHash = await selfRegisterUser(wallet_address, private_key);

    if (txHash) {
      res.json({
        message: 'Registration transaction submitted! Please wait for confirmation.',
        tx_hash: txHash
      });
    } else {
      res.status(500).json({ error: 'Registration failed. Please check your private key and try again.' });
    }
  } catch (error) {
    console.error('Register wallet error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      user: {
        id: user._id,
        wallet_address: user.wallet_address,
        is_active: user.is_active,
        is_staff: user.is_staff,
        date_joined: user.date_joined
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Admin register user
const adminRegisterUserController = async (req, res) => {
  try {
    const { user_address } = req.body;

    if (!user_address) {
      return res.status(400).json({ error: 'User address required' });
    }

    const txHash = await adminRegisterUser(user_address);

    if (txHash) {
      res.json({
        message: `User ${user_address} registered successfully`,
        tx_hash: txHash
      });
    } else {
      res.status(500).json({ error: 'Admin registration failed' });
    }
  } catch (error) {
    console.error('Admin register user error:', error);
    res.status(500).json({ error: error.message || 'Admin registration failed' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ users: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Update user status (admin only)
const updateUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_active, is_staff } = req.body;

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (is_active !== undefined) user.is_active = is_active;
    if (is_staff !== undefined) user.is_staff = is_staff;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        wallet_address: user.wallet_address,
        is_active: user.is_active,
        is_staff: user.is_staff
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

module.exports = {
  walletLogin,
  registerWallet,
  getUserProfile,
  adminRegisterUserController,
  getAllUsers,
  updateUserStatus
};
