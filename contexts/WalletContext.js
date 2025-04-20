// contexts/WalletContext.js
import React, { createContext, useContext, useMemo } from 'react';
import { useWallet } from '../utils/hooks/useWallet';

// Create context
const WalletContext = createContext(null);

// Provider component
export function WalletProvider({ children }) {
    const walletValues = useWallet();
    const contextValue = useMemo(() => walletValues, [walletValues]);

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    );
}

// Hook for components to consume the context
export function useWalletContext() {
    const context = useContext(WalletContext);

    if (!context) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }

    return context;
}