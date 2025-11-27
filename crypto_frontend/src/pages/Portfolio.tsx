
// export default Portfolio;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import axios from "axios";
import { ethers } from "ethers";
import { recordBuyPrice } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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

interface Holding {
  image: string;
  symbol: string;
  name: string;
  balance: number;
  quantity: number;
  buyPrice: number;
  avgPrice: number;
  livePrice: number;
  totalValue: number;
}

interface PortfolioData {
  success: boolean;
  wallet: string;
  usdBalanceVirtual: number;
  usdBalanceRaw: number;
  borrowed: number;
  watchlist: string[];
  holdings: Holding[];
  filteredHoldings: Holding[];
  contractAddress: string;
}

const Portfolio = () => {
  const navigate = useNavigate();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { walletAddress } = useWallet();
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [isProcessingBorrow, setIsProcessingBorrow] = useState(false);
  const [isProcessingRepay, setIsProcessingRepay] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [quantity, setQuantity] = useState("");
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [isProcessingTrade, setIsProcessingTrade] = useState(false);

  const API_BASE_URL =  'http://localhost:5000';

  const ensureSepolia = async () => {
    const sepoliaIdHex = '0xaa36a7'; // 11155111
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaIdHex }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: sepoliaIdHex,
            chainName: 'Sepolia',
            nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } else {
        throw switchError;
      }
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [walletAddress]);

  const fetchPortfolio = async () => {
    if (!walletAddress) {
      setLoading(false);
      setError("Please connect your wallet to view portfolio");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/portfolio`, {
        params: { wallet: walletAddress },
        withCredentials: true
      });

      setPortfolioData(response.data);
    } catch (err: any) {
      console.error('Error fetching portfolio:', err);
      if (err.response?.status === 401) {
        setError('Please connect your wallet to view portfolio');
        navigate('/connect-wallet');
      } else {
        setError(err.response?.data?.error || 'Failed to load portfolio data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || Number(borrowAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid borrow amount",
        variant: "destructive"
      });
      return;
    }

    if (!window.ethereum || !ethers) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingBorrow(true);

      await ensureSepolia();
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const contractAddress = portfolioData?.contractAddress;
      if (!contractAddress) {
        throw new Error('Contract address not available');
      }

      const abi = [
        { "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}], "name":"requestVirtualUSD", "outputs": [], "stateMutability":"nonpayable", "type":"function" }
      ];
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const cents = Math.floor(Number(borrowAmount) * 100);
      const tx = await contract.requestVirtualUSD(cents);
      await tx.wait();

      toast({
        title: "Success",
        description: `Borrow request submitted for $${borrowAmount}. Transaction hash: ${tx.hash}`
      });

      setBorrowAmount("");

      // Navigate to transactions page to show the transaction
      navigate('/transactions');

    } catch (err: any) {
      console.error('Borrow failed:', err);
      toast({
        title: "Borrow failed",
        description: err?.reason || err?.data?.message || err?.message || "Could not submit borrow request",
        variant: "destructive"
      });
    } finally {
      setIsProcessingBorrow(false);
    }
  };

  const handleRepay = async () => {
    if (!portfolioData?.borrowed || portfolioData.borrowed <= 0) {
      toast({
        title: "No funds to repay",
        description: "You have no borrowed funds.",
        variant: "destructive"
      });
      return;
    }

    if (!window.ethereum || !ethers) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask.",
        variant: "destructive"
      });
      return;
    }

    const amountToRepay = repayAmount ? Number(repayAmount) : portfolioData.borrowed;

    if (amountToRepay <= 0 || amountToRepay > portfolioData.borrowed) {
      toast({
        title: "Invalid amount",
        description: `Please enter an amount between $0.01 and ${portfolioData.borrowed.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingRepay(true);

      await ensureSepolia();
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const contractAddress = portfolioData?.contractAddress;
      if (!contractAddress) {
        throw new Error('Contract address not available');
      }

      const abi = [
        { "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}], "name":"repayBorrowedAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
      ];
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const cents = Math.floor(amountToRepay * 100);
      const tx = await contract.repayBorrowedAmount(cents);
      await tx.wait();

      toast({
        title: "Success",
        description: `Repaid ${amountToRepay.toFixed(2)}`
      });

      setRepayAmount("");

      // Reload portfolio after 3 seconds
      setTimeout(() => {
        fetchPortfolio();
      }, 3000);

    } catch (err: any) {
      console.error('Repay error:', err);
      toast({
        title: "Repayment failed",
        description: err?.reason || err?.data?.message || err?.message || "Could not repay borrowed funds",
        variant: "destructive"
      });
    } finally {
      setIsProcessingRepay(false);
    }
  };

  const openTradeModal = (holding: Holding, mode: 'buy' | 'sell') => {
    setSelectedHolding(holding);
    setTradeMode(mode);
    setQuantity("");
    setModalOpen(true);
  };

  const closeTradeModal = () => {
    setModalOpen(false);
    setSelectedHolding(null);
    setQuantity("");
  };

  const handleTrade = async () => {
    if (!selectedHolding || !quantity || Number(quantity) <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
      return;
    }

    if (!window.ethereum || !ethers) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingTrade(true);

      await ensureSepolia();
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      let tradePrice = selectedHolding.livePrice > 0 ? selectedHolding.livePrice :
                       selectedHolding.avgPrice > 0 ? selectedHolding.avgPrice :
                       selectedHolding.buyPrice;
      if (tradePrice === 0 && (selectedHolding.symbol === 'USDC' || selectedHolding.symbol === 'USDT')) {
        tradePrice = 1.0;
      }
      const priceCents = Math.floor(tradePrice * 100);
      const qty = Math.floor(Number(quantity));

      let tx;
      if (tradeMode === 'buy') {
        tx = await contract.buyCoin(selectedHolding.symbol, priceCents, qty);
      } else {
        tx = await contract.sellCoin(selectedHolding.symbol, priceCents, qty);
      }

      await tx.wait();

      // Record to backend
      await recordBuyPrice({
        symbol: selectedHolding.symbol,
        price: selectedHolding.livePrice,
        quantity: Number(quantity),
        type: tradeMode,
        tx_hash: tx.hash,
        wallet_address: walletAddress!
      });

      toast({
        title: "Success",
        description: `${tradeMode === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${selectedHolding.symbol}`
      });

      closeTradeModal();

      // Reload portfolio after 3 seconds
      setTimeout(() => {
        fetchPortfolio();
      }, 3000);

    } catch (err: any) {
      console.error('Trade error:', err);
      toast({
        title: "Trade failed",
        description: err?.reason || err?.data?.message || err?.message || "Could not complete trade",
        variant: "destructive"
      });
    } finally {
      setIsProcessingTrade(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Your Portfolio</h1>
          <Button onClick={fetchPortfolio} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Portfolio'}
          </Button>
        </div>
        
        {/* Wallet Info */}
        <Card className="p-6 mb-6 bg-card border-border">
          {loading ? (
            <p>Loading portfolio...</p>
          ) : error ? (
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchPortfolio} variant="outline">
                Retry
              </Button>
            </div>
          ) : portfolioData ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-1">Wallet:</p>
                <p className="text-sm font-mono">{portfolioData.wallet}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-foreground mb-1">USD Balance:</p>
                <p className="text-2xl font-bold text-success">${portfolioData.usdBalanceVirtual.toFixed(2)}</p>
              </div>
              {portfolioData.borrowed > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-muted-foreground mb-2">Borrowed Amount:</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    ${portfolioData.borrowed.toFixed(2)}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </Card>
        
        {/* Portfolio Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Portfolio Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-secondary border-border">
              <p className="text-sm text-muted-foreground mb-2">Total Holdings Value</p>
              <p className="text-4xl font-bold text-success">
                ${portfolioData ? portfolioData.holdings.reduce((sum, h) => {
                  const price = h.livePrice > 0 ? h.livePrice : h.avgPrice > 0 ? h.avgPrice : h.buyPrice;
                  return sum + (h.quantity * price);
                }, 0).toFixed(2) : '0.00'}
              </p>
            </Card>
            <Card className="p-6 bg-secondary border-border">
              <p className="text-sm text-muted-foreground mb-2">Total Number of Assets</p>
              <p className="text-4xl font-bold">{portfolioData ? portfolioData.holdings.length : 0}</p>
            </Card>
          </div>
        </div>

        {/* USD Balance and Borrow/Repay */}
        <Card className="p-6 mb-6 bg-muted">
          <div className="flex justify-between items-center mb-4">
            <strong>USD Balance:</strong>
            <span className="text-green-500 text-xl font-semibold">
              ${portfolioData?.usdBalanceVirtual?.toFixed(2) ?? "0.00"}
            </span>
          </div>

          {portfolioData?.borrowed && portfolioData.borrowed > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4  dark:bg-yellow-900/30 rounded-lg">
                <span className="font-medium">Outstanding Debt:</span>
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                  ${portfolioData.borrowed.toFixed(2)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    placeholder={`Amount (max ${portfolioData.borrowed.toFixed(2)})`}
                    min="0.01"
                    max={portfolioData.borrowed}
                    step="0.01"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <Button
                  onClick={handleRepay}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                  disabled={isProcessingRepay}
                >
                  {isProcessingRepay ? "Processing..." : `Repay ${repayAmount ? `${repayAmount}` : 'All'}`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Borrow virtual USD to trade cryptocurrencies. Admin approval required.
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Enter amount to borrow"
                  min="1"
                  step="1"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleBorrow} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isProcessingBorrow}
                >
                  {isProcessingBorrow ? "Processing..." : "Request Borrow"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Your borrow request will be pending until approved by an admin.
              </p>
            </div>
          )}
        </Card>
        
        {/* Holdings Breakdown */}
        {portfolioData && portfolioData.holdings.length > 0 && (
          <Card className="p-6 mb-8 bg-card border-border">
            <h2 className="text-xl font-bold mb-6">Holdings Breakdown</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioData.holdings.map(holding => ({
                        name: holding.symbol,
                        value: holding.totalValue,
                        quantity: holding.quantity,
                        price: holding.livePrice > 0 ? holding.livePrice : holding.avgPrice > 0 ? holding.avgPrice : holding.buyPrice
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {portfolioData.holdings.map((entry, index) => {
                        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `$${value.toFixed(2)} (${props.payload.quantity.toFixed(4)} ${name})`,
                        'Value'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

            </div>
          </Card>
        )}
        
        {/* Your Holdings Table */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-bold mb-6">Your Holdings</h2>
          <div className="overflow-x-auto">
            {loading ? (
              <p>Loading holdings...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : portfolioData && portfolioData.holdings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Logo</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Last Buy Price</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>Live Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioData.holdings.map((holding, index) => (
                    <TableRow key={holding.symbol}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <img 
                          src={holding.image || 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'} 
                          alt={holding.name} 
                          className="w-8 h-8 rounded-full" 
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{holding.symbol}</TableCell>
                      <TableCell>{holding.name}</TableCell>
                      <TableCell className="text-success">${holding.buyPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-yellow-600">${holding.avgPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-success font-semibold">${holding.livePrice.toFixed(2)}</TableCell>
                      <TableCell>{holding.quantity.toFixed(4)}</TableCell>
                      <TableCell className="text-success font-semibold">${holding.totalValue.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openTradeModal(holding, 'buy')}
                            className="bg-success hover:bg-success/90"
                            disabled={isProcessingTrade}
                          >
                            Buy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openTradeModal(holding, 'sell')}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isProcessingTrade}
                          >
                            Sell
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No holdings found.</p>
                <Button onClick={() => navigate('/dashboard')}>
                  Explore Coins
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Trade Modal */}
        {modalOpen && selectedHolding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background text-foreground p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h5 className="text-xl font-bold mb-4">
                {tradeMode === 'buy' ? 'Buy' : 'Sell'} {selectedHolding.name} ({selectedHolding.symbol})
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
                <div className="p-2  dark:bg-gray-800 rounded-md">
                  <label className="block text-sm font-medium mb-1">Price per unit:</label>
                  <div className="text-lg font-bold">
                    ${(() => {
                      let price = selectedHolding.livePrice > 0 ? selectedHolding.livePrice :
                                  selectedHolding.avgPrice > 0 ? selectedHolding.avgPrice :
                                  selectedHolding.buyPrice;
                      if (price === 0 && (selectedHolding.symbol === 'USDC' || selectedHolding.symbol === 'USDT')) {
                        price = 1.0;
                      }
                      return price.toFixed(2);
                    })()}
                  </div>
                </div>
                <div className="p-2  dark:bg-gray-800 rounded-md">
                  <label className="block text-sm font-medium mb-1">Total Price (USD):</label>
                  <div className="text-lg font-bold">
                    ${(() => {
                      let price = selectedHolding.livePrice > 0 ? selectedHolding.livePrice :
                                  selectedHolding.avgPrice > 0 ? selectedHolding.avgPrice :
                                  selectedHolding.buyPrice;
                      if (price === 0 && (selectedHolding.symbol === 'USDC' || selectedHolding.symbol === 'USDT')) {
                        price = 1.0;
                      }
                      return (Number(quantity) * price).toFixed(2);
                    })()}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeTradeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingTrade}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isProcessingTrade ? 'Processing...' : 'Confirm'}
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

export default Portfolio;
