import { useState } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    DocumentDuplicateIcon,
    ShareIcon,
    ExternalLinkIcon
} from '@heroicons/react/outline';

/**
 * Certificate Card Component
 * 
 * @param {Object} props 
 * @param {Object} props.certificate - Certificate data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onShare - Share callback
 */
const CertificateCard = ({ certificate, showActions = true, onShare }) => {
    const [copied, setCopied] = useState(false);

    // Determine certificate status
    const getCertificateStatus = () => {
        if (!certificate.isValid) {
            return certificate.revoked
                ? { status: 'revoked', label: 'Revoked', icon: XCircleIcon, color: 'text-red-500' }
                : { status: 'invalid', label: 'Invalid', icon: XCircleIcon, color: 'text-red-500' };
        }

        // Check if expired
        if (certificate.expiryDate) {
            const expiryDate = new Date(certificate.expiryDate);
            if (expiryDate < new Date()) {
                return { status: 'expired', label: 'Expired', icon: ClockIcon, color: 'text-yellow-500' };
            }
        }

        return { status: 'valid', label: 'Valid', icon: CheckCircleIcon, color: 'text-green-500' };
    };

    const status = getCertificateStatus();
    const StatusIcon = status.icon;

    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) {
            return 'N/A';
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Copy certificate ID to clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(certificate.certificateId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Format wallet address for display
    const formatAddress = (address) => {
        if (!address) {
            return '';
        }
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className={`card border-l-4 ${status.status === 'valid' ? 'border-green-500' :
                status.status === 'expired' ? 'border-yellow-500' :
                    'border-red-500'
            }`}>
            <div className="flex flex-col md:flex-row justify-between">
                <div>
                    <div className="flex items-center mb-3">
                        <StatusIcon className={`h-5 w-5 ${status.color} mr-2`} />
                        <span className={`font-medium ${status.color}`}>{status.label}</span>
                    </div>

                    <h3 className="text-xl font-bold mb-1">{certificate.credential?.title || 'Certificate'}</h3>

                    <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            Issued to: <span className="font-medium">{certificate.recipient?.name || formatAddress(certificate.recipient)}</span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Issued by: <span className="font-medium">{certificate.issuer?.name || formatAddress(certificate.issuer)}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <span className="block font-medium">Issue Date</span>
                            {formatDate(certificate.issueDate)}
                        </div>

                        {certificate.expiryDate && (
                            <div>
                                <span className="block font-medium">Expiry Date</span>
                                {formatDate(certificate.expiryDate)}
                            </div>
                        )}
                    </div>
                </div>

                {showActions && (
                    <div className="flex mt-4 md:mt-0 md:flex-col gap-2">
                        <button
                            onClick={copyToClipboard}
                            className={`p-2 rounded ${copied ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                    'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light'
                                }`}
                            title={copied ? 'Copied!' : 'Copy certificate ID'}
                        >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>

                        <button
                            onClick={() => onShare && onShare(certificate)}
                            className="p-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light"
                            title="Share certificate"
                        >
                            <ShareIcon className="h-5 w-5" />
                        </button>

                        <a
                            href={`/verify/${certificate.certificateId}`}
                            className="p-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light"
                            title="View details"
                        >
                            <ExternalLinkIcon className="h-5 w-5" />
                        </a>
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">ID:</span>
                    <span className="text-xs font-mono truncate">{certificate.certificateId}</span>
                </div>
            </div>
        </div>
    );
};

export default CertificateCard;