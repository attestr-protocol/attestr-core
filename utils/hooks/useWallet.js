// utils/hooks/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import { useAddress, useMetamask, useDisconnect } from '@thirdweb-dev/react';
import {
    isSupportedNetwork,
    switchToAmoyNetwork,
    getCurrentAccount,
    onAccountsChanged,
    onChainChanged
} from '../blockchain/walletUtils';
// Update import to use certificateService instead of certificateUtils
import { certificateService } from '../certificate/certificateService';

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
    const [isIssuer, setIsIssuer] = useState(false);

    // Error notification state
    const [showErrorNotification, setShowErrorNotification] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [errorType, setErrorType] = useState(''); // 'user-rejected', 'network', 'generic'

    // Check if current network is supported
    const checkNetwork = useCallback(async () => {
        if (address) {
            const supported = await isSupportedNetwork();
            setNetworkSupported(supported);

            if (!supported) {
                showError(`Please switch to the ${process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet'} to use this application.`, 'network');
            }
        }
    }, [address]);

    // Check if connected wallet is a verified issuer
    const checkIsIssuer = useCallback(async () => {
        if (address) {
            try {
                // Updated to use certificateService instead of the direct import
                const verified = await certificateService.isVerifiedIssuer(address);
                setIsIssuer(verified);
            } catch (error) {
                console.error('Error checking if address is a verified issuer:', error);
                setIsIssuer(false);
            }
        } else {
            setIsIssuer(false);
        }
    }, [address]);

    // Run checks when wallet connects
    useEffect(() => {
        if (address) {
            checkNetwork();
            checkIsIssuer();
        }
    }, [address, checkNetwork, checkIsIssuer]);

    // Set up listeners for account and chain changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.ethereum) {
            return;
        }

        const accountsListener = (accounts) => {
            if (accounts.length === 0) {
                // User disconnected their wallet
                disconnectWallet();
            }
        };

        const chainListener = (chainIdHex) => {
            const chainId = parseInt(chainIdHex, 16);
            const targetChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '80002', 10);

            setNetworkSupported(chainId === targetChainId);

            if (chainId !== targetChainId) {
                showError(`Please switch to the ${process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet'} to use this application.`, 'network');
            }
            else if (errorType === 'network') {
                setShowErrorNotification(false);
            }
        };

        const removeAccountsListener = onAccountsChanged(accountsListener);
        const removeChainListener = onChainChanged(chainListener);

        return () => {
            removeAccountsListener();
            removeChainListener();
        };
    }, [disconnectWallet, errorType]);

    // Switch to supported network
    const switchNetwork = useCallback(async () => {
        try {
            setIsConnecting(true);
            const success = await switchToAmoyNetwork();

            if (success) {
                setNetworkSupported(true);
                setError(null);
                // Clear network-related error notifications
                if (errorType === 'network') {
                    setShowErrorNotification(false);
                }
            } else {
                showError(`Failed to switch to ${process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet'}. Please try manually.`, 'network');
            }
        } catch (error) {
            console.error('Failed to switch network:', error);
            showError(`Failed to switch network: ${error.message}`, 'network');
        } finally {
            setIsConnecting(false);
        }
    }, [errorType]);

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

            // Try to connect with MetaMask
            await connectWithMetamask();

            // Check if the network is supported
            const supported = await isSupportedNetwork();
            setNetworkSupported(supported);

            if (!supported) {
                showError(`Please switch to the ${process.env.NEXT_PUBLIC_CHAIN_NAME || 'Polygon Amoy Testnet'} to use this application.`, 'network');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);

            // Detect specific error types
            if (error?.message?.includes('User rejected the request')) {
                showError("Connection cancelled by user.", 'user-rejected');
            } else if (error?.message?.includes('already pending')) {
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
        setIsIssuer(false);
    }, [disconnectWallet]);

    return {
        address,
        isConnected: !!address,
        isConnecting,
        isIssuer,
        connect,
        disconnect,
        error,
        networkSupported,
        switchNetwork,
        checkNetwork,
        checkIsIssuer,
        // Error notification props
        showErrorNotification,
        errorMessage,
        errorType,
        dismissError,
    };
};