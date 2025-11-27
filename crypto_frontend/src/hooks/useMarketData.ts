import { useQuery } from '@tanstack/react-query';
import { marketDataApi } from '@/lib/api';

// Hook for global market data
export const useGlobalMarketData = () => {
  return useQuery({
    queryKey: ['globalMarketData'],
    queryFn: marketDataApi.getGlobalData,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
};

// Hook for global historical market data
export const useGlobalHistoricalData = (days: number = 7) => {
  return useQuery({
    queryKey: ['globalHistoricalData', days],
    queryFn: () => marketDataApi.getGlobalHistoricalData(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for historical market data
export const useHistoricalData = (symbol: string, days: number = 7) => {
  return useQuery({
    queryKey: ['historicalData', symbol, days],
    queryFn: () => marketDataApi.getHistoricalData(symbol, days),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for live prices
export const useLivePrices = (symbols: string[]) => {
  return useQuery({
    queryKey: ['livePrices', symbols],
    queryFn: () => marketDataApi.getLivePrices(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

// Hook for top coins
export const useTopCoins = (limit: number, page: number = 1) => {
  return useQuery({
    queryKey: ['topCoins', limit, page],
    queryFn: () => marketDataApi.getTopCoins(limit, page),
  });
};

