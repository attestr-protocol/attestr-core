// components/wallet/WalletConnectButton.jsx
import React, { useState, useEffect } from 'react';
import { ArweaveWebWallet } from 'arweave-wallet-connector';
import Button from '../atoms/buttons/Button';
import Modal from '../molecules/modals/Modal';

// Wallet types
const AR_CONNECT = 'arconnect';
const ARWEAVE_APP = 'arweave.app';

// Initialize arweave.app wallet connector
const webWallet = new ArweaveWebWallet({
    name: 'VeriChain',
    logo: '/logo.png', // Make sure you have a logo.png in your public folder
}, 'arweave.app');

/**
 * WalletConnectButton component for connecting Arweave wallets
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
    const [connectingWallet, setConnectingWallet] = useState(null);
    const [walletAddress, setWalletAddress] = useState('');
    const [error, setError] = useState(null);

    // Check for existing wallet connection on mount
    useEffect(() => {
        // Check if ArConnect is already connected
        if (window.arweaveWallet) {
            window.arweaveWallet.getActiveAddress()
                .then(address => {
                    if (address) {
                        setWalletAddress(address);
                        onConnected(AR_CONNECT);
                    }
                })
                .catch(() => {
                    // ArConnect is available but not connected
                });
        }
    }, [onConnected]);

    /**
     * Connect to wallet
     * @param {string} walletName - Wallet type to connect to
     */
    async function connectWallet(walletName) {
        setConnectingWallet(walletName);
        setError(null);

        try {
            switch (walletName) {
                case AR_CONNECT:
                    if (!window.arweaveWallet) {
                        throw new Error('ArConnect wallet not found. Please install the extension first.');
                    }

                    await window.arweaveWallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']);

                    // Get active address
                    const address = await window.arweaveWallet.getActiveAddress();
                    setWalletAddress(address);
                    break;

                case ARWEAVE_APP:
                    await webWallet.connect();

                    // Set up event listener for disconnection
                    webWallet.on('change', () => {
                        if (!webWallet.address && onDisconnected) {
                            setWalletAddress('');
                            onDisconnected();
                        }
                    });

                    setWalletAddress(webWallet.address);
                    break;

                default:
                    throw new Error(`Attempted to connect unknown wallet ${walletName}`);
            }

            // Close modal and call success callback
            setIsModalOpen(false);
            onConnected(walletName);
        } catch (err) {
            console.error('Error connecting wallet:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setConnectingWallet(null);
        }
    }

    /**
     * Disconnect wallet
     */
    async function disconnectWallet() {
        try {
            // Disconnect from ArConnect if that's what we're using
            if (window.arweaveWallet) {
                await window.arweaveWallet.disconnect();
            }

            // For arweave.app, the wallet is unloaded when the popup is closed
            setWalletAddress('');
            onDisconnected();
        } catch (err) {
            console.error('Error disconnecting wallet:', err);
        }
    }

    // Check if ArConnect is installed
    const isArConnectInstalled = typeof window !== 'undefined' && !!window.arweaveWallet;

    return (
        <>
            {isConnected || walletAddress ? (
                <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm truncate max-w-[140px]">
                        {walletAddress.slice(0, 5)}...{walletAddress.slice(-5)}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={disconnectWallet}
                        className={className}
                        {...props}
                    >
                        Disconnect
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
                title="Select Wallet"
            >
                <div className="space-y-4 p-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-3 rounded-md text-red-700 dark:text-red-300 mb-4">
                            {error}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => connectWallet(AR_CONNECT)}
                        disabled={connectingWallet !== null || !isArConnectInstalled}
                        isLoading={connectingWallet === AR_CONNECT}
                    >
                        {isArConnectInstalled ? 'ArConnect' : 'ArConnect (Install Extension First)'}
                    </Button>

                    {!isArConnectInstalled && (
                        <a
                            href="https://www.arconnect.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-center text-primary text-sm hover:underline mt-1"
                        >
                            Install ArConnect Extension
                        </a>
                    )}

                    <Button
                        variant="outline"
                        fullWidth
                        onClick={() => connectWallet(ARWEAVE_APP)}
                        disabled={connectingWallet !== null}
                        isLoading={connectingWallet === ARWEAVE_APP}
                    >
                        Arweave.app (Web Wallet)
                    </Button>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                        Select your preferred wallet to connect to VeriChain. Both options allow you to sign transactions and issue certificates.
                    </p>
                </div>
            </Modal>
        </>
    );
};

export default WalletConnectButton;