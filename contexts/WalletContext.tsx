// contexts/WalletContext.tsx
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useWallet } from '../utils/hooks/useWallet';

// Types and Interfaces
export type ErrorType = 'user-rejected' | 'network' | 'generic';

export interface WalletContextValue {
    // Wallet state
    address: string | undefined;
    isConnected: boolean;
    isConnecting: boolean;
    isIssuer: boolean;
    
    // Connection methods
    connect: () => Promise<void>;
    disconnect: () => void;
    
    // Network methods
    networkSupported: boolean;
    switchNetwork: () => Promise<void>;
    checkNetwork: () => Promise<void>;
    checkIsIssuer: () => Promise<void>;
    
    // Error handling
    error: string | null;
    showErrorNotification: boolean;
    errorMessage: string;
    errorType: ErrorType;
    dismissError: () => void;
}

export interface WalletProviderProps {
    children: ReactNode;
}

// Create context
const WalletContext = createContext<WalletContextValue | null>(null);

// Provider component
export function WalletProvider({ children }: WalletProviderProps) {
    const walletValues = useWallet();
    const contextValue = useMemo(() => walletValues, [walletValues]);

    return (
        <WalletContext.Provider value={contextValue}>
            {children}
        </WalletContext.Provider>
    );
}

// Hook for components to consume the context
export function useWalletContext(): WalletContextValue {
    const context = useContext(WalletContext);

    if (!context) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }

    return context;
}