import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect } from "react";
import { marketDataApi } from "../lib/api";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  priceChange: number;
}

const PriceChart = ({ symbol, currentPrice, priceChange }: PriceChartProps) => {
  const [chartData, setChartData] = useState<{ time: string; price: number }[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | string>(1);
  const [loading, setLoading] = useState(false);

  const periods = [
    { label: "Today", days: 1 },
    { label: "7D", days: 7 },
    { label: "14D", days: 14 },
    { label: "1M", days: 30 },
    { label: "3M", days: 90 },
    { label: "1Y", days: 365 },
    { label: "3Y", days: 1095 },
    { label: "5Y", days: 1825 },
    { label: "Max", days: "max" },
  ];

  useEffect(() => {
    fetchChartData(selectedPeriod);
  }, [symbol, selectedPeriod]);

  const fetchChartData = async (days: number | string) => {
    setLoading(true);
    try {
      const data = await marketDataApi.getHistoricalData(symbol, days as number);
      if (data && data.prices) {
        const formattedData = data.prices.map(([timestamp, price]: [number, number]) => ({
          time: new Date(timestamp).toLocaleDateString(),
          price: Number(price.toFixed(4))
        }));
        setChartData(formattedData);
      } else {
        // Fallback to sample data
        setChartData(generateSampleData());
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
      setChartData(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    const data = [];
    const basePrice = currentPrice || 0.87;
    const points = 100;

    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * 0.03;
      const price = basePrice + variation + (Math.sin(i / 10) * 0.01);
      data.push({
        time: `${i}`,
        price: Number(price.toFixed(4))
      });
    }
    return data;
  };

  return (
    <div className="stat-card bg-gradient-to-br from-card to-secondary/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-muted-foreground text-sm mb-2">{symbol} Price Chart</h3>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-foreground">${currentPrice.toFixed(4)}</span>
            <span className={`badge ${priceChange >= 0 ? 'badge-positive' : 'badge-negative'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {periods.find(p => p.days === selectedPeriod)?.label || 'Today'}
        </div>
      </div>

      <div className="h-[400px] w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                hide
              />
              <YAxis
                domain={['dataMin - 0.01', 'dataMax + 0.01']}
                hide
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--chart-primary))"
                strokeWidth={2}
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {periods.map((period) => (
          <button
            key={period.days}
            onClick={() => setSelectedPeriod(period.days)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              selectedPeriod === period.days
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PriceChart;
