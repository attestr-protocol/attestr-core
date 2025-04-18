import { useState, useEffect } from 'react';
import { useAddress, useDisconnect, useMetamask } from '@thirdweb-dev/react';
import { DocumentDuplicateIcon } from '@heroicons/react/outline';

/**
 * Wallet Connection Component
 * 
 * @param {Object} props
 * @param {Function} props.onConnect - Callback when wallet connects
 * @param {Function} props.onDisconnect - Callback when wallet disconnects
 */
const WalletConnect = ({ onConnect, onDisconnect }) => {
    const address = useAddress();
    const connectWithMetamask = useMetamask();
    const disconnectWallet = useDisconnect();
    const [copied, setCopied] = useState(false);

    // Call onConnect/onDisconnect callbacks when wallet state changes
    useEffect(() => {
        if (address && onConnect) {
            onConnect(address);
        } else if (!address && onDisconnect) {
            onDisconnect();
        }
    }, [address, onConnect, onDisconnect]);

    // Copy address to clipboard
    const copyToClipboard = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Format address for display
    const formatAddress = (addr) => {
        if (!addr) {
            return '';
        }
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="card">
            {address ?
                <div>
                    <h3 className="text-xl font-bold mb-4">Wallet Connected</h3>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center">
                                <span className="bg-primary-light dark:bg-primary-dark bg-opacity-20 px-3 py-1.5 rounded-md font-mono">
                                    {formatAddress(address)}
                                </span>
                                <button
                                    onClick={copyToClipboard}
                                    className={`ml-2 p-1 rounded ${copied ? 'text-green-500' : 'text-gray-500 hover:text-primary'
                                        }`}
                                    title={copied ? 'Copied!' : 'Copy address'}
                                >
                                    <DocumentDuplicateIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                Connected with MetaMask
                            </p>
                        </div>
                        <button
                            onClick={disconnectWallet}
                            className="btn-secondary"
                        >
                            Disconnect
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium mb-2">Network Information</h4>
                        <div className="bg-gray-50 dark:bg-dark-light rounded-md p-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 text-sm">
                                <div>
                                    <span className="block font-medium text-gray-500 dark:text-gray-400">
                                        Chain ID
                                    </span>
                                    <span>Mumbai Testnet (80001)</span>
                                </div>
                                <div>
                                    <span className="block font-medium text-gray-500 dark:text-gray-400">
                                        Status
                                    </span>
                                    <span className="flex items-center">
                                        <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                                        Connected
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                :
                <div className="text-center py-6">
                    <h3 className="text-xl font-bold mb-4">Connect Your Wallet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Connect your Ethereum wallet to interact with VeriChain.
                    </p>
                    <button
                        onClick={connectWithMetamask}
                        className="btn-primary"
                    >
                        Connect with MetaMask
                    </button>
                </div>}
        </div>
    );
};

export default WalletConnect;