// components/molecules/storage/PermanentStorageInfo.js
import React from 'react';
import { useArweave } from '../../../contexts/ArweaveContext';
import Card from '../cards/Card';
import Button from '../../atoms/buttons/Button';
import {
    InformationCircleIcon,
    CheckCircleIcon,
    ExclamationIcon,
    ExternalLinkIcon,
    CubeIcon
} from '@heroicons/react/outline';

/**
 * Component that displays information about permanent storage on AR.IO
 * and its current status
 */
const PermanentStorageInfo = ({
    showConnectButton = true,
    onConnectClick,
    className = '',
    ...props
}) => {
    const {
        isInitialized,
        walletAddress,
        walletType,
        isLoading
    } = useArweave();

    // Storage is ready when we have wallet address and initialization
    const isStorageReady = isInitialized && walletAddress;

    return (
        <Card
            className={`overflow-hidden ${className}`}
            {...props}
        >
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <CubeIcon className="h-6 w-6 text-secondary mr-2" />
                <h3 className="text-lg font-medium">AR.IO Permanent Storage</h3>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Status indicator */}
                <div className={`p-3 rounded-lg mb-4 ${isStorageReady
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    <div className="flex items-start">
                        {isStorageReady ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5 mr-2" />
                        ) : (
                            <ExclamationIcon className="h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 mr-2" />
                        )}
                        <div>
                            <h4 className={`text-sm font-medium ${isStorageReady
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-amber-800 dark:text-amber-300'}`}>
                                {isStorageReady
                                    ? 'Storage Ready'
                                    : 'Storage Not Initialized'}
                            </h4>
                            <p className={`text-sm ${isStorageReady
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-amber-700 dark:text-amber-400'}`}>
                                {isStorageReady
                                    ? `Connected with ${walletType === 'arconnect'
                                        ? 'ArConnect'
                                        : walletType === 'jwk'
                                            ? 'JWK Wallet'
                                            : 'Demo Wallet'}`
                                    : 'Storage must be initialized before issuing certificates'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Informational text */}
                <div className="space-y-4 mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        VeriChain uses the <strong>AR.IO Network testnet</strong> for permanent, decentralized
                        storage of credential metadata. This ensures your certificates:
                    </p>

                    <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc space-y-1 pl-5">
                        <li>Remain accessible even if the issuing institution no longer exists</li>
                        <li>Cannot be tampered with or modified after issuance</li>
                        <li>Are stored with full data permanence (for testnet, data is persisted for demonstration)</li>
                        <li>Can be verified by anyone, anywhere, anytime</li>
                    </ul>

                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        The AR.IO testnet provides a familiar environment for testing permanent storage
                        without using real funds. In production, VeriChain would use the AR.IO mainnet.
                    </p>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                    {showConnectButton && !isStorageReady && (
                        <Button
                            variant="primary"
                            onClick={onConnectClick}
                            disabled={isLoading}
                            isLoading={isLoading}
                            fullWidth
                        >
                            Initialize Storage
                        </Button>
                    )}
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            href="https://ar.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            fullWidth
                            endIcon={<ExternalLinkIcon className="h-4 w-4" />}
                        >
                            About AR.IO
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            href="https://ar-io.dev"
                            target="_blank"
                            rel="noopener noreferrer"
                            fullWidth
                            endIcon={<ExternalLinkIcon className="h-4 w-4" />}
                        >
                            AR.IO Testnet
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PermanentStorageInfo;