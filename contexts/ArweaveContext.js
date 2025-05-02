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
    saveWalletToLocalStorage
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
                            showSuccessMessage('Arweave storage initialized from saved wallet');
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
            if (isInitialized) {
                return true;
            }

            const success = await initializeStorage(wallet);

            if (success) {
                setIsInitialized(true);
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);

                // Save wallet to local storage for development convenience
                if (process.env.NODE_ENV === 'development') {
                    saveWalletToLocalStorage(wallet);
                }

                showSuccessMessage('Arweave storage initialized successfully');
            } else {
                setError('Failed to initialize Arweave storage');
            }

            return success;
        } catch (err) {
            console.error('Error initializing Arweave storage:', err);
            setError(err.message || 'Failed to initialize Arweave storage');
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
                throw new Error('Arweave storage not initialized');
            }

            const formattedMetadata = formatCertificateMetadata(certificateData);
            const txId = await storeCertificateMetadata(formattedMetadata);

            showSuccessMessage(`Certificate stored successfully with ID: ${txId}`);

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
    }, []);

    // Generate a test wallet
    const generateTestWallet = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // This will create a new wallet and initialize storage with it
            const success = await initialize();

            if (success) {
                showSuccessMessage('Test wallet generated and storage initialized');
            } else {
                throw new Error('Failed to generate test wallet');
            }

            return success;
        } catch (err) {
            console.error('Error generating test wallet:', err);
            setError(err.message || 'Failed to generate test wallet');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [initialize]);

    // Reset state
    const resetState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Create the context value
    const value = {
        isInitialized,
        isLoading,
        error,
        walletAddress,
        successMessage,
        initialize,
        storeCertificate,
        retrieveCertificate,
        generateTestWallet,
        resetState,
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