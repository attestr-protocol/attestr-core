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
    getGatewayUrl,
    disconnectWallet,
    isWalletExtensionAvailable
} from '../utils/storage/arweaveStorage';
import {
    initializeARIO,
    getARIOClient,
    requestTestnetTokens,
    setupCaptchaListener
} from '../utils/storage/arIOClient';

// Create context
const ArweaveContext = createContext(null);

// Provider component
export function ArweaveProvider({ children }) {
    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [pendingTxs, setPendingTxs] = useState([]);
    const [captchaWindow, setCaptchaWindow] = useState(null);
    const [walletType, setWalletType] = useState(null);

    // Check initial storage state on mount
    useEffect(() => {
        const checkStorage = async () => {
            const initialized = isStorageInitialized();
            setIsInitialized(initialized);

            if (initialized) {
                try {
                    const address = await getCurrentWalletAddress();
                    setWalletAddress(address);
                } catch (err) {
                    console.warn('Could not get current wallet address:', err);
                }
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
                        const success = await initializeStorage(savedWallet, 'jwk');
                        setIsInitialized(success);

                        if (success) {
                            const address = await getCurrentWalletAddress();
                            setWalletAddress(address);
                            setWalletType('jwk');
                            showSuccessMessage('Arweave wallet initialized from saved wallet');
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
    const initialize = useCallback(async (wallet, type = 'jwk') => {
        setIsLoading(true);
        setError(null);

        try {
            // If already initialized, just return success
            if (isInitialized) {
                return true;
            }

            const success = await initializeStorage(wallet, type);

            if (success) {
                setIsInitialized(true);
                setWalletType(type);

                const address = await getCurrentWalletAddress();
                setWalletAddress(address);

                showSuccessMessage(`Arweave wallet (${type}) initialized successfully`);
                return true;
            } else {
                setError('Failed to initialize Arweave wallet');
                return false;
            }
        } catch (err) {
            console.error('Error initializing Arweave wallet:', err);
            setError(err.message || 'Failed to initialize Arweave wallet');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized]);

    // Initialize with ArConnect
    const initializeWithArConnect = useCallback(async () => {
        if (!isWalletExtensionAvailable('arconnect')) {
            setError('ArConnect (Wander) extension not detected. Please install it first.');
            return false;
        }

        return await initialize(null, 'arconnect');
    }, [initialize]);

    // Generate a test wallet for demo purposes
    const generateTestWallet = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // For the demo, we'll first connect to AR.IO testnet without a wallet
            // Then request tokens for testing
            await initializeARIO();

            // Generate a random wallet address for demo - in real implementation
            // we would use a proper wallet, but for demo we'll use a random one
            const tempWalletAddress = 'demo_' + Math.random().toString(36).substring(2, 15);

            // Set as initialized since this is just for demo purposes
            setIsInitialized(true);
            setWalletAddress(tempWalletAddress);
            setWalletType('demo');

            showSuccessMessage('Demo wallet initialized for testing');

            return true;
        } catch (err) {
            console.error('Error creating demo wallet:', err);
            setError(err.message || 'Failed to create demo wallet');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Store certificate metadata
    const storeCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!isInitialized) {
                throw new Error('Arweave wallet not initialized');
            }

            // Format metadata
            const formattedMetadata = formatCertificateMetadata(certificateData);

            // Store on Arweave
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

    // Request testnet tokens
    const requestTokens = useCallback(async (amount = 100) => {
        if (!isInitialized) {
            setError('Wallet not initialized');
            return { success: false, error: 'Wallet not initialized' };
        }

        setIsLoading(true);
        setError(null);

        try {
            // If we don't have a wallet address, we can't request tokens
            if (!walletAddress) {
                throw new Error('No wallet address available');
            }

            // Request tokens from the faucet
            const result = await requestTestnetTokens({
                recipient: walletAddress,
                amount
            });

            // If we need a captcha, open a window for it
            if (result.needsCaptcha) {
                // Set up listener for the captcha completion
                const removeListener = setupCaptchaListener((token) => {
                    // Close the captcha window if it's still open
                    if (captchaWindow && !captchaWindow.closed) {
                        captchaWindow.close();
                    }

                    // Try again with the token
                    requestTestnetTokens({
                        recipient: walletAddress,
                        amount,
                        authToken: token
                    }).then((tokenResult) => {
                        if (tokenResult.success) {
                            showSuccessMessage(`Successfully requested ${amount} AR.IO testnet tokens!`);
                        }
                    }).catch((err) => {
                        setError(`Failed to claim tokens: ${err.message}`);
                    });

                    // Clean up the listener
                    removeListener();
                });

                // Open the captcha window
                const newWindow = window.open(
                    result.captchaUrl,
                    '_blank',
                    'width=600,height=600'
                );

                setCaptchaWindow(newWindow);

                // Return early - the actual token request will happen after captcha
                setIsLoading(false);

                return {
                    success: true,
                    captchaRequired: true,
                    message: 'Please complete the captcha to receive tokens'
                };
            }

            // If we have a direct result (no captcha needed), show success
            showSuccessMessage(`Successfully requested ${amount} AR.IO testnet tokens!`);

            return {
                success: true,
                transactionId: result.transactionId
            };
        } catch (err) {
            console.error('Error requesting tokens:', err);
            setError(err.message || 'Failed to request tokens');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [isInitialized, walletAddress]);

    // Reset state
    const resetState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Disconnect wallet
    const disconnectArweaveWallet = useCallback(() => {
        disconnectWallet();

        setIsInitialized(false);
        setWalletAddress(null);
        setWalletType(null);
        setPendingTxs([]);

        showSuccessMessage('Arweave wallet disconnected');
    }, []);

    // Create the context value
    const value = {
        // State
        isInitialized,
        isLoading,
        error,
        walletAddress,
        successMessage,
        pendingTxs,
        walletType,

        // Wallet operations
        initialize,
        initializeWithArConnect,
        generateTestWallet,
        disconnectWallet: disconnectArweaveWallet,

        // Certificate operations
        storeCertificate,
        retrieveCertificate,
        formatCertificateMetadata,

        // Testnet operations
        requestTokens,

        // Utility
        resetState,
        getGatewayUrl,
        isWalletExtensionAvailable,
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