// crypto_backend/src/utils/web3.js
const { Web3 } = require('web3');
const NodeCache = require('node-cache');

// Initialize Web3
let web3;
try {
  web3 = new Web3(process.env.WEB3_PROVIDER_URL || 'https://eth-sepolia.g.alchemy.com/v2/N0adIqZubpwEje_0URf5i');
  console.log('[INFO] Web3 initialized successfully');
} catch (error) {
  console.error('[ERROR] Failed to initialize Web3:', error);
  web3 = null;
}

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5C031Ed9b2D585c9391c885616C1D340d8774BbB";
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0x16d3ACbD38aa841DB2Da166041e99C9d3cb98750";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "ebb51a573b7dbfb3163e8f856249b75d9f973f78c17760f937a5eea285cfbe8b";

// Contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "oldAdmin",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "AdminUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalCost",
        "type": "uint256"
      }
    ],
    "name": "CoinBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "CoinSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "FundsApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "FundsRejected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "Registered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Repaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RequestFunds",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "added",
        "type": "bool"
      }
    ],
    "name": "WatchlistUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "addToWatchlist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "adminRegister",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "approveFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "buyCoin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddr",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "buyCoinFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPendingRequests",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getBorrowedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "getCoinBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRegisteredUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTransactionHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "txType",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "symbol",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct CryptoPlatform.Transaction[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUSDBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserHoldings",
    "outputs": [
      {
        "internalType": "string[]",
        "name": "",
        "type": "string[]"
      },
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "pendingRequests",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "registered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "registeredUsers",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "rejectFunds",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "removeFromWatchlist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "repayBorrowedAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "requestVirtualUSD",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "requestVirtualUSDFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "sellCoin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "userAddr",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "sellCoinFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "updateAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let contract;
try {
  if (web3) {
    contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    console.log('[INFO] Contract initialized at address:', CONTRACT_ADDRESS);
  } else {
    contract = null;
  }
} catch (error) {
  console.error('[ERROR] Failed to initialize contract:', error);
  contract = null;
}

// Cache for API calls
const cache = new NodeCache({ stdTTL: 120 });

// Helper function to convert to checksum address
const toChecksumAddress = (address) => {
  try {
    if (!web3) throw new Error('Web3 not initialized');
    return web3.utils.toChecksumAddress(address.trim().toLowerCase());
  } catch (error) {
    throw new Error('Invalid wallet address format: ' + error.message);
  }
};

// Get virtual balance
const getVirtualBalance = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const balance = await contract.methods.getUSDBalance(checksumAddress).call();
    console.log(`[INFO] Virtual balance for ${checksumAddress}: ${balance}`);
    return Number(balance);
  } catch (error) {
    console.error('[ERROR] Failed to get virtual balance:', error.message);
    return 0;
  }
};

// Get borrowed amount
const getBorrowedAmount = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const borrowed = await contract.methods.getBorrowedAmount(checksumAddress).call();
    return Number(borrowed);
  } catch (error) {
    console.error('[ERROR] Failed to get borrowed amount:', error.message);
    return 0;
  }
};

// Get coin balance
const getCoinBalance = async (walletAddress, symbol) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const balance = await contract.methods.getCoinBalance(checksumAddress, symbol.toUpperCase()).call();
    return Number(balance);
  } catch (error) {
    console.error('[ERROR] Failed to get coin balance:', error.message);
    return 0;
  }
};

// Get user holdings
const getUserHoldings = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const holdings = await contract.methods.getUserHoldings(checksumAddress).call();
    return holdings;
  } catch (error) {
    console.error('[ERROR] Failed to get user holdings:', error.message);
    return [[], []];
  }
};

// Get watchlist - NOTE: This function doesn't exist in your contract
const getWatchlist = async (walletAddress) => {
  try {
    console.warn('[WARN] getWatchlist not available in contract - returning empty array');
    return [];
  } catch (error) {
    console.error('[ERROR] Failed to get watchlist:', error.message);
    return [];
  }
};

// Get transaction history from contract
const getTransactionHistory = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const history = await contract.methods.getTransactionHistory().call({ from: checksumAddress });
    return history || [];
  } catch (error) {
    console.error('[ERROR] Failed to get transaction history:', error.message);
    return [];
  }
};

// Request virtual funds FOR user (admin functionality)
const requestVirtualFundsFor = async (userWallet, amountCents) => {
  try {
    const checksumAddress = toChecksumAddress(userWallet);
    const nonce = await web3.eth.getTransactionCount(WALLET_ADDRESS, 'pending');
    
    // const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei');
    // const maxFeePerGas = await web3.eth.getGasPrice();
    let maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei');
let networkGasPrice = await web3.eth.getGasPrice();

// Ensure maxFeePerGas is not less than priority fee
let maxFeePerGas = BigInt(networkGasPrice) > BigInt(maxPriorityFeePerGas)
  ? networkGasPrice
  : maxPriorityFeePerGas;

    const gasEstimate = 200000;
    
    const txn = contract.methods.requestVirtualUSDFor(checksumAddress, amountCents).encodeABI();
    
    const tx = {
      from: WALLET_ADDRESS,
      to: CONTRACT_ADDRESS,
      gas: gasEstimate,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas,
      data: txn,
      nonce: nonce,
      type: 2,
      chainId: 11155111
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt.transactionHash;
  } catch (error) {
    console.error('[ERROR] Failed to request virtual funds for user:', error.message);
    throw error;
  }
};

// Repay virtual funds (user-initiated with their private key)
const repayVirtualFunds = async (userWallet, amountCents, privateKey) => {
  try {
    const checksumAddress = toChecksumAddress(userWallet);
    const nonce = await web3.eth.getTransactionCount(checksumAddress, 'pending');
    
    const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei');
    const maxFeePerGas = await web3.eth.getGasPrice();
    const gasEstimate = 200000;
    
    const txn = contract.methods.repayBorrowedAmount(amountCents).encodeABI();
    
    const tx = {
      from: checksumAddress,
      to: CONTRACT_ADDRESS,
      gas: gasEstimate,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas,
      data: txn,
      nonce: nonce,
      type: 2,
      chainId: 11155111
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt.transactionHash;
  } catch (error) {
    console.error('[ERROR] Failed to repay virtual funds:', error.message);
    throw error;
  }
};

// Get all pending requests (admin)
const getAllPendingRequests = async () => {
  try {
    const [users, amounts] = await contract.methods.getAllPendingRequests().call();
    
    const pending = [];
    for (let i = 0; i < users.length; i++) {
      pending.push({
        user: users[i],
        amount: Number(amounts[i])
      });
    }
    
    return pending;
  } catch (error) {
    console.error('[ERROR] Failed to get pending requests:', error.message);
    return [];
  }
};

// Approve virtual funds (admin)
const approveVirtualFunds = async (userWallet) => {
  try {
    const checksumAddress = toChecksumAddress(userWallet);
    const nonce = await web3.eth.getTransactionCount(WALLET_ADDRESS, 'pending');
    
    const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei');
    const maxFeePerGas = await web3.eth.getGasPrice();
    const gasEstimate = 200000;
    
    const txn = contract.methods.approveFunds(checksumAddress).encodeABI();
    
    const tx = {
      from: WALLET_ADDRESS,
      to: CONTRACT_ADDRESS,
      gas: gasEstimate,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas,
      data: txn,
      nonce: nonce,
      type: 2,
      chainId: 11155111
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt.transactionHash;
  } catch (error) {
    console.error('[ERROR] Failed to approve virtual funds:', error.message);
    throw error;
  }
};

// Reject virtual funds (admin)
const rejectVirtualFunds = async (userWallet) => {
  try {
    const checksumAddress = toChecksumAddress(userWallet);
    const nonce = await web3.eth.getTransactionCount(WALLET_ADDRESS, 'pending');
    
    const maxPriorityFeePerGas = web3.utils.toWei('2', 'gwei');
    const maxFeePerGas = await web3.eth.getGasPrice();
    const gasEstimate = 200000;
    
    const txn = contract.methods.rejectFunds(checksumAddress).encodeABI();
    
    const tx = {
      from: WALLET_ADDRESS,
      to: CONTRACT_ADDRESS,
      gas: gasEstimate,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
      maxFeePerGas: maxFeePerGas,
      data: txn,
      nonce: nonce,
      type: 2,
      chainId: 11155111
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt.transactionHash;
  } catch (error) {
    console.error('[ERROR] Failed to reject virtual funds:', error.message);
    throw error;
  }
};

// Check if user is registered
const isRegistered = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    return await contract.methods.registered(checksumAddress).call();
  } catch (error) {
    console.error('[ERROR] Failed to check registration:', error.message);
    return false;
  }
};

// Self register user
const selfRegisterUser = async (walletAddress, privateKey) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const nonce = await web3.eth.getTransactionCount(checksumAddress, 'pending');
    const gasPrice = await web3.eth.getGasPrice();
    const gasEstimate = await contract.methods.register().estimateGas({ from: checksumAddress });
    
    const txn = contract.methods.register().encodeABI();
    
    const tx = {
      from: checksumAddress,
      to: CONTRACT_ADDRESS,
      gas: gasEstimate,
      gasPrice: gasPrice,
      data: txn,
      nonce: nonce,
      chainId: 11155111
    };
    
    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt.transactionHash;
  } catch (error) {
    console.error('[ERROR] Failed to self-register user:', error.message);
    throw error;
  }
};

// Check if admin
const isAdminAddress = async (walletAddress) => {
  try {
    const checksumAddress = toChecksumAddress(walletAddress);
    const adminAddress = await contract.methods.admin().call();
    return checksumAddress.toLowerCase() === adminAddress.toLowerCase();
  } catch (error) {
    console.error('[ERROR] Failed to check admin status:', error.message);
    return false;
  }
};

module.exports = {
  web3,
  contract,
  cache,
  toChecksumAddress,
  getVirtualBalance,
  getBorrowedAmount,
  getCoinBalance,
  getUserHoldings,
  getWatchlist,
  getTransactionHistory,
  requestVirtualFundsFor,
  repayVirtualFunds,
  getAllPendingRequests,
  approveVirtualFunds,
  rejectVirtualFunds,
  isRegistered,
  selfRegisterUser,
  isAdminAddress,
  CONTRACT_ADDRESS,
  WALLET_ADDRESS,
  CONTRACT_ABI
};