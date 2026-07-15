// src/context/WalletContext.jsx
// Student query-token + cash balance, sourced from the real wallet API
// (previously this was entirely mocked state in the old frontend).
import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import walletService from '@/services/wallet.service';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/constants/enums';

export const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const { role, isAuthenticated } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated || role !== ROLES.STUDENT) return;
    setIsLoading(true);
    try {
      const { data } = await walletService.getWallet();
      setWallet(data?.data ?? data);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, role]);

  useEffect(() => {
    if (isAuthenticated && role === ROLES.STUDENT) {
      refreshWallet();
    } else {
      setWallet(null);
    }
  }, [isAuthenticated, role, refreshWallet]);

  const value = useMemo(
    () => ({ wallet, isLoading, refreshWallet, setWallet }),
    [wallet, isLoading, refreshWallet],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export default WalletProvider;
