import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

// Hook for dashboard data
export const useDashboard = (walletAddress?: string) => {
  return useQuery({
    queryKey: ['dashboard', walletAddress],
    queryFn: () => dashboardApi.getDashboard(walletAddress),
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });
};

// Hook for portfolio data
export const usePortfolio = (walletAddress?: string) => {
  return useQuery({
    queryKey: ['portfolio', walletAddress],
    queryFn: () => dashboardApi.getPortfolio(walletAddress),
    enabled: !!walletAddress,
    refetchInterval: 30000,
    staleTime: 25000,
  });
};
