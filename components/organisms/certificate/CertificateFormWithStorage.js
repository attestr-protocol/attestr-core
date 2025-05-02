// components/organisms/certificate/CertificateFormWithStorage.jsx
import React, { useState, useEffect } from 'react';
import CertificateForm from './CertificateForm';
import ArWalletConnector from '../../wallet/ArWalletConnector';
import { useArweave } from '../../../contexts/ArweaveContext';
import { useCertificateContext } from '../../../contexts/CertificateContext';
import Modal from '../../molecules/modals/Modal';
import Card from '../../molecules/cards/Card';
import { CheckCircleIcon, XCircleIcon, ExclamationIcon } from '@heroicons/react/outline';
import Button from '../../atoms/buttons/Button';
import { isStorageInitialized } from '../../../utils/storage/arweaveStorage';

/**
 * Enhanced certificate form that integrates with AR.io testnet storage
 */
const CertificateFormWithStorage = ({
    walletAddress,
    onIssued,
    className = '',
    ...props
}) => {
    const { issueCertificate } = useCertificateContext();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isArweaveReady, setIsArweaveReady] = useState(false);
    const [arweaveAddress, setArweaveAddress] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);
    const [showStorageInfo, setShowStorageInfo] = useState(true);

    // Check Arweave storage status on mount
    useEffect(() => {
        checkArweaveStatus();
    }, []);

    // Check if Arweave storage is initialized
    const checkArweaveStatus = async () => {
        const ready = isStorageInitialized();
        setIsArweaveReady(ready);
    };

    // Handle Arweave wallet connected
    const handleArweaveConnected = (address) => {
        setArweaveAddress(address);
        setIsArweaveReady(true);
        setShowStorageInfo(false);
    };

    // Handle Arweave wallet disconnected
    const handleArweaveDisconnected = () => {
        setArweaveAddress(null);
        setIsArweaveReady(false);
        setShowStorageInfo(true);
    };

    // Reset state when result modal is closed
    const handleCloseResult = () => {
        setShowResult(false);

        // If issuance was successful and callback provided, call it
        if (result?.success && onIssued) {
            onIssued(result);
        }
    };

    // Handle form submission
    const handleSubmit = async (formData) => {
        try {
            setIsSubmitting(true);
            setError(null);

            // Check if Arweave storage is ready
            if (!isArweaveReady) {
                throw new Error('Arweave storage not initialized. Please connect your AR.io wallet first.');
            }

            // Add issuer wallet address to form data
            const certificateData = {
                ...formData,
                issuerWallet: walletAddress,
                issuerName: 'VeriChain Institution', // Would be pulled from user profile in a real app
            };

            // Issue certificate on blockchain with Arweave metadata
            const result = await issueCertificate(certificateData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to issue certificate');
            }

            // Show success result
            setResult(result);
            setShowResult(true);

            return result;
        } catch (error) {
            console.error('Error issuing certificate:', error);

            setResult({
                success: false,
                error: error.message || 'An unexpected error occurred'
            });
            setShowResult(true);
            setError(error.message || 'Failed to issue certificate');

            return { success: false, error: error.message };
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={className} {...props}>
            {/* Arweave Storage Info */}
            {showStorageInfo && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 mb-6">
                    <div className="flex items-start p-4">
                        <div className="flex-shrink-0">
                            <ExclamationIcon className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                AR.io Testnet Storage Required
                            </h3>
                            <div className="mt-2 text-sm text-blue-600 dark:text-blue-300">
                                <p className="mb-3">
                                    VeriChain needs to connect to the AR.io testnet to store certificate metadata.
                                    Please connect your AR.io wallet to continue.
                                </p>
                                <ArWalletConnector
                                    onConnected={handleArweaveConnected}
                                    onDisconnected={handleArweaveDisconnected}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Certificate Form */}
            <CertificateForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                storageInitialized={isArweaveReady}
                error={error}
            />

            {/* Result Modal */}
            <Modal
                isOpen={showResult}
                onClose={handleCloseResult}
                title={result?.success ? "Certificate Issued" : "Issuance Failed"}
            >
                {result?.success ? (
                    <Card className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border-0 p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
                                    Certificate Issued Successfully
                                </h3>
                                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                                    <p className="mb-2">Your certificate has been permanently stored on AR.io testnet and registered on the blockchain.</p>

                                    <div className="mt-4 space-y-2">
                                        <div>
                                            <p className="font-medium">Certificate ID:</p>
                                            <p className="font-mono text-xs break-all">
                                                {result.certificateId}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-medium">Arweave Transaction ID:</p>
                                            <p className="font-mono text-xs break-all">
                                                {result.metadataURI?.replace('ar://', '')}
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <a
                                                href={`https://ar-io.net/${result.metadataURI?.replace('ar://', '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary dark:text-primary-light hover:underline"
                                            >
                                                View on AR.io Explorer
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border-0 p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <XCircleIcon className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                                    Certificate Issuance Failed
                                </h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                    <p>{result?.error || 'An unexpected error occurred while issuing the certificate.'}</p>

                                    <div className="mt-4">
                                        <p className="font-medium">Troubleshooting:</p>
                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                            <li>Check your AR.io wallet balance and make sure you have testnet tokens</li>
                                            <li>Check both your Ethereum and AR.io wallet connections</li>
                                            <li>Try again with a smaller certificate description</li>
                                            <li>Reload the page and try again</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </Modal>
        </div>
    );
};

export default CertificateFormWithStorage;