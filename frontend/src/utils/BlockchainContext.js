// frontend/src/utils/BlockchainContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { connectWallet, createContract, getUserRoles, initializeProvider } from './blockchain-clean';

export const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainContext.Provider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userRoles, setUserRoles] = useState({
    isAdmin: false,
    isProcessor: false,
    isDistributor: false,
    isRetailer: false,
    hasAnyRole: false
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const disconnect = useCallback(async () => {
    console.log('🔌 [CONTEXT] Disconnecting wallet...');
    setAccount('');
    setSigner(null);
    setIsConnected(false);
    setUserRoles({ isAdmin: false, isProcessor: false, isDistributor: false, isRetailer: false, hasAnyRole: false });

    try {
      const init = await initializeProvider();
      if (init && init.provider) setProvider(init.provider);
      if (init && init.contract) setContract(init.contract);
    } catch (err) {
      console.warn('⚠️ [CONTEXT] Failed to restore read-only provider:', err.message || err);
      setProvider(null);
      setContract(null);
    }
    toast.info('Wallet disconnected');
  }, []);

  const connectToWallet = useCallback(async () => {
    console.log('🚀 [CONTEXT] Starting wallet connection process...');
    setIsLoading(true);
    try {
      const { provider, signer, account } = await connectWallet();
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setIsConnected(true);

      const contractInstance = createContract(provider, signer);
      setContract(contractInstance);

      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('❌ [CONTEXT] Failed to connect wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        connectToWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    // This runs only once on component mount
    const initialize = async () => {
        try {
            const init = await initializeProvider();
            if (init && init.provider) setProvider(init.provider);
            if (init && init.contract) setContract(init.contract);
        } catch (err) {
            console.warn('⚠️ [CONTEXT] Read-only initialization failed:', err.message);
        }
        setIsLoading(false);
    };
    
    initialize();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [connectToWallet, disconnect]); // <-- THIS IS THE FIX. We only want to re-run this if these functions change, which they won't.

  const loadUserRoles = useCallback(async () => {
    if (contract && account) {
        try {
          const roles = await getUserRoles(contract, account);
          setUserRoles(roles);
        } catch (error) {
          console.error('Failed to load user roles:', error);
          setUserRoles({ isAdmin: false, isProcessor: false, isDistributor: false, isRetailer: false, hasAnyRole: false });
        }
    }
  }, [contract, account]);

  useEffect(() => {
    loadUserRoles();
  }, [loadUserRoles]);

  const value = {
    account,
    provider,
    signer,
    contract,
    userRoles,
    isConnected,
    isLoading,
    connectToWallet,
    disconnect,
    loadUserRoles
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};