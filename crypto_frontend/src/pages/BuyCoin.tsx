import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import PriceChart from "@/components/PriceChart";
import { getPortfolio, getCoinDetails, recordBuyPrice } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x5C031Ed9b2D585c9391c885616C1D340d8774BbB";

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

const BuyCoin = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { walletAddress, isConnected } = useWallet();

  // Redirect to connect wallet if not connected
  if (!isConnected || !walletAddress) {
    return <Navigate to="/connect-wallet" replace />;
  }

  const [coinData, setCoinData] = useState<any>(null);
  const [quantity, setQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');

  // Fetch coin details
  const fetchCoinDetails = async () => {
    try {
      const data = await getCoinDetails(symbol);
      setCoinData(data);
    } catch (error) {
      toast({ title: "Error fetching coin details", description: error.message, variant: "destructive" });
    }
  };

  // Fetch user portfolio to get balance
  const fetchBalance = async () => {
    try {
      const portfolio = await getPortfolio(walletAddress);
      setBalance(portfolio.usd_balance_virtual || 0);
    } catch (error) {
      toast({ title: "Error fetching balance", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchCoinDetails();
    fetchBalance();
  }, [symbol]);

  useEffect(() => {
    const qty = parseFloat(quantity);
    if (!isNaN(qty) && coinData?.current_price) {
      setTotalPrice(qty * coinData.current_price);
    } else {
      setTotalPrice(0);
    }
  }, [quantity, coinData]);

  const openModal = (mode: 'buy' | 'sell') => {
    setTradeMode(mode);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleTrade = async () => {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid quantity", variant: "destructive" });
      return;
    }

    // Balance check removed - contract will enforce balance requirement

    setLoading(true);
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      // Switch to Sepolia
      try {
        await provider.send("wallet_switchEthereumChain", [{ chainId: "0xaa36a7" }]);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0xaa36a7",
            chainName: "Sepolia",
            nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
          }]);
        } else {
          throw switchError;
        }
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const priceCents = Math.floor(coinData.current_price * 100);

      let tx;
      if (tradeMode === 'buy') {
        tx = await contract.buyCoin(coinData.symbol, priceCents, Math.floor(qty));
      } else {
        tx = await contract.sellCoin(coinData.symbol, priceCents, Math.floor(qty));
      }

      await tx.wait();

      // Record to backend
      await recordBuyPrice({
        symbol: coinData.symbol,
        price: coinData.current_price,
        quantity: qty,
        type: tradeMode,
        tx_hash: tx.hash,
        wallet_address: walletAddress
      });

      toast({ title: "Success", description: `${tradeMode === 'buy' ? 'Bought' : 'Sold'} ${qty} ${coinData.symbol}` });
      closeModal();
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Trade failed:', error);
      toast({ title: "Trade failed", description: error.reason || error.message || "Failed to complete trade", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!coinData) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-0">{coinData.name} <span className="text-muted-foreground">({coinData.symbol})</span></h2>
            <p className="text-sm text-muted-foreground">Live market data from Binance</p>
          </div>
          <img src={coinData.image} alt={coinData.name} className="w-16 h-16 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <StatCard title="Current Price">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-green-500">${coinData.current_price.toFixed(2)}</span>
              <span className={`text-sm px-2 py-1 rounded-full ${coinData.price_change_24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {coinData.price_change_24h.toFixed(2)}%
              </span>
            </div>
          </StatCard>

          <StatCard title="Market Cap">
            <div className="text-2xl font-bold text-green-500 mb-1">{coinData.market_cap_display}</div>
            <p className="text-sm text-muted-foreground">Total USD value</p>
          </StatCard>

          <StatCard title="24h Range">
            <div className="space-y-1">
              <p className="text-sm">High: <span className="text-green-500">${coinData.high_24h.toFixed(2)}</span></p>
              <p className="text-sm">Low: <span className="text-red-500">${coinData.low_24h.toFixed(2)}</span></p>
            </div>
          </StatCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard title="Circulating Supply">
            <div className="text-2xl font-bold">{coinData.circulating_supply?.toLocaleString()}</div>
          </StatCard>

          <StatCard title="Total Supply">
            <div className="text-2xl font-bold">{coinData.total_supply?.toLocaleString()}</div>
          </StatCard>
        </div>

        {/* Price Chart */}
        <div className="mb-6">
          <PriceChart symbol={coinData.symbol} currentPrice={coinData.current_price} priceChange={coinData.price_change_24h} />
        </div>

        {/* Trade Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <button 
            onClick={() => openModal('buy')} 
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Buy
          </button>
          <button 
            onClick={() => openModal('sell')} 
            className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sell
          </button>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background text-foreground p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h5 className="text-xl font-bold mb-4">
                {tradeMode === 'buy' ? 'Buy' : 'Sell'} {coinData.name}
              </h5>
              <form onSubmit={(e) => { e.preventDefault(); handleTrade(); }} className="space-y-4">
                <div>
                  <label htmlFor="quantityInput" className="block text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    id="quantityInput"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="p-2 bg-gray-100 rounded-md">
                  <label className="block text-sm font-medium mb-1">Total Price (USD):</label>
                  <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Processing...' : 'Confirm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BuyCoin;
