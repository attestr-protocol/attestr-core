// components/molecules/storage/ArweaveInitializer.jsx
import React, { useState, useEffect } from 'react';
import { useArweave } from '../../../contexts/ArweaveContext';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import { InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/outline';

/**
 * Component to initialize Arweave storage
 * Provides info and UI to initialize storage for certificate metadata
 */
const ArweaveInitializer = ({ onInitialized, className = '', ...props }) => {
    const {
        isInitialized,
        isLoading,
        error,
        walletAddress,
        successMessage,
        generateTestWallet,
        initialize
    } = useArweave();

    const [showAdvanced, setShowAdvanced] = useState(false);

    // Notify parent component when initialization status changes
    useEffect(() => {
        if (isInitialized && onInitialized) {
            onInitialized(true);
        }
    }, [isInitialized, onInitialized]);

    // Handle generating test wallet for demo purposes
    const handleGenerateTestWallet = async () => {
        await generateTestWallet();
    };

    // If already initialized, just show status
    if (isInitialized) {
        return (
            <Card className={`bg-green-50 dark:bg-green-900 dark:bg-opacity-20 ${className}`} {...props}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                            Arweave Storage Initialized
                        </h3>
                        <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                            <p>Your certificates will be stored permanently on the Arweave network.</p>
                            {walletAddress && (
                                <p className="mt-1 font-mono text-xs">Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`border border-amber-300 ${className}`} {...props}>
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    <InformationCircleIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Initialize Arweave Storage
                    </h3>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <p className="mb-4">
                            VeriChain uses Arweave for permanent storage of credential metadata.
                            Before issuing certificates, we need to set up storage.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-md text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-md text-green-700 dark:text-green-300">
                                {successMessage}
                            </div>
                        )}

                        <div className="mt-4 space-y-4">
                            <div>
                                <Button
                                    variant="primary"
                                    onClick={handleGenerateTestWallet}
                                    isLoading={isLoading}
                                    disabled={isLoading}
                                    fullWidth
                                >
                                    Initialize Demo Storage
                                </Button>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                    For demonstration purposes, this will create a temporary Arweave wallet.
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="text-sm text-primary dark:text-primary-light hover:underline"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                >
                                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                                </button>

                                {showAdvanced && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-light rounded-md">
                                        <h4 className="font-medium mb-2">Production Options</h4>
                                        <p className="text-sm mb-4">
                                            In a production environment, you would connect to a real Arweave wallet with AR tokens.
                                        </p>

                                        <div className="space-y-3">
                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('https://www.arweave.org/', '_blank')}
                                                fullWidth
                                            >
                                                Get Arweave Wallet
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => window.open('https://www.arconnect.io/', '_blank')}
                                                fullWidth
                                            >
                                                Install ArConnect
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ArweaveInitializer;