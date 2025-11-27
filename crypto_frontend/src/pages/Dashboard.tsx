import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import CryptoCard from "@/components/CryptoCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGlobalMarketData, useGlobalHistoricalData, useLivePrices, useTopCoins } from "@/hooks/useMarketData";
import { useDashboard } from "@/hooks/useDashboard";
import { useWallet } from "@/contexts/WalletContext";
import { Navigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("1D");
  const [page, setPage] = useState(1);
  const [allCoins, setAllCoins] = useState<any[]>([]);

  const timeRanges = ["1D", "7D", "14D", "1M", "3M", "1Y", "3Y", "5Y", "Max"];

  const { walletAddress, isConnected } = useWallet();

  // Redirect to connect wallet if not connected
  if (!isConnected || !walletAddress) {
    return <Navigate to="/connect-wallet" replace />;
  }

  // Fetch real market data
  const { data: globalMarketData, isLoading: globalLoading, error: globalError } = useGlobalMarketData();
  const { data: globalHistoricalData, isLoading: globalHistoricalLoading, error: globalHistoricalError } = useGlobalHistoricalData(
    timeRange === "1D" ? 1 : timeRange === "7D" ? 7 : timeRange === "14D" ? 14 : timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : timeRange === "1Y" ? 365 : timeRange === "3Y" ? 1095 : timeRange === "5Y" ? 1825 : 1825
  );
  const { data: newCoins, isLoading: topCoinsLoading, error: topCoinsError } = useTopCoins(9, page);
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboard(walletAddress);

  // Append new coins to allCoins
  useEffect(() => {
    if (newCoins && newCoins.length > 0) {
      setAllCoins(prev => [...prev, ...newCoins]);
    }
  }, [newCoins]);

  // Format market cap
  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  // Format percentage change
  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Transform top coins data for CryptoCard
  const cryptoData = allCoins?.map((coin: any) => ({
    image: coin.image,
    symbol: coin.symbol,
    pair: "USDT Pair",
    price: `$${coin.current_price?.toFixed(coin.current_price < 1 ? 4 : 2) || '0.00'}`,
    change: formatChange(coin.price_change_percentage_24h || 0),
    volume: formatMarketCap(coin.total_volume || 0)
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Your Balance"
            value={dashboardLoading ? "Loading..." : dashboardError ? "Error loading" : `$${dashboardData?.user_data?.virtual_balance?.toFixed(2) || '0.00'}`}
          />
          <StatCard
            title="Your Profit"
            value={dashboardLoading ? "Loading..." : dashboardError ? "Error loading" : `$${dashboardData?.user_data?.portfolio_summary?.total_income?.toFixed(6) || '0.000000'}`}
          />
          <StatCard
            title="Total Holdings Value"
            value={dashboardLoading ? "Loading..." : dashboardError ? "Error loading" : `$${dashboardData?.user_data?.holdings?.reduce((sum: number, h: any) => {
              const price = h.live_price > 0 ? h.live_price : h.avgPrice > 0 ? h.avgPrice : h.buyPrice;
              return sum + (h.amount * price);
            }, 0)?.toFixed(2) || '0.00'}`}
          />
          <StatCard
            title="Borrowed Amount"
            value={dashboardLoading ? "Loading..." : dashboardError ? "Error loading" : `$${dashboardData?.user_data?.borrowed_amount?.toFixed(2) || '0.00'}`}
          />
        </div>



        {/* Market Overview Chart */}
        <Card className="p-6 mb-8 bg-card border-border">
          <h2 className="text-2xl font-bold mb-6">Crypto Market Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Market Cap</p>
              <p className="text-2xl font-bold">
                {globalLoading ? 'Loading...' : globalError ? 'Error' : formatMarketCap(globalMarketData?.total_market_cap || 0)}
              </p>
              <p className={`text-sm ${globalMarketData?.market_cap_change_percentage_24h >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {globalLoading ? '--' : globalError ? '--' : formatChange(globalMarketData?.market_cap_change_percentage_24h || 0)} 24h change
              </p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-2xl font-bold">
                {globalLoading ? 'Loading...' : globalError ? 'Error' : formatMarketCap(globalMarketData?.total_volume || 0)}
              </p>
              <p className="text-sm text-muted-foreground">--% vs yesterday</p>
            </div>
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">BTC Dominance</p>
              <p className="text-2xl font-bold">
                {globalLoading ? 'Loading...' : globalError ? 'Error' : `${globalMarketData?.market_cap_percentage?.btc?.toFixed(1) || '0.0'}%`}
              </p>
              <p className="text-sm text-muted-foreground">--% 24h change</p>
            </div>
          </div>

          <div className="bg-secondary p-6 rounded-lg">
            <h3 className="text-center text-lg mb-4">Total Crypto Market Cap</h3>

            {/* Line Chart */}
            <div className="h-80 mb-4">
              {globalHistoricalData && !globalHistoricalLoading && !globalHistoricalError ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={globalHistoricalData.market_caps.map(([timestamp, value]) => ({
                      date: timestamp,
                      value: value
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af"
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      tickFormatter={(value) => formatMarketCap(value)}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
                      formatter={(value: number) => [formatMarketCap(value), 'Market Cap']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    {globalHistoricalLoading ? 'Loading chart data...' : 'Failed to load chart data'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 flex-wrap">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Traded Cryptocurrencies */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Traded Cryptocurrencies</h2>
            <p className="text-sm text-muted-foreground">Auto-updates every 30s</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {topCoinsLoading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-secondary p-4 rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              ))
            ) : topCoinsError ? (
              <div className="col-span-full text-center text-destructive">
                Failed to load top coins data. Please try again later.
              </div>
            ) : (
              cryptoData.map((crypto) => (
                <CryptoCard key={crypto.symbol} {...crypto} />
              ))
            )}
          </div>

          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setPage(prev => prev + 1)}
            >
              Show More Coins
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;