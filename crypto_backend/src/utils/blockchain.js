const { ethers } = require('ethers');
const { contract, contractWithSigner, wallet } = require('../../web3');

// Convert address to checksum
const toChecksumAddress = (address) => {
  return ethers.getAddress(address);
};

// Registration functions
const isUserRegistered = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    return await contract.registered(userAddressChecksum);
  } catch (error) {
    console.error('Error checking registration:', error);
    return false;
  }
};

const getAllPendingRequests = async () => {
  try {
    const [addresses, amounts] = await contract.getAllPendingRequests();
    const pending = [];
    for (let i = 0; i < addresses.length; i++) {
      const addr = toChecksumAddress(addresses[i]);
      const amount = amounts[i];
      if (amount > 0n) {
        pending.push({ wallet: addr, amount: Number(amount) });
      }
    }
    return pending;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
};

const requestVirtualFunds = async (amount) => {
  try {
    const tx = await contractWithSigner.requestVirtualUSD(amount);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error requesting virtual funds:', error);
    throw error;
  }
};

const requestVirtualFundsFor = async (userAddress, amount) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current fee data for EIP-1559 transactions
    let feeData;
    try {
      feeData = await wallet.provider.getFeeData();
      // Ensure maxFeePerGas is at least maxPriorityFeePerGas
      if (feeData.maxFeePerGas < feeData.maxPriorityFeePerGas) {
        feeData.maxFeePerGas = feeData.maxPriorityFeePerGas;
      }
      // Add buffer to avoid replacement issues
      feeData.maxFeePerGas = (feeData.maxFeePerGas * BigInt(3)) / BigInt(2);
      feeData.maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * BigInt(3)) / BigInt(2);
    } catch {
      feeData = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.requestVirtualUSDFor(userAddressChecksum, amount, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch {
      gasLimit = 300000n; // Higher fallback gas limit
    }

    // Build transaction as EIP-1559 transaction
    const txData = await contract.requestVirtualUSDFor.populateTransaction(userAddressChecksum, amount);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error requesting virtual funds for user:', error);
    throw error;
  }
};

const approveVirtualFunds = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current fee data for EIP-1559 transactions
    let feeData;
    try {
      feeData = await wallet.provider.getFeeData();
      // Ensure maxFeePerGas is at least maxPriorityFeePerGas
      if (feeData.maxFeePerGas < feeData.maxPriorityFeePerGas) {
        feeData.maxFeePerGas = feeData.maxPriorityFeePerGas;
      }
      // Add buffer to avoid replacement issues
      feeData.maxFeePerGas = (feeData.maxFeePerGas * BigInt(3)) / BigInt(2);
      feeData.maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * BigInt(3)) / BigInt(2);
    } catch {
      feeData = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.approveFunds(userAddressChecksum, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch (error) {
      console.error('Gas estimation failed:', error.message);
      return `Gas estimation failed: ${error.message}`;
    }

    // Build transaction as EIP-1559 transaction
    const txData = await contract.approveFunds.populateTransaction(userAddressChecksum);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error approving virtual funds:', error);
    throw error;
  }
};

const rejectVirtualFunds = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current fee data for EIP-1559 transactions
    let feeData;
    try {
      feeData = await wallet.provider.getFeeData();
      // Ensure maxFeePerGas is at least maxPriorityFeePerGas
      if (feeData.maxFeePerGas < feeData.maxPriorityFeePerGas) {
        feeData.maxFeePerGas = feeData.maxPriorityFeePerGas;
      }
      // Add buffer to avoid replacement issues
      feeData.maxFeePerGas = (feeData.maxFeePerGas * BigInt(3)) / BigInt(2);
      feeData.maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * BigInt(3)) / BigInt(2);
    } catch {
      feeData = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.rejectFunds(userAddressChecksum, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch {
      gasLimit = 200000n; // Higher fallback gas limit
    }

    // Build transaction as EIP-1559 transaction
    const txData = await contract.rejectFunds.populateTransaction(userAddressChecksum);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error rejecting virtual funds:', error);
    throw error;
  }
};

const repayVirtualFunds = async (userWallet, amount) => {
  try {
    const userWalletChecksum = toChecksumAddress(userWallet);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(userWalletChecksum, 'pending');

    // Get current fee data for EIP-1559 transactions
    let feeData;
    try {
      feeData = await wallet.provider.getFeeData();
      // Ensure maxFeePerGas is at least maxPriorityFeePerGas
      if (feeData.maxFeePerGas < feeData.maxPriorityFeePerGas) {
        feeData.maxFeePerGas = feeData.maxPriorityFeePerGas;
      }
      // Add buffer to avoid replacement issues
      feeData.maxFeePerGas = (feeData.maxFeePerGas * BigInt(3)) / BigInt(2);
      feeData.maxPriorityFeePerGas = (feeData.maxPriorityFeePerGas * BigInt(3)) / BigInt(2);
    } catch {
      feeData = {
        maxFeePerGas: ethers.parseUnits('50', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      };
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.repayBorrowedAmount(amount, { from: userWalletChecksum });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch {
      gasLimit = 250000n; // Higher fallback gas limit
    }

    // Build transaction as EIP-1559 transaction
    const txData = await contract.repayBorrowedAmount.populateTransaction(amount);
    const tx = {
      ...txData,
      from: userWalletChecksum,
      nonce: nonce,
      gasLimit: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error repaying virtual funds:', error);
    throw error;
  }
};

// Coin trading functions
const buyCoin = async (userWallet, symbol, price, quantity) => {
  try {
    const userWalletChecksum = toChecksumAddress(userWallet);
    console.log(`[DEBUG] Buying ${quantity} ${symbol} for ${userWalletChecksum} at price ${price}`);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current gas price and add significant buffer
    let gasPrice;
    try {
      const currentGasPrice = await wallet.provider.getGasPrice();
      gasPrice = (currentGasPrice * BigInt(3)) / BigInt(2); // Add 50% buffer
    } catch {
      gasPrice = ethers.parseUnits('20', 'gwei'); // Fallback gas price
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.buyCoinFor(userWalletChecksum, symbol.toUpperCase(), price, quantity, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch {
      gasLimit = 250000n; // Fallback gas limit
    }

    // Build transaction manually
    const txData = await contract.buyCoinFor.populateTransaction(userWalletChecksum, symbol.toUpperCase(), price, quantity);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    console.log(`[DEBUG] Buy transaction confirmed: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error('Error buying coin:', error);
    throw error;
  }
};

const sellCoin = async (userWallet, symbol, price, quantity) => {
  try {
    const userWalletChecksum = toChecksumAddress(userWallet);
    console.log(`[DEBUG] Selling ${quantity} ${symbol} for ${userWalletChecksum} at price ${price}`);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current gas price and add significant buffer
    let gasPrice;
    try {
      const currentGasPrice = await wallet.provider.getGasPrice();
      gasPrice = (currentGasPrice * BigInt(3)) / BigInt(2); // Add 50% buffer
    } catch {
      gasPrice = ethers.parseUnits('20', 'gwei'); // Fallback gas price
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.sellCoinFor(userWalletChecksum, symbol.toUpperCase(), price, quantity, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
    } catch {
      gasLimit = 250000n; // Fallback gas limit
    }

    // Build transaction manually
    const txData = await contract.sellCoinFor.populateTransaction(userWalletChecksum, symbol.toUpperCase(), price, quantity);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    console.log(`[DEBUG] Sell transaction confirmed: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error('Error selling coin:', error);
    throw error;
  }
};

// Watchlist functions
const addToWatchlist = async (userAddress, symbol) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const tx = await contractWithSigner.connect(new ethers.Wallet(process.env.USER_PRIVATE_KEY || wallet.privateKey, wallet.provider)).addToWatchlist(symbol.toUpperCase());
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

const removeFromWatchlist = async (userAddress, symbol) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const tx = await contractWithSigner.connect(new ethers.Wallet(process.env.USER_PRIVATE_KEY || wallet.privateKey, wallet.provider)).removeFromWatchlist(symbol.toUpperCase());
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};

const getWatchlist = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const watchlist = await contract.getWatchlist(userAddressChecksum);
    return watchlist;
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
};

// Getter functions
const getVirtualBalance = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const balance = await contract.getUSDBalance(userAddressChecksum);
    return Number(balance) * 100; // cents
  } catch (error) {
    console.error('Error getting virtual balance:', error);
    return 0;
  }
};

const getBorrowedAmount = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const amount = await contract.getBorrowedAmount(userAddressChecksum);
    return Number(amount);
  } catch (error) {
    console.error('Error getting borrowed amount:', error);
    return 0;
  }
};

const getCoinBalance = async (userAddress, symbol) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const balance = await contract.getCoinBalance(userAddressChecksum, symbol.toUpperCase());
    return Number(balance);
  } catch (error) {
    console.error('Error getting coin balance:', error);
    return 0;
  }
};

const getTransactionHistory = async (userWallet) => {
  try {
    const userWalletChecksum = toChecksumAddress(userWallet);
    const history = await contract.getTransactionHistory();
    return history.map(tx => ({
      type: tx.txType,
      symbol: tx.symbol,
      quantity: Number(tx.amount),
      timestamp: Number(tx.timestamp)
    }));
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return [];
  }
};

// Registration functions
const registerUser = async () => {
  try {
    const tx = await contractWithSigner.register();
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

const adminRegisterUser = async (userAddress) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);

    // Get nonce including pending transactions
    const nonce = await wallet.provider.getTransactionCount(wallet.address, 'pending');

    // Get current gas price and add significant buffer to avoid replacement issues
    let gasPrice;
    try {
      const currentGasPrice = await wallet.provider.getGasPrice();
      gasPrice = (currentGasPrice * BigInt(3)) / BigInt(2); // Add 50% buffer for replacement transactions
    } catch {
      gasPrice = ethers.parseUnits('50', 'gwei'); // Higher fallback gas price
    }

    // Try to estimate gas first
    let gasLimit;
    try {
      const gasEstimate = await contract.estimateGas.adminRegister(userAddressChecksum, { from: wallet.address });
      gasLimit = (gasEstimate * BigInt(6)) / BigInt(5); // Add 20% buffer to gas limit
      console.log(`[DEBUG] Gas estimate for adminRegister: ${gasEstimate}`);
    } catch (error) {
      console.error(`[ERROR] Gas estimation failed: ${error.message}`);
      gasLimit = 300000n; // Higher fallback gas limit
    }

    // Build transaction manually
    const txData = await contract.adminRegister.populateTransaction(userAddressChecksum);
    const tx = {
      ...txData,
      from: wallet.address,
      nonce: nonce,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      chainId: 11155111
    };

    // Sign and send transaction
    const signedTx = await wallet.signTransaction(tx);
    const txResponse = await wallet.provider.broadcastTransaction(signedTx);
    const receipt = await txResponse.wait();

    return receipt.hash;
  } catch (error) {
    console.error('Error admin registering user:', error);
    throw error;
  }
};

const selfRegisterUser = async (userAddress, userPrivateKey) => {
  try {
    const userAddressChecksum = toChecksumAddress(userAddress);
    const userWallet = new ethers.Wallet(userPrivateKey, wallet.provider);
    const userContract = new ethers.Contract(contract.target, contract.interface, userWallet);
    const tx = await userContract.register();
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error self registering user:', error);
    return null;
  }
};

const getAllRegisteredUsers = async () => {
  try {
    const users = await contract.getRegisteredUsers();
    return users.map(addr => toChecksumAddress(addr));
  } catch (error) {
    console.error('Error getting registered users:', error);
    return [];
  }
};

// Admin functions
const updateAdmin = async (newAdminAddress) => {
  try {
    const newAdminChecksum = toChecksumAddress(newAdminAddress);
    const tx = await contractWithSigner.updateAdmin(newAdminChecksum);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

const getUserHoldings = async (userWallet) => {
  try {
    const userWalletChecksum = toChecksumAddress(userWallet);
    const [symbols, amounts] = await contract.getUserHoldings(userWalletChecksum);
    return symbols.map((symbol, index) => ({
      symbol: symbol,
      amount: Number(amounts[index])
    }));
  } catch (error) {
    console.error('Error getting user holdings:', error);
    return [];
  }
};

module.exports = {
  toChecksumAddress,
  isUserRegistered,
  getAllPendingRequests,
  requestVirtualFunds,
  requestVirtualFundsFor,
  approveVirtualFunds,
  rejectVirtualFunds,
  repayVirtualFunds,
  buyCoin,
  sellCoin,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  getVirtualBalance,
  getBorrowedAmount,
  getCoinBalance,
  getTransactionHistory,
  registerUser,
  adminRegisterUser,
  selfRegisterUser,
  getAllRegisteredUsers,
  updateAdmin,
  getUserHoldings
};
