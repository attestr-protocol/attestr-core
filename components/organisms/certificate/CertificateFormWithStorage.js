// components/organisms/certificate/CertificateFormWithStorage.jsx
import React, { useState, useEffect } from 'react';
import CertificateForm from './CertificateForm';
import ArweaveInitializer from '../../molecules/storage/ArweaveInitializer';
import { useArweave } from '../../../contexts/ArweaveContext';
import { useCertificateStorage } from '../../../utils/hooks/useCertificateStorage';
import Modal from '../../molecules/modals/Modal';
import Card from '../../molecules/cards/Card';
import { ExclamationIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/outline';

/**
 * Enhanced certificate form that integrates with Arweave storage
 * Wraps the regular certificate form with storage initialization and processing
 */
const CertificateFormWithStorage = ({
    walletAddress,
    onIssued,
    className = '',
    ...props
}) => {
    const { isInitialized } = useArweave();
    const {
        storeCertificate,
        isStoring,
        error,
        success,
        initializeStorage
    } = useCertificateStorage();

    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState(null);

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
            // Add issuer wallet address to form data
            const certificateData = {
                ...formData,
                issuerWallet: walletAddress,
                issuerName: 'VeriChain', // Would be pulled from user profile in a real app
            };

            // Store certificate
            const result = await storeCertificate(certificateData);

            // Show result modal
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

            return { success: false, error: error.message };
        }
    };

    return (
        <div className={className} {...props}>
            {/* Show storage initializer if not initialized */}
            {!isInitialized && (
                <ArweaveInitializer
                    onInitialized={() => console.log('Storage initialized')}
                    className="mb-6"
                />
            )}

            {/* Certificate Form */}
            <CertificateForm
                onSubmit={handleSubmit}
                isSubmitting={isStoring}
                storageInitialized={isInitialized}
                onInitializeStorage={initializeStorage}
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
                                    <p className="mb-2">Your certificate has been permanently stored on Arweave and registered on the blockchain.</p>

                                    <div className="mt-4 space-y-2">
                                        <div>
                                            <p className="font-medium">Certificate ID:</p>
                                            <p className="font-mono text-xs break-all">
                                                {result?.blockchain?.certificateId}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-medium">Arweave Transaction ID:</p>
                                            <p className="font-mono text-xs break-all">
                                                {result?.arweave?.txId}
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <a
                                                href={`https://${process.env.NEXT_PUBLIC_ARWEAVE_HOST || 'arweave.net'}/${result?.arweave?.txId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary dark:text-primary-light hover:underline"
                                            >
                                                View on Arweave Explorer
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
                                            <li>Check your wallet connection</li>
                                            <li>Ensure you have sufficient funds for transaction fees</li>
                                            <li>Try again in a few moments</li>
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