// components/wallet/WalletConnectButton.jsx
import React, { useState, useEffect } from 'react';
import Button from '../atoms/buttons/Button';
import Modal from '../molecules/modals/Modal';
import { useArweave } from '../../contexts/ArweaveContext';

/**
 * WalletConnectButton component for connecting Arweave wallets
 * This version works with our fallback mechanism
 * 
 * @param {Object} props
 * @param {Function} props.onConnected - Callback when wallet connects
 * @param {Function} props.onDisconnected - Callback when wallet disconnects
 * @param {boolean} props.isConnected - Whether wallet is currently connected
 */
const WalletConnectButton = ({
    onConnected = () => { },
    onDisconnected = () => { },
    isConnected = false,
    className = '',
    ...props
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null);

    // Get Arweave context
    const {
        generateTestWallet,
        isInitialized,
        isLoading,
        walletAddress,
        useFallback,
        resetFallbackMode
    } = useArweave();

    // Call onConnect/onDisconnect callbacks when wallet state changes
    useEffect(() => {
        if ((walletAddress || useFallback) && onConnected) {
            onConnected(walletAddress || 'FALLBACK_MODE');
        } else if (!walletAddress && !useFallback && onDisconnected) {
            onDisconnected();
        }
    }, [walletAddress, useFallback, onConnected, onDisconnected]);

    /**
     * Connect to demo wallet 
     */
    async function connectDemoWallet() {
        setError(null);

        try {
            await generateTestWallet();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error connecting to demo wallet:', err);
            setError(err.message || 'Failed to connect demo wallet');
        }
    }

    /**
     * Reset to normal mode from fallback mode
     */
    async function disableFallbackMode() {
        try {
            resetFallbackMode();
            onDisconnected();
        } catch (err) {
            console.error('Error disabling fallback mode:', err);
        }
    }

    /**
     * Check if ArConnect is installed
     */
    function isArConnectInstalled() {
        return typeof window !== 'undefined' && !!window.arweaveWallet;
    }

    // Determine what to show based on connection state
    const showConnected = isInitialized || useFallback || walletAddress;
    const displayAddress = walletAddress || 'FALLBACK_MODE';
    const addressText = useFallback ? 'Development Mode' :
        (displayAddress.length > 10 ?
            `${displayAddress.slice(0, 5)}...${displayAddress.slice(-5)}` :
            displayAddress);

    return (
        <>
            {showConnected ? (
                <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm truncate max-w-[140px]">
                        {addressText}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={useFallback ? disableFallbackMode : () => setIsModalOpen(true)}
                        className={className}
                        {...props}
                    >
                        {useFallback ? 'Reset Mode' : 'Disconnect'}
                    </Button>
                </div>
            ) : (
                <Button
                    variant="primary"
                    onClick={() => setIsModalOpen(true)}
                    className={className}
                    {...props}
                >
                    Connect Wallet
                </Button>
            )}

            {/* Wallet Selection Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Arweave Storage"
            >
                <div className="space-y-4 p-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-3 rounded-md text-red-700 dark:text-red-300 mb-4">
                            {error}
                        </div>
                    )}

                    <div className="mb-4 text-center">
                        <h3 className="text-lg font-medium mb-2">VeriChain Storage Options</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            VeriChain uses Arweave for permanent, decentralized storage of credential metadata.
                            Choose how you want to set up storage:
                        </p>
                    </div>

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={connectDemoWallet}
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="mb-3"
                    >
                        Use Demo Storage (Recommended)
                    </Button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                        For this demo, we&apos;ll create a temporary storage solution.
                        Your certificates will be stored locally.
                    </p>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h4 className="text-md font-medium mb-3">Production Options</h4>

                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => window.open('https://www.arweave.org/', '_blank')}
                            className="mb-3"
                        >
                            Learn About Arweave
                        </Button>

                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => window.open('https://www.arconnect.io/', '_blank')}
                            className="mb-3"
                            disabled={!isArConnectInstalled()}
                        >
                            {isArConnectInstalled() ? 'Open ArConnect' : 'Install ArConnect'}
                        </Button>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                            In a production environment, you would connect to a real Arweave wallet with AR tokens.
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default WalletConnectButton;