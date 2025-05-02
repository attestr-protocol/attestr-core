// components/molecules/storage/ArweaveStorageInit.jsx
import React, { useState, useEffect } from 'react';
import { useArweave } from '../../../contexts/ArweaveContext';
import Card from '../../molecules/cards/Card';
import Button from '../../atoms/buttons/Button';
import WalletConnectButton from '../../wallet/WalletConnectButton';
import { CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/outline';

/**
 * Component to manage Arweave storage initialization
 * This component handles both real Arweave and fallback storage
 */
const ArweaveStorageInit = ({
    onStorageReady,
    showStatus = true,
    className = '',
    ...props
}) => {
    const {
        isInitialized,
        walletAddress,
        useFallback,
        isLoading,
        error: arweaveError,
        generateTestWallet
    } = useArweave();

    const [hasStorage, setHasStorage] = useState(false);
    const [error, setError] = useState(null);

    // Check storage status when component mounts or deps change
    useEffect(() => {
        const storageAvailable = isInitialized || useFallback;
        setHasStorage(storageAvailable);

        // Notify parent if storage is ready
        if (storageAvailable && onStorageReady) {
            onStorageReady(true);
        }
    }, [isInitialized, useFallback, onStorageReady]);

    // Update error state when Arweave error changes
    useEffect(() => {
        if (arweaveError) {
            setError(arweaveError);
        }
    }, [arweaveError]);

    // Handle using demo storage
    const handleUseDemoStorage = async () => {
        setError(null);
        try {
            await generateTestWallet();
        } catch (err) {
            console.error('Error initializing demo storage:', err);
            setError(err.message || 'Failed to initialize demo storage');
        }
    };

    // If storage is initialized and we don't need to show status, don't render anything
    if (hasStorage && !showStatus) {
        return null;
    }

    // If storage is initialized and we want to show status
    if (hasStorage && showStatus) {
        return (
            <Card className={`bg-green-50 dark:bg-green-900 dark:bg-opacity-20 ${className}`} {...props}>
                <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                            Storage System Ready
                        </h3>
                        <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                            <p>{useFallback
                                ? 'Using development mode storage. Your certificates will be stored locally for this demo.'
                                : 'Your certificates will be stored on the Arweave network.'}</p>
                            {walletAddress && !useFallback && (
                                <p className="mt-1 font-mono text-xs">Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}</p>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    // If storage is not initialized
    return (
        <Card className={`border border-amber-300 ${className}`} {...props}>
            <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                    <InformationCircleIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Set Up Storage
                    </h3>

                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <p className="mb-4">
                            VeriChain needs to set up storage for credential data before
                            you can issue certificates. This stores metadata permanently.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-md text-red-700 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col md:flex-row gap-4">
                            <Button
                                variant="primary"
                                onClick={handleUseDemoStorage}
                                isLoading={isLoading}
                                disabled={isLoading}
                            >
                                Use Demo Storage
                            </Button>

                            <WalletConnectButton className="flex-shrink-0" />
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                            For this demo, we recommend using the demo storage option.
                            In production, you would connect to a real Arweave wallet.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ArweaveStorageInit;