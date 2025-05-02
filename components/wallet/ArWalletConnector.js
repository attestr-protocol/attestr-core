// components/wallet/ArWalletConnector.jsx
import React, { useState, useEffect } from 'react';
import Button from '../atoms/buttons/Button';
import Modal from '../molecules/modals/Modal';
import Card from '../molecules/cards/Card';
import TextInput from '../atoms/inputs/TextInput';
import {
    initializeStorage,
    loadWalletFromLocalStorage,
    getCurrentWalletAddress,
    isWalletExtensionAvailable,
    getConnectedWalletType,
    disconnectWallet
} from '../../utils/storage/arweaveStorage';

/**
 * Enhanced ArWallet connector component for AR.io testnet
 * Supports multiple wallet types: JWK file, ArConnect/Wander, and Arweave Wallet
 */
const ArWalletConnector = ({
    onConnected = () => { },
    onDisconnected = () => { },
    className = '',
    ...props
}) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [walletAddress, setWalletAddress] = useState(null);
    const [walletType, setWalletType] = useState(null);
    const [error, setError] = useState(null);
    const [walletKey, setWalletKey] = useState('');
    const [walletFile, setWalletFile] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [balance, setBalance] = useState('');

    // Check for existing wallet on mount
    useEffect(() => {
        checkWalletStatus();
    }, []);

    // Check wallet status
    const checkWalletStatus = async () => {
        try {
            // Get wallet type if already connected
            const currentType = getConnectedWalletType();

            if (currentType) {
                setWalletType(currentType);
                setIsInitialized(true);

                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
                onConnected(address);
            } else {
                // Check if wallet is in localStorage as a backup
                const savedWallet = loadWalletFromLocalStorage();

                if (savedWallet) {
                    setIsConnecting(true);
                    setError(null);

                    const success = await initializeStorage(savedWallet, 'jwk');

                    if (success) {
                        const address = await getCurrentWalletAddress();
                        setWalletAddress(address);
                        setWalletType('jwk');
                        setIsInitialized(true);
                        onConnected(address);
                    }

                    setIsConnecting(false);
                }
            }
        } catch (err) {
            console.error('Error checking wallet status:', err);
            setIsConnecting(false);
        }
    };

    // Handle wallet JSON file upload
    const handleFileChange = (e) => {
        if (e.target.files.length === 0) return;

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result;
                const jsonWallet = JSON.parse(fileContent);
                setWalletFile(jsonWallet);
            } catch (err) {
                setError('Invalid wallet file. Please upload a valid Arweave JWK file.');
                setWalletFile(null);
            }
        };

        reader.readAsText(file);
    };

    // Connect with ArConnect/Wander
    const connectWithArConnect = async () => {
        if (!isWalletExtensionAvailable('arconnect')) {
            setError('ArConnect/Wander extension not detected. Please install it first.');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            const success = await initializeStorage(null, 'arconnect');

            if (success) {
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
                setWalletType('arconnect');
                setIsInitialized(true);
                setIsModalOpen(false);
                onConnected(address);
            } else {
                setError('Failed to connect with ArConnect/Wander. Please try again.');
            }
        } catch (err) {
            console.error('Error connecting with ArConnect:', err);
            setError(err.message || 'Failed to connect with ArConnect/Wander');
        } finally {
            setIsConnecting(false);
        }
    };

    // Connect wallet with file
    const connectWithFile = async () => {
        if (!walletFile) {
            setError('Please upload a wallet file');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            const success = await initializeStorage(walletFile, 'jwk');

            if (success) {
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
                setWalletType('jwk');
                setIsInitialized(true);
                setIsModalOpen(false);
                onConnected(address);
            } else {
                setError('Failed to connect wallet. Please check the wallet file.');
            }
        } catch (err) {
            console.error('Error connecting wallet:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    // Connect wallet with paste JSON
    const connectWithPaste = async () => {
        if (!walletKey.trim()) {
            setError('Please paste your wallet key');
            return;
        }

        try {
            setIsConnecting(true);
            setError(null);

            // Parse the pasted JSON
            let jsonWallet;
            try {
                jsonWallet = JSON.parse(walletKey);
            } catch (err) {
                throw new Error('Invalid wallet JSON. Please check the format.');
            }

            const success = await initializeStorage(jsonWallet, 'jwk');

            if (success) {
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
                setWalletType('jwk');
                setIsInitialized(true);
                setIsModalOpen(false);
                onConnected(address);
            } else {
                setError('Failed to connect wallet. Please check the wallet key.');
            }
        } catch (err) {
            console.error('Error connecting wallet:', err);
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    // Generate a new wallet
    const generateNewWallet = async () => {
        try {
            setIsConnecting(true);
            setError(null);

            const success = await initializeStorage(null, 'jwk'); // No param = generate new wallet

            if (success) {
                const address = await getCurrentWalletAddress();
                setWalletAddress(address);
                setWalletType('jwk');
                setIsInitialized(true);
                setIsModalOpen(false);
                onConnected(address);
            } else {
                setError('Failed to generate new wallet.');
            }
        } catch (err) {
            console.error('Error generating wallet:', err);
            setError(err.message || 'Failed to generate wallet');
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect wallet
    const handleDisconnect = () => {
        disconnectWallet();
        setWalletAddress(null);
        setWalletType(null);
        setIsInitialized(false);
        setBalance('');
        onDisconnected();
    };

    // Get wallet type display name
    const getWalletTypeDisplay = () => {
        switch (walletType) {
            case 'arconnect':
                return 'ArConnect/Wander';
            case 'arweavewallet':
                return 'Arweave Wallet';
            case 'jwk':
                return 'JWK Wallet';
            default:
                return 'Wallet';
        }
    };

    return (
        <>
            {walletAddress ? (
                <Card className={`p-4 ${className}`} {...props}>
                    <div>
                        <h3 className="text-lg font-medium mb-2">Arweave Wallet Connected</h3>
                        <p className="text-sm mb-2">AR.io Testnet - {getWalletTypeDisplay()}</p>

                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-3">
                            <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                            <p className="font-mono text-sm break-all">{walletAddress}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDisconnect}
                            >
                                Disconnect
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className={className} {...props}>
                    <Button
                        variant="primary"
                        onClick={() => setIsModalOpen(true)}
                        disabled={isConnecting}
                        isLoading={isConnecting}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect AR.io Wallet'}
                    </Button>
                </div>
            )}

            {/* Wallet Connection Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Connect to AR.io Testnet"
                size="md"
            >
                <div className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Connect your Arweave wallet to interact with the AR.io testnet.
                            This will be used to store certificate metadata permanently.
                        </p>
                    </div>

                    {/* ArConnect/Wander */}
                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Connect with ArConnect/Wander</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            The most convenient way to connect. Requires the ArConnect/Wander browser extension.
                        </p>
                        <Button
                            variant="primary"
                            onClick={connectWithArConnect}
                            disabled={!isWalletExtensionAvailable('arconnect') || isConnecting}
                            isLoading={isConnecting && walletType === 'arconnect'}
                            fullWidth
                        >
                            {isWalletExtensionAvailable('arconnect')
                                ? 'Connect with ArConnect/Wander'
                                : 'ArConnect/Wander Not Installed'}
                        </Button>
                        {!isWalletExtensionAvailable('arconnect') && (
                            <p className="text-xs text-gray-500 mt-2">
                                <a
                                    href="https://www.wander.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Install Wander (formerly ArConnect)
                                </a>
                            </p>
                        )}
                    </Card>

                    {/* Upload wallet file section */}
                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Upload Wallet File</h3>
                        <div className="mb-4">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-light file:text-primary hover:file:bg-primary-light/80"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload your Arweave JWK wallet file</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={connectWithFile}
                            disabled={!walletFile || isConnecting}
                            isLoading={isConnecting && walletType === 'jwk'}
                            fullWidth
                        >
                            Connect with File
                        </Button>
                    </Card>

                    {/* Paste JSON section */}
                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Paste Wallet JSON</h3>
                        <div className="mb-4">
                            <TextInput
                                as="textarea"
                                rows={4}
                                value={walletKey}
                                onChange={(e) => setWalletKey(e.target.value)}
                                placeholder='{"kty":"RSA","e":"AQAB",...}'
                                className="font-mono text-xs"
                            />
                        </div>
                        <Button
                            variant="primary"
                            onClick={connectWithPaste}
                            disabled={!walletKey.trim() || isConnecting}
                            isLoading={isConnecting && walletType === 'jwk'}
                            fullWidth
                        >
                            Connect with JSON
                        </Button>
                    </Card>

                    {/* Generate new wallet section */}
                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Generate New Wallet</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Generate a new wallet for AR.io testnet. Make sure to export and save this wallet after creation.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={generateNewWallet}
                            disabled={isConnecting}
                            isLoading={isConnecting && !walletType}
                            fullWidth
                        >
                            Generate New Wallet
                        </Button>

                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                <strong>Note:</strong> You'll need AR.io testnet tokens to store data.
                                For testing, you can visit the
                                <a
                                    href="https://ar-io.net/faucet"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary mx-1 hover:underline"
                                >
                                    AR.io testnet faucet
                                </a>
                                to get tokens.
                            </p>
                        </div>
                    </Card>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <p className="text-xs text-gray-500">
                            Wallet information is only stored locally in your browser. Never share your JWK wallet file with others.
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ArWalletConnector;