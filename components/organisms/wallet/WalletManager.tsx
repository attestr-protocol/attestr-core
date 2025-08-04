// components/organisms/wallet/WalletManager.js
import React, { useState, useEffect } from 'react';
import { useWalletContext } from '../../../contexts/WalletContext';
// import { useArweave } from '../../../contexts/ArweaveContext';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import Modal from '../../molecules/modals/Modal';
import Address from '../../atoms/display/Address';
import CopyButton from '../../atoms/display/CopyButton';
import TextInput from '../../atoms/inputs/TextInput';
import TextArea from '../../atoms/inputs/TextArea';
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
interface WalletManagerProps {
    onBlockchainConnect?: (address: string) => void;
    onStorageConnect?: (address: string) => void;
    showBoth?: boolean;
    activeTab?: 'blockchain' | 'storage';
    className?: string;
}

const WalletManager: React.FC<WalletManagerProps> = ({
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
    const [arweaveError, setArweaveError] = useState<string | null>(null);
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

    // Arweave storage context - disabled
    // const {
    //     walletAddress: arweaveAddress,
    //     isInitialized: isArweaveInitialized,
    //     isLoading: isArweaveLoading,
    //     error: arweaveContextError,
    //     successMessage: arweaveSuccessMessage,
    //     walletType: arweaveWalletType,
    //     initializeWithArConnect,
    //     generateTestWallet,
    //     initialize: initializeArweave,
    //     disconnectWallet: disconnectArweave,
    //     requestTokens,
    //     isWalletExtensionAvailable
    // } = useArweave();

    // Set error from context - disabled
    // useEffect(() => {
    //     if (arweaveContextError) {
    //         setArweaveError(arweaveContextError);
    //     }
    // }, [arweaveContextError]);

    // Handle blockchain wallet connection
    const handleConnectBlockchain = async () => {
        try {
            await connectBlockchain();
            if (onBlockchainConnect) {
                onBlockchainConnect(blockchainAddress!);
            }
        } catch (error) {
            console.error('Error connecting blockchain wallet:', error);
        }
    };

    // Handle blockchain wallet disconnection
    const handleDisconnectBlockchain = async () => {
        await disconnectBlockchain();
    };

    // Handle storage wallet connection with demo wallet - disabled
    // const handleConnectDemoStorage = async () => {
    //     setArweaveError(null);
    //     try {
    //         await generateTestWallet();
    //         setIsArweaveModalOpen(false);
    //         if (onStorageConnect) {
    //             onStorageConnect(arweaveAddress!);
    //         }
    //     } catch (error) {
    //         console.error('Error generating demo wallet:', error);
    //         setArweaveError(error instanceof Error ? error.message : 'Failed to generate demo wallet');
    //     }
    // };

    // Handle ArConnect connection - disabled
    // const handleConnectWithArConnect = async () => {
    //     if (!isWalletExtensionAvailable('arconnect')) {
    //         setArweaveError('ArConnect extension not detected. Please install it first.');
    //         return;
    //     }

    //     try {
    //         const success = await initializeWithArConnect();
    //         if (success) {
    //             setIsArweaveModalOpen(false);
    //             if (onStorageConnect) {
    //                 onStorageConnect(arweaveAddress!);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error connecting with ArConnect:', error);
    //         setArweaveError(error instanceof Error ? error.message : 'Failed to connect with ArConnect');
    //     }
    // };

    // Handle file upload for Arweave wallet - disabled
    // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     if (!e.target.files || e.target.files.length === 0) {
    //         return;
    //     }

    //     const file = e.target.files[0];
    //     const reader = new FileReader();

    //     reader.onload = async (event) => {
    //         try {
    //             const fileContent = event.target?.result;
    //             const jsonWallet = JSON.parse(fileContent as string);
    //             setWalletFile(jsonWallet);
    //         } catch (err) {
    //             setArweaveError('Invalid wallet file. Please upload a valid Arweave JWK file.');
    //             setWalletFile(null);
    //         }
    //     };

    //     reader.readAsText(file);
    // };

    // Connect with Arweave wallet file - disabled
    // const handleConnectWithFile = async () => {
    //     if (!walletFile) {
    //         setArweaveError('Please upload a wallet file');
    //         return;
    //     }

    //     try {
    //         const success = await initializeArweave(walletFile, 'jwk');
    //         if (success) {
    //             setIsArweaveModalOpen(false);
    //             if (onStorageConnect) {
    //                 onStorageConnect(arweaveAddress!);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error connecting with wallet file:', error);
    //         setArweaveError(error instanceof Error ? error.message : 'Failed to connect with wallet file');
    //     }
    // };

    // Connect with pasted wallet key - disabled
    // const handleConnectWithKey = async () => {
    //     if (!walletKey.trim()) {
    //         setArweaveError('Please paste your wallet key');
    //         return;
    //     }

    //     try {
    //         let jsonWallet;
    //         try {
    //             jsonWallet = JSON.parse(walletKey);
    //         } catch (err) {
    //             throw new Error('Invalid wallet JSON. Please check the format.');
    //         }

    //         const success = await initializeArweave(jsonWallet, 'jwk');
    //         if (success) {
    //             setIsArweaveModalOpen(false);
    //             if (onStorageConnect) {
    //                 onStorageConnect(arweaveAddress!);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error connecting with key:', error);
    //         setArweaveError(error instanceof Error ? error.message : 'Failed to connect with wallet key');
    //     }
    // };

    // Request testnet tokens - disabled
    // const handleRequestTokens = async () => {
    //     if (!isArweaveInitialized) {
    //         setArweaveError('Wallet not initialized. Please connect a wallet first.');
    //         return;
    //     }

    //     try {
    //         const amount = parseInt(tokenAmount.toString(), 10);
    //         if (isNaN(amount) || amount <= 0) {
    //             throw new Error('Invalid token amount');
    //         }

    //         const result = await requestTokens(amount);
    //         if (result.success) {
    //             if (!result.captchaRequired) {
    //                 setIsTokenModalOpen(false);
    //             }
    //         } else {
    //             throw new Error(result.error || 'Failed to request tokens');
    //         }
    //     } catch (error) {
    //         console.error('Error requesting tokens:', error);
    //         setArweaveError(error instanceof Error ? error.message : 'Failed to request tokens');
    //     }
    // };

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

            {/* Storage Feature Disabled */}
            {(!showBoth || currentTab === 'storage') && (
                <Card>
                    <div className="p-6 text-center">
                        <h3 className="text-lg font-medium mb-4">Storage Feature Disabled</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Certificate storage functionality is temporarily disabled. Certificates will be stored on the blockchain only.
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-blue-700 dark:text-blue-300 text-sm">
                            This feature will be available in a future update.
                        </div>
                    </div>
                </Card>
            )}

        </div>
    );
};

export default WalletManager;