import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTransactions } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";

const Transactions = () => {
  const { walletAddress, isConnected } = useWallet();
  const [typeFilter, setTypeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Redirect to connect wallet if not connected
  if (!isConnected || !walletAddress) {
    return <Navigate to="/connect-wallet" replace />;
  }

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTransactions(walletAddress);
      if (response.success) {
        setTransactions(response.transactions || []);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on type and date range
  const filteredTransactions = transactions.filter(tx => {
    // Type filter
    if (typeFilter !== "all" && tx.type !== typeFilter) {
      return false;
    }

    // Date filter
    if (startDate || endDate) {
      const txDate = new Date(tx.timestamp).toISOString().split('T')[0];
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
    }

    return true;
  });

  // Format transaction type for display
  const formatType = (type) => {
    const typeMap = {
      'buy': 'Buy',
      'sell': 'Sell',
      'fund': 'Fund',
      'repay': 'Repay',
      'approved': 'Approved'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format timestamp
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format USD value
  const formatUSD = (value) => {
    if (!value) return '$0.00';
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Format quantity
  const formatQuantity = (quantity, symbol) => {
    if (!quantity) return '0.00';
    if (symbol === 'USD') {
      return parseFloat(quantity).toLocaleString();
    }
    return parseFloat(quantity).toFixed(6);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Transaction History</h1>

        <Card className="p-6 bg-card border-border">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="fund">Fund</SelectItem>
                <SelectItem value="repay">Repay</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[180px]"
              placeholder="Start Date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[180px]"
              placeholder="End Date"
            />

            <Button onClick={() => {}} disabled={loading}>
              {loading ? "Loading..." : "Apply Filters"}
            </Button>

            <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading transactions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchTransactions}>Try Again</Button>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transaction available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Buy Price</TableHead>
                      <TableHead>USD Value</TableHead>
                      <TableHead>TxHash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((tx, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(tx.timestamp)}</TableCell>
                        <TableCell>
                          <span className={
                            tx.type === "buy" ? "text-green-600 font-medium" :
                            tx.type === "sell" ? "text-red-600 font-medium" :
                            "text-primary font-medium"
                          }>
                            {formatType(tx.type)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{tx.symbol}</TableCell>
                        <TableCell>{formatQuantity(tx.quantity, tx.symbol)}</TableCell>
                        <TableCell>
                          {tx.buy_price ? formatUSD(tx.buy_price) : '-'}
                        </TableCell>
                        <TableCell className={
                          tx.type === "sell" ? "text-red-600" :
                          tx.type === "buy" ? "text-green-600" :
                          "text-foreground"
                        }>
                          {formatUSD(tx.usd_value)}
                        </TableCell>
                        <TableCell>
                          {tx.tx_hash && tx.tx_hash !== "" ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {tx.tx_hash.substring(0, 10)}...
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Transactions;
