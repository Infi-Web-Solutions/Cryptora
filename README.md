# Cryptora - Cryptocurrency Trading Platform

A full-stack decentralized cryptocurrency trading platform built with React, Node.js/Express, MongoDB, and Ethereum smart contracts. This platform enables users to trade cryptocurrencies using virtual USD, manage portfolios, and interact with blockchain technology through wallet authentication.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Smart Contract](#-smart-contract)
- [Frontend Pages](#-frontend-pages)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## ✨ Features

### User Features
- **🔐 Wallet Authentication**: Connect using MetaMask or other Web3 wallets (no traditional passwords required)
- **💰 Virtual USD Trading**: Trade cryptocurrencies with virtual USD balance
- **📊 Real-time Price Tracking**: Live cryptocurrency prices and market data
- **💼 Portfolio Management**: Track holdings, performance, and transaction history
- **📈 Interactive Charts**: Visualize price movements and portfolio performance
- **👁️ Watchlist**: Monitor favorite cryptocurrencies
- **💸 Borrow/Repay System**: Request virtual USD funds for trading
- **📱 Responsive Design**: Optimized for desktop and mobile devices

### Admin Features
- **⚙️ Admin Dashboard**: Manage users and platform operations
- **✅ Borrow Request Management**: Approve/reject user fund requests
- **👥 User Management**: View and manage registered users
- **📊 Platform Analytics**: Monitor platform-wide statistics

### Blockchain Integration
- **🔗 Smart Contract Integration**: On-chain user registration and transaction recording
- **⛓️ Ethereum/Web3 Support**: Full blockchain interaction via ethers.js and web3.js
- **🔒 Secure Transactions**: Cryptographically signed blockchain transactions

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Blockchain**: ethers.js v6
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Express Session with MongoDB store
- **Security**: bcryptjs for password hashing, CORS
- **Blockchain**: ethers.js v6, web3.js v4
- **Caching**: node-cache

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Platform**: Ethereum-compatible blockchains
- **Features**: User registration, portfolio tracking, transaction history, borrow/repay system

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  React + TypeScript + Vite + shadcn/ui + TailwindCSS   │
│         (Wallet Context, React Query, Routing)          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Backend Layer                          │
│      Express.js + MongoDB + Session Management          │
│  (Controllers, Routes, Middleware, Models, Utils)       │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
             │ Mongoose ODM          │ Web3/Ethers
             │                       │
┌────────────▼───────────┐  ┌───────▼────────────────────┐
│   MongoDB Database      │  │   Ethereum Blockchain      │
│  - Users                │  │  - Smart Contract          │
│  - Portfolios           │  │  - User Registration       │
│  - Transactions         │  │  - On-chain Holdings       │
│  - Borrow Requests      │  │  - Transaction History     │
│  - Watchlists           │  │                            │
└─────────────────────────┘  └────────────────────────────┘
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (or yarn/pnpm)
- **MongoDB**: v6.x or higher (local or MongoDB Atlas)
- **MetaMask**: Browser extension for wallet connectivity
- **Git**: For version control

Optional:
- **Ethereum Node**: Local node (Ganache) or testnet access for smart contract deployment

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Infi-Web-Solutions/Cryptora.git
cd crypto_platform-javascript
```

### 2. Install Backend Dependencies

```bash
cd crypto_backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../crypto_frontend
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `crypto_backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/crypto_platform

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Blockchain Configuration (Optional)
# ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
# PRIVATE_KEY=your-deployment-private-key
# CONTRACT_ADDRESS=your-deployed-contract-address
```

### Frontend Configuration

Create a `.env` file in the `crypto_frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Optional: Blockchain Configuration
# VITE_CONTRACT_ADDRESS=your-deployed-contract-address
# VITE_CHAIN_ID=1
```

### MongoDB Setup

**Option 1: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify MongoDB is running
mongosh
```

**Option 2: MongoDB Atlas**
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGO_URI` in backend `.env` file

## 🚀 Running the Application

### Development Mode

**1. Start MongoDB** (if using local MongoDB)
```bash
mongod
```

**2. Start Backend Server**
```bash
cd crypto_backend
npm run dev
# Server will run on http://localhost:5000
```

**3. Start Frontend Development Server**
```bash
cd crypto_frontend
npm run dev
# Frontend will run on http://localhost:5173
```

**4. Create Admin User** (Optional)

```bash
cd crypto_backend
node create_admin.js
```

### Production Mode

**Backend:**
```bash
cd crypto_backend
npm start
```

**Frontend:**
```bash
cd crypto_frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
crypto_platform-javascript/
├── crypto_backend/                 # Backend service
│   ├── src/
│   │   ├── controllers/            # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── portfolioController.js
│   │   │   ├── borrowController.js
│   │   │   └── ...
│   │   ├── models/                 # MongoDB schemas
│   │   │   ├── User.js
│   │   │   ├── Portfolio.js
│   │   │   ├── Transaction.js
│   │   │   ├── Coin.js
│   │   │   ├── BorrowRequest.js
│   │   │   └── ...
│   │   ├── routes/                 # API routes
│   │   │   ├── auth.js
│   │   │   ├── portfolio.js
│   │   │   ├── trading.js
│   │   │   ├── admin.js
│   │   │   └── ...
│   │   ├── middleware/             # Express middleware
│   │   └── utils/                  # Utility functions
│   ├── smartcontract/
│   │   └── cryptoplatform.sol      # Solidity smart contract
│   ├── server.js                   # Express server entry point
│   ├── package.json
│   └── .env
│
├── crypto_frontend/                # Frontend application
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── Header.tsx
│   │   │   ├── CryptoCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── PriceChart.tsx
│   │   ├── contexts/
│   │   │   └── WalletContext.tsx   # Wallet state management
│   │   ├── pages/                  # Page components
│   │   │   ├── ConnectWallet.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── BuyCoin.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminBorrowRequests.tsx
│   │   │   └── NotFound.tsx
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities
│   │   ├── types/                  # TypeScript types
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── .env
│
└── README.md
```

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Connect Wallet (Login)
```http
POST /api/auth/connect-wallet
Content-Type: application/json

{
  "walletAddress": "0x..."
}

Response: 200 OK
{
  "message": "Wallet connected successfully",
  "user": { ... },
  "sessionId": "..."
}
```

#### Register Wallet on Blockchain
```http
POST /api/auth/register-wallet
Content-Type: application/json

{
  "walletAddress": "0x..."
}

Response: 201 Created
{
  "success": true,
  "transactionHash": "0x..."
}
```

#### Admin Login
```http
POST /api/auth/admin-login
Content-Type: application/json

{
  "walletAddress": "0x...",
  "password": "admin_password"
}
```

#### Logout
```http
POST /api/auth/logout

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

#### Get Current User
```http
GET /api/auth/me

Response: 200 OK
{
  "wallet_address": "0x...",
  "is_staff": false,
  "date_joined": "2024-01-01T00:00:00.000Z"
}
```

### Portfolio Endpoints

#### Get Portfolio
```http
GET /api/portfolio?wallet=0x...

Response: 200 OK
{
  "usdBalance": 10000,
  "borrowedAmount": 0,
  "holdings": [...],
  "totalValue": 10000
}
```

#### Request Virtual USD (Borrow)
```http
POST /api/portfolio/borrow
Content-Type: application/json

{
  "amount": 5000
}

Response: 201 Created
{
  "success": true,
  "message": "Borrow request submitted"
}
```

#### Repay Borrowed Amount
```http
POST /api/portfolio/repay
Content-Type: application/json

{
  "amount": 1000
}

Response: 200 OK
{
  "success": true,
  "remainingDebt": 4000
}
```

### Trading Endpoints

#### Get All Coins
```http
GET /api/trading/coins

Response: 200 OK
[
  {
    "name": "Bitcoin",
    "symbol": "BTC",
    "current_price": 45000,
    "image": "...",
    "price_change_24h": 2.5
  },
  ...
]
```

#### Buy Coin
```http
POST /api/trading/buy
Content-Type: application/json

{
  "symbol": "BTC",
  "quantity": 0.5,
  "price": 45000
}

Response: 200 OK
{
  "success": true,
  "newBalance": 7500
}
```

#### Sell Coin
```http
POST /api/trading/sell
Content-Type: application/json

{
  "symbol": "BTC",
  "quantity": 0.25,
  "price": 46000
}
```

### Transaction Endpoints

#### Get Transaction History
```http
GET /api/transactions/history?wallet=0x...

Response: 200 OK
[
  {
    "txType": "Buy",
    "symbol": "BTC",
    "amount": 0.5,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  ...
]
```

### Admin Endpoints

#### Get Borrow Requests
```http
GET /api/admin/borrow-requests

Response: 200 OK
[
  {
    "user": "0x...",
    "amount": 5000,
    "status": "pending",
    "created_at": "..."
  },
  ...
]
```

#### Approve Borrow Request
```http
POST /api/admin/approve-borrow
Content-Type: application/json

{
  "requestId": "..."
}
```

#### Reject Borrow Request
```http
POST /api/admin/reject-borrow
Content-Type: application/json

{
  "requestId": "..."
}
```

## 🔗 Smart Contract

### Contract Overview

The `CryptoPlatform.sol` smart contract manages on-chain operations:

**Key Features:**
- User registration on blockchain
- Portfolio holdings tracking
- Transaction history recording
- Borrow/repay system
- Watchlist management
- Admin controls

**Main Functions:**

```solidity
// User Registration
function register() external
function adminRegister(address user) external onlyAdmin

// Trading
function buyCoin(string memory symbol, uint256 price, uint256 quantity) external
function sellCoin(string memory symbol, uint256 price, uint256 quantity) external

// Borrowing
function requestVirtualUSD(uint256 amount) external
function approveFunds(address user) external onlyAdmin
function repayBorrowedAmount(uint256 amount) external

// View Functions
function getUSDBalance(address user) external view returns (uint256)
function getUserHoldings(address user) external view returns (string[] memory, uint256[] memory)
function getTransactionHistory() external view returns (Transaction[] memory)

// Watchlist
function addToWatchlist(string memory symbol) external
function removeFromWatchlist(string memory symbol) external
```

### Deployment

1. Install Hardhat or Truffle
2. Configure network in deployment script
3. Deploy contract:

```bash
# Using Hardhat
npx hardhat run scripts/deploy.js --network <network-name>

# Or using Remix IDE
# Copy contract to Remix and deploy via UI
```

4. Update contract address in backend `.env` and frontend `.env`

## 🖥️ Frontend Pages

### Public Pages
- **Connect Wallet** (`/connect-wallet`): Initial landing page for wallet connection
- **Dashboard** (`/dashboard`): Main trading dashboard with live prices
- **Portfolio** (`/portfolio`): User portfolio overview and holdings
- **Transactions** (`/transactions`): Transaction history
- **Buy Coin** (`/buy-coin/:symbol`): Purchase cryptocurrency interface

### Admin Pages
- **Admin Login** (`/admin-login`): Admin authentication
- **Borrow Requests** (`/admin/borrow-requests`): Manage user borrow requests

### Error Pages
- **404 Page** (`*`): Not found page

## 🗄️ Database Schema

### Users Collection
```javascript
{
  wallet_address: String (unique, required),
  is_active: Boolean (default: true),
  is_staff: Boolean (default: false),
  date_joined: Date (default: now),
  password: String (optional, for admin)
}
```

### Portfolios Collection
```javascript
{
  user: ObjectId (ref: 'WalletUser'),
  coin: ObjectId (ref: 'Coin'),
  quantity: Number,
  price: Number,
  total: Number,
  timestamps: true
}
```

### Transactions Collection
```javascript
{
  user: ObjectId (ref: 'WalletUser'),
  type: String (Buy/Sell/Approved/Repay),
  coin: String,
  amount: Number,
  price: Number,
  total: Number,
  timestamp: Date
}
```

### BorrowRequests Collection
```javascript
{
  user: ObjectId (ref: 'WalletUser'),
  amount: Number,
  status: String (pending/approved/rejected),
  created_at: Date,
  updated_at: Date
}
```

### Coins Collection
```javascript
{
  name: String,
  symbol: String (unique),
  coingecko_id: String,
  current_price: Number,
  image: String,
  price_change_24h: Number,
  market_cap: Number,
  total_volume: Number
}
```

### Watchlists Collection
```javascript
{
  user: ObjectId (ref: 'WalletUser'),
  coins: [String],
  timestamps: true
}
```

## 👨‍💻 Development

### Running Tests

```bash
# Backend tests
cd crypto_backend
npm test

# Frontend tests
cd crypto_frontend
npm test
```

### Code Style

The project follows standard JavaScript/TypeScript conventions:

```bash
# Backend linting
cd crypto_backend
npm run lint

# Frontend linting
cd crypto_frontend
npm run lint
```

### Database Utilities

**Clean Database:**
```bash
cd crypto_backend
node clean_db.js
```

**Create Admin User:**
```bash
cd crypto_backend
node create_admin.js
```

**Fix Database Indexes:**
```bash
cd crypto_backend
node fix_index.js
```

## 🚢 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)

1. Set environment variables
2. Ensure MongoDB connection string is configured
3. Deploy:

```bash
# For Heroku
heroku create your-app-name
git push heroku main

# For Railway
railway init
railway up
```

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend:
```bash
cd crypto_frontend
npm run build
```

2. Deploy `dist` folder to hosting service

**Vercel:**
```bash
npm i -g vercel
vercel --prod
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Environment Variables for Production

Ensure all production environment variables are set:
- `NODE_ENV=production`
- `MONGO_URI` (production database)
- `SESSION_SECRET` (strong random string)
- Contract addresses and blockchain URLs

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**Infi Web Solutions**
- GitHub: [@Infi-Web-Solutions](https://github.com/Infi-Web-Solutions)
- Project: Cryptora

## 🙏 Acknowledgments

- shadcn/ui for the beautiful UI components
- CoinGecko API for cryptocurrency data (if used)
- MetaMask for wallet connectivity
- MongoDB for database solutions
- Ethereum community for blockchain standards

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team

---

**🚀 Happy Trading with Cryptora!**
