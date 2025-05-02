// components/organisms/verification/VerificationResult.js
import React from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    DocumentDuplicateIcon,
    FingerPrintIcon,
    CalendarIcon,
    UserIcon,
    OfficeBuildingIcon,
    ExternalLinkIcon,
    ShareIcon
} from '@heroicons/react/outline';
import Card from '../../molecules/cards/Card';
import Status from '../../atoms/display/Status';
import Button from '../../atoms/buttons/Button';
import { formatDate } from '../../../utils/formatting/dateFormat';

/**
 * Enhanced verification result component
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
            <Card
                variant="outline"
                color="error"
                className="border-2 max-w-3xl mx-auto"
            >
                <div className="flex flex-col items-center text-center py-6">
                    <div className="h-16 w-16 bg-error bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                        <XCircleIcon className="h-10 w-10 text-error" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Certificate Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mb-6">
                        We could not find this certificate on the blockchain. Please check the certificate ID and try again.
                    </p>
                    <Button
                        variant="primary"
                        href="/verify"
                    >
                        Try Another Certificate
                    </Button>
                </div>
            </Card>
        );
    }

    // Status configuration
    const statusConfig = {
        valid: {
            icon: CheckCircleIcon,
            title: 'Certificate Verified',
            description: 'This certificate has been verified as authentic on the blockchain.',
            color: 'success',
        },
        invalid: {
            icon: XCircleIcon,
            title: 'Certificate Invalid',
            description: 'We could not verify this certificate on the blockchain.',
            color: 'error',
        },
        expired: {
            icon: CalendarIcon,
            title: 'Certificate Expired',
            description: 'This certificate is authentic but has expired.',
            color: 'warning',
        },
        revoked: {
            icon: XCircleIcon,
            title: 'Certificate Revoked',
            description: 'This certificate has been revoked by the issuer.',
            color: 'error',
        },
    };

    const config = statusConfig[status] || statusConfig.valid;
    const StatusIcon = config.icon;

    // Credential title
    const credentialTitle = metadata?.credential?.title || 'Blockchain Certificate';

    // Recipient name
    const recipientName = metadata?.recipient?.name || 'Not specified';

    // Issuer name
    const issuerName = metadata?.issuer?.name || 'Not specified';

    // Get Arweave transaction ID from metadataURI if available
    const arweaveTxId = certificate.metadataURI ? certificate.metadataURI.replace('ar://', '') : null;

    // Certificate actions
    const handleCopyId = () => {
        navigator.clipboard.writeText(certificate.certificateId);
        // Could show a toast notification here
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: credentialTitle,
                text: `Check out this verified blockchain credential: ${credentialTitle}`,
                url: window.location.href,
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(window.location.href);
            // Could show a toast notification here
        }
    };

    return (
        <div className={className} {...props}>
            {/* Status Card */}
            <Card
                variant="outline"
                color={config.color}
                className="border-2 max-w-3xl mx-auto mb-8"
            >
                <div className="flex items-center">
                    <div className={`h-16 w-16 bg-${config.color} bg-opacity-10 rounded-full flex items-center justify-center mr-6`}>
                        <StatusIcon className={`h-8 w-8 text-${config.color}`} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {config.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            {config.description}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Certificate Details */}
            <Card className="max-w-4xl mx-auto mb-8">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {credentialTitle}
                        </h1>
                        <Status status={status} />
                    </div>

                    {metadata?.credential?.description && (
                        <p className="text-gray-600 dark:text-gray-300 mt-3">
                            {metadata.credential.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            startIcon={<DocumentDuplicateIcon className="h-5 w-5" />}
                            onClick={handleCopyId}
                        >
                            Copy ID
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            startIcon={<ShareIcon className="h-5 w-5" />}
                            onClick={handleShare}
                        >
                            Share
                        </Button>

                        {arweaveTxId && (
                            <a
                                href={`https://viewblock.io/arweave/tx/${arweaveTxId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    startIcon={<ExternalLinkIcon className="h-5 w-5" />}
                                >
                                    View on Arweave
                                </Button>
                            </a>
                        )}
                    </div>
                </div>

                {/* Certificate Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Credential Details
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                    <CalendarIcon className="h-5 w-5 mr-2" />
                                    <span className="text-sm">Issue Date</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatDate(certificate.issueDate, 'full')}
                                </p>
                            </div>

                            {certificate.expiryDate && (
                                <div>
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                        <CalendarIcon className="h-5 w-5 mr-2" />
                                        <span className="text-sm">Expiry Date</span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {formatDate(certificate.expiryDate, 'full')}
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                    <FingerPrintIcon className="h-5 w-5 mr-2" />
                                    <span className="text-sm">Certificate ID</span>
                                </div>
                                <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                                    {certificate.certificateId}
                                </p>
                            </div>

                            {arweaveTxId && (
                                <div>
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                        <FingerPrintIcon className="h-5 w-5 mr-2" />
                                        <span className="text-sm">Arweave TX ID</span>
                                    </div>
                                    <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                                        {arweaveTxId}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Issuer & Recipient
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                    <UserIcon className="h-5 w-5 mr-2" />
                                    <span className="text-sm">Recipient</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                    {recipientName}
                                </p>
                                {metadata?.recipient?.wallet && (
                                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                        {metadata.recipient.wallet}
                                    </p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                                    <OfficeBuildingIcon className="h-5 w-5 mr-2" />
                                    <span className="text-sm">Issuer</span>
                                </div>
                                <p className="font-medium text-gray-900 dark:text-white mb-1">
                                    {issuerName}
                                </p>
                                {metadata?.issuer?.website && (
                                    <a
                                        href={metadata.issuer.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary dark:text-primary-light text-sm hover:underline"
                                    >
                                        {metadata.issuer.website}
                                    </a>
                                )}
                                {metadata?.issuer?.wallet && (
                                    <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1">
                                        {metadata.issuer.wallet}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Metadata */}
                {metadata?.additional && Object.keys(metadata.additional).length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                            Additional Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            {Object.entries(metadata.additional).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Record Verification Section */}
            {onRecordVerification && status === 'valid' && (
                <Card
                    variant="outline"
                    className="max-w-3xl mx-auto"
                >
                    <div className="flex items-center mb-4">
                        <FingerPrintIcon className="h-6 w-6 text-primary dark:text-primary-light mr-3" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Record Your Verification
                        </h3>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Record your verification of this certificate on the blockchain for audit purposes. This creates a permanent record of your verification.
                    </p>

                    {verificationResult ? (
                        <div className={`p-4 rounded-lg ${verificationResult.success
                            ? 'bg-success-light dark:bg-success dark:bg-opacity-20'
                            : 'bg-error-light dark:bg-error dark:bg-opacity-20'
                            }`}>
                            {verificationResult.success ? (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-success-dark dark:text-success-light flex items-center">
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Verification Recorded Successfully
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Your verification has been recorded on the blockchain.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Verification ID</p>
                                            <p className="text-sm font-mono break-all">
                                                {verificationResult.verificationId}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Transaction Hash</p>
                                            <p className="text-sm font-mono break-all">
                                                {verificationResult.transactionHash}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="font-bold text-error-dark dark:text-error-light flex items-center">
                                        <XCircleIcon className="h-5 w-5 mr-2" />
                                        Verification Failed
                                    </h4>
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
                            isLoading={isRecording}
                        >
                            {isRecording ? 'Recording Verification...' : 'Record My Verification'}
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );
};

export default VerificationResult;