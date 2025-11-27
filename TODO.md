# Fix Transaction tx_hash Display Issue

## Problem
- Transaction tx_hash is showing incorrect hash that doesn't exist on Etherscan
- Frontend links to mainnet Etherscan instead of Sepolia
- Need to extract correct tx_hash from blockchain/wallet

## Tasks
- [ ] Update frontend to use Sepolia Etherscan URL
- [ ] Review blockchain.js transaction functions for proper receipt.hash extraction
- [ ] Add better error handling and logging for transaction creation
- [ ] Add mechanism to update incorrect tx_hash from blockchain events
- [ ] Test transaction creation and verify tx_hash on Sepolia Etherscan

## Files to Modify
- crypto_frontend/src/pages/Transactions.tsx
- crypto_backend/src/utils/blockchain.js
- crypto_backend/src/utils/utils.js
- crypto_backend/src/controllers/transactionController.js
