# Crypto Platform Backend API

A Node.js/Express backend API for a cryptocurrency trading platform with blockchain integration.

## Features

- **Wallet Authentication**: Connect and authenticate using Ethereum wallets
- **Trading**: Buy and sell cryptocurrencies with real-time prices
- **Portfolio Management**: Track holdings, balances, and transaction history
- **Borrow/Lending**: Request virtual USD funds and repay loans
- **Admin Panel**: Approve/reject fund requests and manage users
- **Market Data**: Real-time prices from CoinGecko and Binance APIs
- **Transaction History**: Complete audit trail of all transactions

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Ethers.js** for blockchain interactions
- **CoinGecko API** for market data
- **Binance API** for price feeds

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

5. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/users/login` - Wallet login
- `POST /api/users/register` - Register wallet

### Dashboard
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/portfolio` - Get portfolio (with optional wallet query param)
- `GET /api/dashboard/market` - Get market data
- `GET /api/dashboard/historical` - Get historical price data
- `GET /api/dashboard/prices` - Get live prices

### Trading
- `POST /api/trading/buy` - Buy cryptocurrency
- `POST /api/trading/sell` - Sell cryptocurrency
- `GET /api/trading/price/:symbol` - Get current price
- `GET /api/trading/prices` - Get multiple prices

### Borrow/Lending
- `POST /api/borrow/request` - Request virtual funds
- `POST /api/borrow/repay` - Repay borrowed funds
- `GET /api/borrow/pending` - Get pending requests (admin)
- `POST /api/borrow/approve/:user_wallet` - Approve request (admin)
- `POST /api/borrow/reject/:user_wallet` - Reject request (admin)

### Transactions
- `GET /api/transactions` - Get transaction history
- `GET /api/transactions/recent` - Get recent transactions
- `GET /api/transactions/summary` - Get transaction summary
- `GET /api/transactions/type/:type` - Get transactions by type
- `GET /api/transactions/hash/:tx_hash` - Get transaction by hash

### User Management
- `GET /api/users/profile` - Get user profile
- `POST /api/users/admin-register` - Admin register user
- `GET /api/users/all` - Get all users (admin)
- `PUT /api/users/:user_id/status` - Update user status (admin)

### Watchlist
- `POST /api/dashboard/watchlist` - Add to watchlist
- `DELETE /api/dashboard/watchlist` - Remove from watchlist
- `GET /api/dashboard/watchlist` - Get user watchlist

## Authentication

Most endpoints require wallet authentication. Include the wallet address in the request headers:

```
wallet-address: 0x1234...abcd
```

Admin endpoints require the user to be an admin in the smart contract.

## Data Models

### User
- `wallet_address`: String (unique, lowercase)
- `is_active`: Boolean
- `is_staff`: Boolean
- `date_joined`: Date

### Transaction
- `user`: ObjectId (ref: User)
- `type`: String (buy, sell, fund, repay)
- `symbol`: String
- `quantity`: Decimal128
- `usd_value`: Decimal128
- `buy_price`: Decimal128
- `timestamp`: Date
- `tx_hash`: String

### BuyPrice
- `user`: ObjectId (ref: User)
- `symbol`: String
- `price_usd`: Number
- `total_quantity`: Number
- `total_cost_usd`: Number
- `average_price_usd`: Number

### Watchlist
- `user`: ObjectId (ref: User)
- `coin`: ObjectId (ref: Coin)

### Coin
- `name`: String
- `symbol`: String
- `coingecko_id`: String
- `current_price`: Number
- `image`: String

## Blockchain Integration

The API integrates with a smart contract deployed on Ethereum Sepolia testnet. Key functions:

- User registration and authentication
- Virtual USD balance management
- Cryptocurrency trading
- Borrow/lending system
- Transaction history

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (in development)"
}
```

## Development

### Project Structure
```
src/
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── utils/          # Utility functions
└── config/         # Configuration files
```

### Key Files
- `server.js` - Main application entry point
- `web3.js` - Blockchain connection and contract setup
- `src/middleware/auth.js` - Authentication middleware
- `src/utils/blockchain.js` - Blockchain utility functions
- `src/utils/marketData.js` - Market data fetching
- `src/utils/utils.js` - General utilities

## Environment Variables

See `.env.example` for required environment variables.

## License

ISC
