// components/organisms/wallet/WalletManager.js
import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../../../contexts/WalletContext';
import { useArweave } from '../../../contexts/ArweaveContext';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import Modal from '../../molecules/modals/Modal';
import Address from '../../atoms/display/Address';
import CopyButton from '../../atoms/display/CopyButton';
import TextInput from '../../atoms/inputs/TextInput';
import {
    DocumentDuplicateIcon,
    ExclamationIcon,
    CheckCircleIcon,
    SwitchHorizontalIcon,
    ChipIcon,
    CubeIcon,
    CurrencyDollarIcon,
    RefreshIcon
} from '@heroicons/react/outline';

/**
 * Enhanced wallet management component that handles both
 * blockchain wallet (MetaMask) and Arweave storage wallet (AR.IO)
 * 
 * @param {Object} props
 * @param {Function} props.onBlockchainConnect - Callback when blockchain wallet connects
 * @param {Function} props.onStorageConnect - Callback when storage wallet connects
 * @param {boolean} props.showBoth - Whether to show both wallet connectors
 * @param {string} props.activeTab - Initial active tab ('blockchain' or 'storage')
 */
const WalletManager = ({
    onBlockchainConnect,
    onStorageConnect,
    showBoth = true,
    activeTab = 'blockchain',
    className = '',
    ...props
}) => {
    // State
    const [currentTab, setCurrentTab] = useState(activeTab);
    const [isArweaveModalOpen, setIsArweaveModalOpen] = useState(false);
    const [arweaveError, setArweaveError] = useState(null);
    const [walletFile, setWalletFile] = useState(null);
    const [walletKey, setWalletKey] = useState('');
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenAmount, setTokenAmount] = useState(100);

    // Blockchain wallet context
    const {
        address: blockchainAddress,
        connect: connectBlockchain,
        disconnect: disconnectBlockchain,
        isConnecting: isBlockchainConnecting,
        networkSupported,
        switchNetwork,
        error: blockchainError
    } = useWalletContext();

    // Arweave storage context
    const {
        walletAddress: arweaveAddress,
        isInitialized: isArweaveInitialized,
        isLoading: isArweaveLoading,
        error: arweaveContextError,
        successMessage: arweaveSuccessMessage,
        walletType: arweaveWalletType,
        initializeWithArConnect,
        generateTestWallet,
        initialize: initializeArweave,
        disconnectWallet: disconnectArweave,
        requestTokens,
        isWalletExtensionAvailable
    } = useArweave();

    // Set error from context
    useEffect(() => {
        if (arweaveContextError) {
            setArweaveError(arweaveContextError);
        }
    }, [arweaveContextError]);

    // Handle blockchain wallet connection
    const handleConnectBlockchain = async () => {
        try {
            await connectBlockchain();
            if (onBlockchainConnect) {
                onBlockchainConnect(blockchainAddress);
            }
        } catch (error) {
            console.error('Error connecting blockchain wallet:', error);
        }
    };

    // Handle blockchain wallet disconnection
    const handleDisconnectBlockchain = async () => {
        await disconnectBlockchain();
    };

    // Handle storage wallet connection with demo wallet
    const handleConnectDemoStorage = async () => {
        setArweaveError(null);
        try {
            await generateTestWallet();
            setIsArweaveModalOpen(false);
            if (onStorageConnect) {
                onStorageConnect(arweaveAddress);
            }
        } catch (error) {
            console.error('Error generating demo wallet:', error);
            setArweaveError(error.message || 'Failed to generate demo wallet');
        }
    };

    // Handle ArConnect connection
    const handleConnectWithArConnect = async () => {
        if (!isWalletExtensionAvailable('arconnect')) {
            setArweaveError('ArConnect extension not detected. Please install it first.');
            return;
        }

        try {
            const success = await initializeWithArConnect();
            if (success) {
                setIsArweaveModalOpen(false);
                if (onStorageConnect) {
                    onStorageConnect(arweaveAddress);
                }
            }
        } catch (error) {
            console.error('Error connecting with ArConnect:', error);
            setArweaveError(error.message || 'Failed to connect with ArConnect');
        }
    };

    // Handle file upload for Arweave wallet
    const handleFileChange = (e) => {
        if (e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const fileContent = event.target.result;
                const jsonWallet = JSON.parse(fileContent);
                setWalletFile(jsonWallet);
            } catch (err) {
                setArweaveError('Invalid wallet file. Please upload a valid Arweave JWK file.');
                setWalletFile(null);
            }
        };

        reader.readAsText(file);
    };

    // Connect with Arweave wallet file
    const handleConnectWithFile = async () => {
        if (!walletFile) {
            setArweaveError('Please upload a wallet file');
            return;
        }

        try {
            const success = await initializeArweave(walletFile, 'jwk');
            if (success) {
                setIsArweaveModalOpen(false);
                if (onStorageConnect) {
                    onStorageConnect(arweaveAddress);
                }
            }
        } catch (error) {
            console.error('Error connecting with wallet file:', error);
            setArweaveError(error.message || 'Failed to connect with wallet file');
        }
    };

    // Connect with pasted wallet key
    const handleConnectWithKey = async () => {
        if (!walletKey.trim()) {
            setArweaveError('Please paste your wallet key');
            return;
        }

        try {
            let jsonWallet;
            try {
                jsonWallet = JSON.parse(walletKey);
            } catch (err) {
                throw new Error('Invalid wallet JSON. Please check the format.');
            }

            const success = await initializeArweave(jsonWallet, 'jwk');
            if (success) {
                setIsArweaveModalOpen(false);
                if (onStorageConnect) {
                    onStorageConnect(arweaveAddress);
                }
            }
        } catch (error) {
            console.error('Error connecting with key:', error);
            setArweaveError(error.message || 'Failed to connect with wallet key');
        }
    };

    // Request testnet tokens
    const handleRequestTokens = async () => {
        if (!isArweaveInitialized) {
            setArweaveError('Wallet not initialized. Please connect a wallet first.');
            return;
        }

        try {
            const amount = parseInt(tokenAmount, 10);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid token amount');
            }

            const result = await requestTokens(amount);
            if (result.success) {
                if (!result.captchaRequired) {
                    setIsTokenModalOpen(false);
                }
            } else {
                throw new Error(result.error || 'Failed to request tokens');
            }
        } catch (error) {
            console.error('Error requesting tokens:', error);
            setArweaveError(error.message || 'Failed to request tokens');
        }
    };

    return (
        <div className={className} {...props}>
            {/* Tabs - Only shown when displaying both wallet types */}
            {showBoth && (
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                        className={`px-4 py-2 font-medium ${currentTab === 'blockchain'
                            ? 'border-b-2 border-primary text-primary dark:text-primary-light'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        onClick={() => setCurrentTab('blockchain')}
                    >
                        Blockchain Wallet
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${currentTab === 'storage'
                            ? 'border-b-2 border-secondary text-secondary dark:text-secondary-light'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        onClick={() => setCurrentTab('storage')}
                    >
                        Storage Wallet
                    </button>
                </div>
            )}

            {/* Blockchain Wallet Section */}
            {(!showBoth || currentTab === 'blockchain') && (
                <Card className="mb-6">
                    {blockchainAddress ? (
                        <div className="p-4">
                            <h3 className="text-lg font-medium mb-4">Blockchain Wallet Connected</h3>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                <div>
                                    <div className="flex items-center">
                                        <span className="bg-primary-light dark:bg-primary-dark bg-opacity-20 px-3 py-1.5 rounded-md font-mono">
                                            <Address address={blockchainAddress} />
                                        </span>
                                        <CopyButton text={blockchainAddress} className="ml-2" />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Connected with MetaMask
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnectBlockchain}
                                    className="mt-4 sm:mt-0"
                                >
                                    Disconnect
                                </Button>
                            </div>

                            {/* Network Information */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium mb-2">Network Information</h4>
                                <div className="bg-gray-50 dark:bg-dark-light rounded-lg p-3">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">
                                        <div>
                                            <span className="block font-medium text-gray-500 dark:text-gray-400">
                                                Chain ID
                                            </span>
                                            <span>Polygon Amoy Testnet (80001)</span>
                                        </div>
                                        <div>
                                            <span className="block font-medium text-gray-500 dark:text-gray-400">
                                                Status
                                            </span>
                                            <span className="flex items-center">
                                                {networkSupported ? (
                                                    <>
                                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                                        Connected
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                                                        Wrong Network
                                                        <button
                                                            onClick={switchNetwork}
                                                            className="ml-2 text-primary underline hover:no-underline"
                                                        >
                                                            Switch
                                                        </button>
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-6">
                            <h3 className="text-lg font-medium mb-6">Connect Your Wallet</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Connect your Ethereum wallet to interact with VeriChain.
                            </p>
                            <Button
                                variant="primary"
                                onClick={handleConnectBlockchain}
                                disabled={isBlockchainConnecting}
                                startIcon={<ChipIcon className="h-5 w-5" />}
                            >
                                {isBlockchainConnecting ? 'Connecting...' : 'Connect with MetaMask'}
                            </Button>

                            {!networkSupported && blockchainAddress && (
                                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 rounded-md">
                                    <p className="text-sm">
                                        Please switch to the Polygon Amoy Testnet to use this application.
                                    </p>
                                    <button
                                        onClick={switchNetwork}
                                        className="text-sm underline hover:no-underline mt-1"
                                    >
                                        Switch Network
                                    </button>
                                </div>
                            )}

                            {blockchainError && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                                    <p className="text-sm">{blockchainError}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Arweave Storage Wallet Section */}
            {(!showBoth || currentTab === 'storage') && (
                <Card>
                    {isArweaveInitialized && arweaveAddress ? (
                        <div className="p-4">
                            <h3 className="text-lg font-medium mb-2">AR.IO Storage Wallet Connected</h3>
                            <p className="text-sm mb-3">Your certificates will be permanently stored on AR.IO testnet.</p>

                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-3">
                                <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="flex-grow">
                                        <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                                        <div className="flex items-center">
                                            <p className="font-mono text-sm break-all">{arweaveAddress}</p>
                                            <CopyButton text={arweaveAddress} className="ml-2" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Connected with {arweaveWalletType === 'arconnect' ? 'ArConnect' :
                                                arweaveWalletType === 'jwk' ? 'JWK Wallet' : 'Demo Wallet'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsTokenModalOpen(true)}
                                            startIcon={<CurrencyDollarIcon className="h-4 w-4" />}
                                        >
                                            Request Tokens
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={disconnectArweave}
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-green-700 dark:text-green-300 text-sm">
                                <div className="flex">
                                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mr-2" />
                                    <p>Storage is ready for certificate issuance on AR.IO testnet.</p>
                                </div>
                            </div>

                            {arweaveSuccessMessage && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-700 dark:text-blue-300 text-sm">
                                    {arweaveSuccessMessage}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex items-start mb-4">
                                <ExclamationIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 mr-2" />
                                <div>
                                    <h3 className="text-lg font-medium">Initialize AR.IO Storage</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mt-1 mb-4">
                                        VeriChain needs to connect to AR.IO network for permanent certificate storage.
                                        Your certificates will be stored permanently on the AR.IO testnet.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {isWalletExtensionAvailable('arconnect') && (
                                    <Button
                                        variant="primary"
                                        onClick={handleConnectWithArConnect}
                                        disabled={isArweaveLoading}
                                        isLoading={isArweaveLoading}
                                        fullWidth
                                        startIcon={<CubeIcon className="h-5 w-5" />}
                                    >
                                        Connect with ArConnect
                                    </Button>
                                )}

                                <Button
                                    variant="primary"
                                    onClick={handleConnectDemoStorage}
                                    disabled={isArweaveLoading}
                                    isLoading={isArweaveLoading}
                                    fullWidth
                                >
                                    Use Demo Storage (Recommended)
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => setIsArweaveModalOpen(true)}
                                    disabled={isArweaveLoading}
                                    fullWidth
                                >
                                    Connect Arweave Wallet
                                </Button>

                                <p className="text-xs text-gray-500 text-center mt-2">
                                    For this demo, we recommend using the demo storage option or ArConnect.
                                </p>
                            </div>

                            {arweaveError && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
                                    <p className="text-sm">{arweaveError}</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Arweave Wallet Connection Modal */}
            <Modal
                isOpen={isArweaveModalOpen}
                onClose={() => setIsArweaveModalOpen(false)}
                title="Connect Arweave Wallet"
                size="md"
            >
                <div className="p-4 space-y-4">
                    {arweaveError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4">
                            {arweaveError}
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Connect your Arweave wallet to store certificate metadata permanently on the AR.IO testnet.
                        </p>
                    </div>

                    {/* ArConnect Option */}
                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Connect with ArConnect</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            The most convenient way to connect. Requires the ArConnect/Wander browser extension.
                        </p>
                        <Button
                            variant="primary"
                            onClick={handleConnectWithArConnect}
                            disabled={!isWalletExtensionAvailable('arconnect') || isArweaveLoading}
                            isLoading={isArweaveLoading}
                            fullWidth
                        >
                            {isWalletExtensionAvailable('arconnect')
                                ? 'Connect with ArConnect'
                                : 'ArConnect Not Installed'}
                        </Button>
                        {!isWalletExtensionAvailable('arconnect') && (
                            <p className="text-xs text-gray-500 mt-2">
                                <a
                                    href="https://www.arconnect.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Install ArConnect
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
                            onClick={handleConnectWithFile}
                            disabled={!walletFile || isArweaveLoading}
                            isLoading={isArweaveLoading}
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
                            onClick={handleConnectWithKey}
                            disabled={!walletKey.trim() || isArweaveLoading}
                            isLoading={isArweaveLoading}
                            fullWidth
                        >
                            Connect with JSON
                        </Button>
                    </Card>
                </div>
            </Modal>

            {/* Token Request Modal */}
            <Modal
                isOpen={isTokenModalOpen}
                onClose={() => setIsTokenModalOpen(false)}
                title="Request AR.IO Testnet Tokens"
                size="md"
            >
                <div className="p-4 space-y-4">
                    {arweaveError && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md mb-4">
                            {arweaveError}
                        </div>
                    )}

                    <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            Request testnet tokens to use for storing certificates on the AR.IO testnet.
                            These tokens have no real-world value and are only for testing purposes.
                        </p>
                    </div>

                    <Card className="p-4">
                        <h3 className="text-md font-medium mb-3">Token Amount</h3>
                        <div className="mb-4">
                            <TextInput
                                type="number"
                                min="1"
                                max="1000"
                                value={tokenAmount}
                                onChange={(e) => setTokenAmount(e.target.value)}
                                placeholder="100"
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter the number of AR.IO testnet tokens to request (1-1000)
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Button
                                variant="primary"
                                onClick={handleRequestTokens}
                                disabled={isArweaveLoading}
                                isLoading={isArweaveLoading}
                                fullWidth
                                startIcon={<CurrencyDollarIcon className="h-5 w-5" />}
                            >
                                Request Tokens
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsTokenModalOpen(false)}
                                disabled={isArweaveLoading}
                                fullWidth
                            >
                                Cancel
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                            Note: You may need to complete a captcha to prevent abuse.
                            A new window will open for this purpose.
                        </p>
                    </Card>
                </div>
            </Modal>
        </div>
    );
};

export default WalletManager;