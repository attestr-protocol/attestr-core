// utils/hooks/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import { useAddress, useMetamask, useDisconnect } from '@thirdweb-dev/react';
import { isSupportedNetwork, switchToMumbaiNetwork } from '../blockchain/walletUtils';

/**
 * Custom hook for wallet management with enhanced error handling
 * @returns {Object} Wallet state and functions
 */
export const useWallet = () => {
    const address = useAddress();
    const connectWithMetamask = useMetamask();
    const disconnectWallet = useDisconnect();
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);
    const [networkSupported, setNetworkSupported] = useState(true);

    // Error notification state
    const [showErrorNotification, setShowErrorNotification] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorType, setErrorType] = useState(''); // 'user-rejected', 'network', 'generic'

    // Check if network is supported when wallet connects
    useEffect(() => {
        if (address) {
            checkNetwork();
        }
    }, [address]);

    // Check if current network is supported
    const checkNetwork = useCallback(async () => {
        if (address) {
            const supported = await isSupportedNetwork();
            setNetworkSupported(supported);

            if (!supported) {
                showError('Please switch to the Mumbai Testnet to use this application.', 'network');
            }
        }
    }, [address]);

    // Switch to supported network
    const switchNetwork = useCallback(async () => {
        try {
            const success = await switchToMumbaiNetwork();
            if (success) {
                setNetworkSupported(true);
                setError(null);
            } else {
                showError('Failed to switch network. Please try manually.', 'network');
            }
        } catch (error) {
            console.error('Failed to switch network:', error);
            showError('Failed to switch network. Please try manually.', 'network');
        }
    }, []);

    // Helper function to handle errors
    const showError = useCallback((message, type = 'generic') => {
        setError(message);
        setErrorMessage(message);
        setErrorType(type);
        setShowErrorNotification(true);

        // Auto-hide error after 5 seconds
        setTimeout(() => {
            setShowErrorNotification(false);
        }, 5000);
    }, []);

    // Dismiss error notification
    const dismissError = useCallback(() => {
        setShowErrorNotification(false);
    }, []);

    // Connect wallet with enhanced error handling
    const connect = useCallback(async () => {
        try {
            setIsConnecting(true);
            setError(null);
            await connectWithMetamask();
        } catch (error) {
            console.error('Failed to connect wallet:', error);

            // Detect specific error types
            if (error?.message?.includes('User rejected the request')) {
                showError("Connection cancelled.", 'generic');
                showError('A connection request is already in progress. Please check your MetaMask extension.', 'generic');
                showError('A connection request is already in progress. Please check your MetaMask extension.', 'generic');
            } else {
                showError(error.message || 'Failed to connect wallet. Please try again.', 'generic');
            }
        } finally {
            setIsConnecting(false);
        }
    }, [connectWithMetamask, showError]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        disconnectWallet();
        setError(null);
    }, [disconnectWallet]);

    return {
        address,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        error,
        networkSupported,
        switchNetwork,
        checkNetwork,
        // Error notification props
        showErrorNotification,
        errorMessage,
        errorType,
        dismissError,
    };
};

