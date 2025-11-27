// src/controllers/adminController.js
const WalletUser = require('../models/WalletUser');
const Transaction = require('../models/Transaction');
const {
  toChecksumAddress,
  getAllPendingRequests,
  approveVirtualFunds,
  rejectVirtualFunds,
  CONTRACT_ADDRESS
} = require('../utils/web3');

/**
 * Get admin panel data with pending requests
 * @route GET /api/admin/panel
 */
const getAdminPanel = async (req, res) => {
  try {
    const pendingRequests = await getAllPendingRequests();

    // Format pending requests with user info
    const formatted = await Promise.all(
      pendingRequests.map(async (request) => {
        const walletAddress = request.user || request;
        const user = await WalletUser.findOne({ 
          walletAddress: walletAddress.toLowerCase() 
        });

        return {
          walletAddress: walletAddress,
          amount: request.amount || 0,
          userId: user?._id,
          dateJoined: user?.dateJoined
        };
      })
    );

    res.json({
      success: true,
      pendingRequests: formatted,
      contractAddress: CONTRACT_ADDRESS
    });
  } catch (error) {
    console.error('Admin panel error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve a borrow request
 * @route POST /api/admin/approve/:walletAddress
 */
const approveBorrowRequest = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const checksumAddress = toChecksumAddress(walletAddress);

    const txHash = await approveVirtualFunds(checksumAddress);

    // Record transaction in database
    try {
      const targetUser = await WalletUser.findOne({ 
        walletAddress: checksumAddress.toLowerCase() 
      });

      await Transaction.create({
        user: targetUser?._id || req.session.userId,
        type: 'fund',
        symbol: 'USD',
        quantity: 0,
        usdValue: 0,
        buyPrice: null,
        timestamp: new Date(),
        txHash: txHash
      });
    } catch (dbError) {
      console.error('Error saving approval transaction:', dbError);
    }

    res.json({
      success: true,
      message: `Approved request for ${checksumAddress}`,
      txHash: txHash
    });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject a borrow request
 * @route POST /api/admin/reject/:walletAddress
 */
const rejectBorrowRequest = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const checksumAddress = toChecksumAddress(walletAddress);

    const txHash = await rejectVirtualFunds(checksumAddress);

    // Record transaction in database
    try {
      const targetUser = await WalletUser.findOne({ 
        walletAddress: checksumAddress.toLowerCase() 
      });

      await Transaction.create({
        user: targetUser?._id || req.session.userId,
        type: 'fund',
        symbol: 'USD',
        quantity: 0,
        usdValue: 0,
        buyPrice: null,
        timestamp: new Date(),
        txHash: txHash
      });
    } catch (dbError) {
      console.error('Error saving rejection transaction:', dbError);
    }

    res.json({
      success: true,
      message: `Rejected request for ${checksumAddress}`,
      txHash: txHash
    });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAdminPanel,
  approveBorrowRequest,
  rejectBorrowRequest
};