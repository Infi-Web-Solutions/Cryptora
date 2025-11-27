import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(() => localStorage.getItem('walletAddress'));

  const connectWallet = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem('walletAddress', address);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem('walletAddress');
  };

  const value: WalletContextType = {
    walletAddress,
    isConnected: !!walletAddress,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
