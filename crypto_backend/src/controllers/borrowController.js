const { requestFundsTransaction, repayFundsTransaction } = require('../utils/utils');
const { getAllPendingRequests, approveVirtualFunds, rejectVirtualFunds, isUserRegistered, adminRegisterUser } = require('../utils/blockchain');
const Transaction = require('../models/Transaction');

// Request virtual funds (borrow)
const requestFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    // Check if user is registered in the smart contract
    const isRegistered = await isUserRegistered(user.wallet_address);
    if (!isRegistered) {
      // Auto-register the user if not registered
      try {
        console.log(`[BORROW] Auto-registering user ${user.wallet_address} in smart contract`);
        await adminRegisterUser(user.wallet_address);
        console.log(`[BORROW] Successfully auto-registered user ${user.wallet_address}`);
      } catch (registerError) {
        console.error(`[BORROW] Failed to auto-register user ${user.wallet_address}:`, registerError);
        return res.status(500).json({ error: 'Failed to register user in smart contract. Please try again or contact support.' });
      }
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const result = await requestFundsTransaction(user, amountCents);

    res.json({
      message: `Borrow request submitted for $${amount}`,
      tx_hash: result.txHash,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Request funds error:', error);
    res.status(500).json({ error: error.message || 'Failed to request funds' });
  }
};

// Repay virtual funds
const repayFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const result = await repayFundsTransaction(user, amountCents);

    res.json({
      message: `Repayment of $${amount} submitted`,
      tx_hash: result.txHash,
      transaction: result.transaction
    });
  } catch (error) {
    console.error('Repay funds error:', error);
    res.status(500).json({ error: error.message || 'Failed to repay funds' });
  }
};

// Admin: Get pending requests
const getPendingRequests = async (req, res) => {
  try {
    const pending = await getAllPendingRequests();
    console.log('Pending requests:', pending);
    res.json({ pending_requests: pending });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
};

// Admin: Approve request
const approveRequest = async (req, res) => {
  try {
    const { user_wallet } = req.params;
     console.log('approveRequestapproveRequest', user_wallet);

    if (!user_wallet) {
      return res.status(400).json({ error: 'User wallet required' });
    }

    const txHash = await approveVirtualFunds(user_wallet);

    // Record admin action
    const adminUser = req.user;
    const transaction = new Transaction({
      user: adminUser._id,
      type: 'fund',
      symbol: 'USD',
      quantity: 0,
      usd_value: 0,
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();

    res.json({
      message: `Approved request for ${user_wallet}`,
      tx_hash: txHash
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve request' });
  }
};

// Admin: Reject request
const rejectRequest = async (req, res) => {
  try {
    const { user_wallet } = req.params;

    if (!user_wallet) {
      return res.status(400).json({ error: 'User wallet required' });
    }

    const txHash = await rejectVirtualFunds(user_wallet);

    // Record admin action
    const adminUser = req.user;
    const transaction = new Transaction({
      user: adminUser._id,
      type: 'fund',
      symbol: 'USD',
      quantity: 0,
      usd_value: 0,
      buy_price: null,
      timestamp: new Date(),
      tx_hash: txHash
    });
    await transaction.save();

    res.json({
      message: `Rejected request for ${user_wallet}`,
      tx_hash: txHash
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject request' });
  }
};

module.exports = {
  requestFunds,
  repayFunds,
  getPendingRequests,
  approveRequest,
  rejectRequest
};
