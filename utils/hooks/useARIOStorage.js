// utils/hooks/useARIOStorage.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useArweave } from '../../contexts/ArweaveContext';
import {
    getARIOClient,
    isInitialized,
    getCurrentWalletAddress,
    requestTestnetTokens,
    setupCaptchaListener,
    disconnect
} from '../storage/arIOClient';
import {
    storeCertificateMetadata,
    retrieveCertificateMetadata,
    formatCertificateMetadata,
    getGatewayUrl
} from '../storage/arweaveStorage';

/**
 * Custom hook for AR.IO storage operations with enhanced capabilities
 * @returns {Object} Storage functions and state
 */
export const useARIOStorage = () => {
    const arweaveContext = useArweave();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [txStatus, setTxStatus] = useState({});
    const [captchaWindow, setCaptchaWindow] = useState(null);
    const [balance, setBalance] = useState(null);
    const captchaListenerRef = useRef(null);

    // Clear captcha listener on unmount
    useEffect(() => {
        return () => {
            if (captchaListenerRef.current) {
                captchaListenerRef.current();
            }

            // Close captcha window if still open
            if (captchaWindow && !captchaWindow.closed) {
                captchaWindow.close();
            }
        };
    }, [captchaWindow]);

    // Store a certificate in AR.IO storage
    const storeCertificate = useCallback(async (certificateData) => {
        if (!isInitialized()) {
            setError('AR.IO storage not initialized');
            return {
                success: false,
                error: 'AR.IO storage not initialized'
            };
        }

        setIsLoading(true);
        setError(null);

        try {
            // Format certificate metadata
            const formattedMetadata = arweaveContext.formatCertificateMetadata
                ? arweaveContext.formatCertificateMetadata(certificateData)
                : formatCertificateMetadata(certificateData);

            // Store on AR.IO testnet
            const txId = await (arweaveContext.storeCertificate
                ? arweaveContext.storeCertificate(certificateData).then(result => result.txId || result)
                : storeCertificateMetadata(formattedMetadata));

            // Add to transaction status tracking
            setTxStatus(prev => ({
                ...prev,
                [txId]: {
                    id: txId,
                    status: 'pending',
                    timestamp: Date.now(),
                    type: 'certificate',
                    data: formattedMetadata
                }
            }));

            return {
                success: true,
                txId,
                arweaveUri: `ar://${txId}`,
                metadata: formattedMetadata,
                viewUrl: `https://ar-io.dev/${txId}`
            };
        } catch (err) {
            console.error('Error storing certificate on AR.IO:', err);
            setError(err.message || 'Failed to store certificate');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [arweaveContext]);

    // Retrieve a certificate from AR.IO storage
    const retrieveCertificate = useCallback(async (arweaveIdOrUri) => {
        setIsLoading(true);
        setError(null);

        try {
            // Clean the ID if it includes the ar:// prefix
            const txId = arweaveIdOrUri.replace('ar://', '');

            // First try to use context method if available
            if (arweaveContext.retrieveCertificate) {
                return await arweaveContext.retrieveCertificate(arweaveIdOrUri);
            }

            // Fallback to direct method
            const metadata = await retrieveCertificateMetadata(`ar://${txId}`);

            return {
                success: true,
                metadata,
                txId
            };
        } catch (err) {
            console.error('Error retrieving certificate from AR.IO:', err);
            setError(err.message || 'Failed to retrieve certificate');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            setIsLoading(false);
        }
    }, [arweaveContext]);

    // Check balance of AR.IO tokens
    const checkBalance = useCallback(async (address = null) => {
        if (!isInitialized()) {
            setError('AR.IO storage not initialized');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const client = getARIOClient();
            if (!client) {
                throw new Error('AR.IO client not initialized');
            }

            // Get wallet address if not provided
            const walletAddress = address || await getCurrentWalletAddress();
            if (!walletAddress) {
                throw new Error('No wallet address available');
            }

            // Get balance
            const balanceResponse = await client.getBalance(walletAddress);

            // Format balance (convert from mARIO to ARIO)
            const formattedBalance = {
                raw: balanceResponse.tokenBalance,
                formatted: balanceResponse.tokenBalance / 1000000000000, // Convert from mARIO to ARIO
                units: 'ARIO'
            };

            // Update state
            setBalance(formattedBalance);

            return formattedBalance;
        } catch (err) {
            console.error('Error checking AR.IO balance:', err);
            setError(err.message || 'Failed to check balance');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Request testnet tokens
    const requestTokens = useCallback(async (amount = 100) => {
        if (!isInitialized()) {
            setError('AR.IO storage not initialized');
            return {
                success: false,
                error: 'AR.IO storage not initialized'
            };
        }

        setIsLoading(true);
        setError(null);

        try {
            const walletAddress = await getCurrentWalletAddress();

            if (!walletAddress) {
                throw new Error('No wallet address available');
            }

            // Set up listener for captcha completion
            captchaListenerRef.current = setupCaptchaListener((token) => {
                // Close the captcha window if it's still open
                if (captchaWindow && !captchaWindow.closed) {
                    captchaWindow.close();
                }

                // Try again with the token
                requestTestnetTokens({
                    recipient: walletAddress,
                    amount,
                    authToken: token
                }).then(tokenResult => {
                    if (tokenResult.success) {
                        // Success notification could be handled here
                        // Update balance after successful token request
                        setTimeout(() => checkBalance(walletAddress), 2000);
                    }
                }).catch(err => {
                    setError(`Failed to claim tokens: ${err.message}`);
                }).finally(() => {
                    setIsLoading(false);
                });
            });

            // Request tokens from the faucet
            const result = await requestTestnetTokens({
                recipient: walletAddress,
                amount
            });

            // If we need a captcha, open a window for it
            if (result.needsCaptcha) {
                const newWindow = window.open(
                    result.captchaUrl,
                    '_blank',
                    'width=600,height=600'
                );

                setCaptchaWindow(newWindow);

                return {
                    success: true,
                    captchaRequired: true,
                    message: 'Please complete the captcha to receive tokens'
                };
            }

            // Direct success (rare, usually captcha is needed)
            // Update balance after successful token request
            setTimeout(() => checkBalance(walletAddress), 2000);

            return {
                success: true,
                transactionId: result.transactionId
            };
        } catch (err) {
            console.error('Error requesting AR.IO testnet tokens:', err);
            setError(err.message || 'Failed to request tokens');

            return {
                success: false,
                error: err.message || 'Unknown error'
            };
        } finally {
            if (!captchaWindow) {
                setIsLoading(false);
            }
        }
    }, [captchaWindow, checkBalance]);

    // Get transaction status
    const getTransactionStatus = useCallback(async (txId) => {
        if (!txId) {
            return null;
        }

        try {
            // First check if we have it in our local state
            if (txStatus[txId]) {
                return txStatus[txId];
            }

            // Get status from AR.IO client
            const client = getARIOClient();
            if (!client) {
                throw new Error('AR.IO client not initialized');
            }

            // Fetch transaction status from network
            const status = await client.getTransactionStatus(txId);

            // Update local state
            const newStatus = {
                id: txId,
                status: status.status,
                confirmed: status.confirmed,
                timestamp: Date.now()
            };

            setTxStatus(prev => ({
                ...prev,
                [txId]: newStatus
            }));

            return newStatus;
        } catch (err) {
            console.error('Error getting transaction status:', err);
            return null;
        }
    }, [txStatus]);

    // Get gateway URL for transaction
    const getGatewayURL = useCallback((txId) => {
        if (!txId) {
            return null;
        }

        // Clean the ID if it includes the ar:// prefix
        const cleanId = txId.replace('ar://', '');

        return `https://ar-io.dev/${cleanId}`;
    }, []);

    // Initialize connection with ArConnect
    const connectWithArConnect = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!window.arweaveWallet) {
                throw new Error('ArConnect extension not detected. Please install it first.');
            }

            // First try to use context method if available
            if (arweaveContext.initializeWithArConnect) {
                const result = await arweaveContext.initializeWithArConnect();

                // Check balance after successful connection
                if (result) {
                    setTimeout(checkBalance, 500);
                }

                return result;
            }

            throw new Error('ArConnect connection method not available');
        } catch (err) {
            console.error('Error connecting with ArConnect:', err);
            setError(err.message || 'Failed to connect with ArConnect');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [arweaveContext, checkBalance]);

    // Disconnect from AR.IO
    const disconnectStorage = useCallback(() => {
        try {
            // Use context method if available
            if (arweaveContext.disconnectWallet) {
                arweaveContext.disconnectWallet();
            } else {
                // Fallback to direct method
                disconnect();
            }

            // Clear local state
            setBalance(null);
            setTxStatus({});

            return true;
        } catch (err) {
            console.error('Error disconnecting from AR.IO:', err);
            setError(err.message || 'Failed to disconnect from AR.IO');
            return false;
        }
    }, [arweaveContext]);

    // Format certificate metadata
    const formatMetadata = useCallback((certificateData) => {
        return arweaveContext.formatCertificateMetadata
            ? arweaveContext.formatCertificateMetadata(certificateData)
            : formatCertificateMetadata(certificateData);
    }, [arweaveContext]);

    return {
        // State
        isLoading,
        error,
        txStatus,
        balance,

        // Main certificate methods
        storeCertificate,
        retrieveCertificate,
        formatMetadata,

        // Transaction methods
        getTransactionStatus,
        getGatewayURL,

        // Token methods
        checkBalance,
        requestTokens,

        // Connection methods
        connectWithArConnect,
        disconnectStorage,

        // Utilities
        isInitialized: isInitialized,
        getCurrentWalletAddress,

        // Pass through from arweave context
        walletAddress: arweaveContext?.walletAddress,
        walletType: arweaveContext?.walletType,

        // Error management
        setError,
        clearError: () => setError(null),
        resetState: () => {
            setError(null);
            setIsLoading(false);
        }
    };
};