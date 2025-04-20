// components/organisms/verification/VerificationResult.js
import React from 'react';
import {
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/solid';
import StatusCard from '../../molecules/cards/StatusCard';
import MetadataDisplay from '../../molecules/blockchain/MetadataDisplay';
import BlockchainDetails from '../../molecules/blockchain/BlockchainDetails';
import Button from '../../atoms/buttons/Button';

/**
 * Component for displaying verification results
 * 
 * @param {Object} props
 * @param {Object} props.certificate - Certificate data
 * @param {Object} props.metadata - Certificate metadata
 * @param {string} props.status - Verification status
 * @param {Function} props.onRecordVerification - Callback for recording verification
 * @param {boolean} props.isRecording - Whether recording verification is in progress
 * @param {Object} props.verificationResult - Result of recording verification
 */
const VerificationResult = ({
    certificate,
    metadata,
    status = 'valid',
    onRecordVerification,
    isRecording = false,
    verificationResult,
    className = '',
    ...props
}) => {
    // If certificate data is not available
    if (!certificate) {
        return (
            <StatusCard
                status="invalid"
                title="Certificate Not Found"
                message="We could not find this certificate on the blockchain."
                className={className}
                {...props}
            >
                <Button
                    variant="primary"
                    onClick={() => window.location.href = '/verify'}
                    className="mt-4"
                >
                    Try Another Certificate
                </Button>
            </StatusCard>
        );
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={className} {...props}>
            {/* Status Card */}
            <StatusCard
                status={status}
                className="mb-6"
            />

            {/* Certificate Content */}
            <div className="card mb-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-primary-light dark:bg-primary-dark rounded-lg flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                        </svg>
                    </div>
                    <div className="text-right">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Certificate ID
                        </h3>
                        <p className="text-sm font-mono">
                            {certificate.certificateId}
                        </p>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-4">
                    {metadata?.credential?.title || 'Blockchain Certificate'}
                </h1>

                {metadata?.credential?.description && (
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                        {metadata.credential.description}
                    </p>
                )}

                {/* Display certificate metadata */}
                <MetadataDisplay metadata={metadata} />
            </div>

            {/* Blockchain Information */}
            <div className="card mb-6">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                    Blockchain Verification
                </h2>

                <BlockchainDetails
                    certificateId={certificate.certificateId}
                    issuerAddress={certificate.issuer}
                    recipientAddress={certificate.recipient}
                    metadataURI={certificate.metadataURI}
                />
            </div>

            {/* Verification Actions */}
            {onRecordVerification && (
                <div className="card">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-primary mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                            />
                        </svg>
                        Record Verification
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Record your verification of this certificate on the blockchain for audit purposes.
                    </p>

                    {verificationResult ? (
                        <div className={`p-4 rounded-lg ${verificationResult.success
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-red-100 dark:bg-red-900'
                            }`}>
                            {verificationResult.success ? (
                                <div>
                                    <h3 className="font-bold text-green-700 dark:text-green-300 mb-2">
                                        Verification Recorded Successfully
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                                        Your verification has been recorded on the blockchain.
                                    </p>
                                    <p className="text-sm font-mono break-all">
                                        Verification ID: {verificationResult.verificationId}
                                    </p>
                                    <p className="text-sm font-mono break-all">
                                        Transaction Hash: {verificationResult.transactionHash}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">
                                        Verification Failed
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {verificationResult.error || 'An error occurred while recording your verification.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Button
                            onClick={onRecordVerification}
                            disabled={isRecording}
                            variant="primary"
                        >
                            {isRecording ? 'Recording Verification...' : 'Record My Verification'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};