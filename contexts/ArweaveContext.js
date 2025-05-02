// contexts/ArweaveContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
    initializeStorage,
    isStorageInitialized,
    storeCertificateMetadata,
    retrieveCertificateMetadata,
    formatCertificateMetadata,
    getCurrentWalletAddress,
    loadWalletFromLocalStorage,
    saveWalletToLocalStorage,
    getTransactionStatus,
    getGatewayUrl
} from '../utils/storage/arweaveStorage';

// Create context
const ArweaveContext = createContext(null);

// Provider component
export function ArweaveProvider({ children }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [pendingTxs, setPendingTxs] = useState([]);

    // Check initial storage state
    useEffect(() => {
        const checkStorage = async () => {
            const initialized = isStorageInitialized();
            setIsInitialized(initialized);

            if (initialized) {
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
            }
        };

        checkStorage();
    }, []);

    // Try to load wallet from local storage on mount
    useEffect(() => {
        const loadSavedWallet = async () => {
            if (!isInitialized && typeof window !== 'undefined') {
                const savedWallet = loadWalletFromLocalStorage();

                if (savedWallet) {
                    try {
                        setIsLoading(true);
                        const success = await initializeStorage(savedWallet);
                        setIsInitialized(success);

                        if (success) {
                            const address = await getCurrentWalletAddress();
                            setWalletAddress(address);
                            showSuccessMessage('AR.io wallet initialized from saved wallet');
                        }
                    } catch (err) {
                        console.error('Error loading saved wallet:', err);
                    } finally {
                        setIsLoading(false);
                    }
                }
            }
        };

        loadSavedWallet();
    }, []);

    // Monitor pending transactions
    useEffect(() => {
        if (pendingTxs.length === 0) {
            return;
        }

        const checkTxStatus = async () => {
            const updatedPendingTxs = [...pendingTxs];
            let changed = false;

            for (let i = 0; i < updatedPendingTxs.length; i++) {
                const tx = updatedPendingTxs[i];

                try {
                    const status = await getTransactionStatus(tx.id);

                    if (status.confirmed) {
                        // Transaction confirmed, remove from pending
                        updatedPendingTxs.splice(i, 1);
                        i--;
                        changed = true;

                        showSuccessMessage(`Transaction ${tx.id.substring(0, 8)}... confirmed!`);
                    } else if (status.status && status.status !== tx.status) {
                        // Status changed but not confirmed
                        updatedPendingTxs[i] = { ...tx, status: status.status };
                        changed = true;
                    }
                } catch (err) {
                    console.warn(`Error checking status for tx ${tx.id}:`, err);
                }
            }

            if (changed) {
                setPendingTxs(updatedPendingTxs);
            }
        };

        // Check immediately and then every 30 seconds
        checkTxStatus();
        const interval = setInterval(checkTxStatus, 30000);

        return () => clearInterval(interval);
    }, [pendingTxs]);

    // Helper for showing temporary success messages
    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Initialize Arweave storage with wallet
    const initialize = useCallback(async (wallet) => {
        setIsLoading(true);
        setError(null);

        try {
            // If already initialized, just return success
            if (isInitialized) {
                return true;
            }

            const success = await initializeStorage(wallet);

            if (success) {
                setIsInitialized(true);
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);

                showSuccessMessage('AR.io wallet initialized successfully');
                return true;
            } else {
                setError('Failed to initialize AR.io wallet');
                return false;
            }
        } catch (err) {
            console.error('Error initializing AR.io wallet:', err);
            setError(err.message || 'Failed to initialize AR.io wallet');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Store certificate metadata
    const storeCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!isInitialized) {
                throw new Error('AR.io wallet not initialized');
            }

            // Format metadata
            const formattedMetadata = formatCertificateMetadata(certificateData);

            // Store on AR.io testnet
            const txId = await storeCertificateMetadata(formattedMetadata);

            // Add to pending transactions
            setPendingTxs(prev => [...prev, {
                id: txId,
                type: 'certificate',
                timestamp: Date.now(),
                status: 'pending'
            }]);

            showSuccessMessage(`Certificate stored with ID: ${txId}`);

            return {
                success: true,
                txId,
                arweaveUri: `ar://${txId}`,
                metadata: formattedMetadata
            };
        } catch (err) {
            console.error('Error storing certificate:', err);
            setError(err.message || 'Failed to store certificate');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Retrieve certificate metadata
    const retrieveCertificate = useCallback(async (arweaveIdOrUri) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!isInitialized) {
                throw new Error('AR.io wallet not initialized');
            }

            const metadata = await retrieveCertificateMetadata(arweaveIdOrUri);

            return {
                success: true,
                metadata
            };
        } catch (err) {
            console.error('Error retrieving certificate:', err);
            setError(err.message || 'Failed to retrieve certificate');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Reset state
    const resetState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Disconnect wallet
    const disconnectWallet = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('verichain_arweave_wallet');
        }

        setIsInitialized(false);
        setWalletAddress(null);

        showSuccessMessage('AR.io wallet disconnected');
    }, []);

    // Create the context value
    const value = {
        isInitialized,
        isLoading,
        error,
        walletAddress,
        successMessage,
        pendingTxs,
        initialize,
        storeCertificate,
        retrieveCertificate,
        resetState,
        disconnectWallet,
        formatCertificateMetadata
    };

    return (
        <ArweaveContext.Provider value={value}>
            {children}
        </ArweaveContext.Provider>
    );
}

// Hook for components to consume the context
export function useArweave() {
    const context = useContext(ArweaveContext);

    if (!context) {
        throw new Error('useArweave must be used within an ArweaveProvider');
    }

    return context;
}