                                 import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/contexts/WalletContext";
import ConnectWallet from "./pages/ConnectWallet";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import Transactions from "./pages/Transactions";
import AdminLogin from "./pages/AdminLogin";
import AdminBorrowRequests from "./pages/AdminBorrowRequests";
import NotFound from "./pages/NotFound";
import BuyCoin from "./pages/BuyCoin";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isConnected } = useWallet();

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isConnected ? "/dashboard" : "/connect-wallet"} replace />} />
      <Route path="/connect-wallet" element={<ConnectWallet />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin/borrow-requests" element={<AdminBorrowRequests />} />
      <Route path="/buy-coin/:symbol" element={<BuyCoin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
