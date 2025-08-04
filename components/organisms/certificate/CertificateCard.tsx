// components/organisms/certificate/CertificateCard.tsx
import React from 'react';
import { ShareIcon, ExternalLinkIcon, DocumentDuplicateIcon } from '@heroicons/react/outline';
import Status from '../../atoms/display/Status';
import Card from '../../molecules/cards/Card';
import Address from '../../atoms/display/Address';
import Button from '../../atoms/buttons/Button';
import { formatDate } from '../../../utils/formatting/dateFormat';

interface Certificate {
    id: string;
    title: string;
    recipient: string | { name?: string };
    issuer: string | { name?: string };
    issuedDate: string;
    expiryDate?: string;
    isValid: boolean;
    revoked?: boolean;
    verificationUrl?: string;
    txHash?: string;
    arweaveId?: string;
    metadataURI?: string;
    credential?: {
        title?: string;
    };
    metadata?: {
        recipient?: {
            name?: string;
        };
        issuer?: {
            name?: string;
        };
        credential?: {
            title?: string;
        };
    };
}

interface CertificateCardProps {
    certificate: Certificate;
    showActions?: boolean;
    onShare?: (certificate: Certificate) => void;
    onView?: (certificate: Certificate) => void;
    className?: string;
}

/**
 * Enhanced certificate card component for displaying certificate information
 */
const CertificateCard: React.FC<CertificateCardProps> = ({
    certificate,
    showActions = true,
    onShare,
    onView,
    className = '',
    ...props
}) => {
    // Get certificate status
    const getCertificateStatus = () => {
        if (!certificate.isValid) {
            return certificate.revoked ? 'revoked' : 'invalid';
        }

        // Check if expired
        if (certificate.expiryDate) {
            const expiryDate = new Date(certificate.expiryDate);
            if (expiryDate < new Date()) {
                return 'expired';
            }
        }

        return 'valid';
    };

    const status = getCertificateStatus();

    // Border color based on status
    const getBorderColor = () => {
        switch (status) {
            case 'valid': return 'border-success';
            case 'expired': return 'border-warning';
            case 'revoked':
            case 'invalid': return 'border-error';
            default: return 'border-gray-300 dark:border-gray-700';
        }
    };

    // Determine recipient name
    const recipientName = typeof certificate.recipient === 'object' 
        ? certificate.recipient.name 
        : certificate.metadata?.recipient?.name ||
          <Address address={certificate.recipient} />;

    // Determine issuer name
    const issuerName = typeof certificate.issuer === 'object' 
        ? certificate.issuer.name 
        : certificate.metadata?.issuer?.name ||
          <Address address={certificate.issuer} />;

    // Get Arweave transaction ID from metadataURI if available
    const arweaveTxId = certificate.metadataURI?.startsWith('ar://') ?
        certificate.metadataURI.replace('ar://', '') : null;

    return (
        <Card
            variant="outline"
            className={`relative overflow-hidden border-l-4 ${getBorderColor()} ${className}`}
            hover
            {...props}
        >
            {/* Status indicator */}
            <div className="absolute top-0 right-0 p-4">
                <Status status={status} size="sm" />
            </div>

            <div className="flex flex-col md:flex-row justify-between">
                <div className="pr-16"> {/* padding to make room for status indicator */}
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                        {certificate.credential?.title || certificate.metadata?.credential?.title || 'Certificate'}
                    </h3>

                    <div className="mb-4 space-y-1">
                        <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">Issued to:</span> <span className="font-medium">{recipientName}</span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            <span className="text-gray-500 dark:text-gray-400">Issued by:</span> <span className="font-medium">{issuerName}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                            <span className="block font-medium text-gray-500 dark:text-gray-400">Issue Date</span>
                            {formatDate(certificate.issuedDate)}
                        </div>

                        {certificate.expiryDate && (
                            <div>
                                <span className="block font-medium text-gray-500 dark:text-gray-400">Expiry Date</span>
                                {formatDate(certificate.expiryDate)}
                            </div>
                        )}
                    </div>
                </div>

                {showActions && (
                    <div className="flex mt-4 md:mt-0 md:flex-col gap-2">
                        <Button
                            variant="ghost"
                            className="btn-icon"
                            title="Copy certificate ID"
                            onClick={() => {
                                navigator.clipboard.writeText(certificate.id);
                                // Could add a toast notification here
                            }}
                        >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                        </Button>

                        {onShare && (
                            <Button
                                variant="ghost"
                                className="btn-icon"
                                title="Share certificate"
                                onClick={() => onShare?.(certificate)}
                            >
                                <ShareIcon className="h-5 w-5" />
                            </Button>
                        )}

                        {onView && (
                            <Button
                                variant="ghost"
                                className="btn-icon"
                                title="View details"
                                onClick={() => onView?.(certificate)}
                            >
                                <ExternalLinkIcon className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">ID:</span>
                        <span className="text-xs font-mono truncate flex-grow">{certificate.id}</span>
                    </div>

                    {arweaveTxId && (
                        <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">Arweave:</span>
                            <span className="text-xs font-mono truncate flex-grow">{arweaveTxId}</span>
                            <a
                                href={`https://viewblock.io/arweave/tx/${arweaveTxId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline ml-2"
                            >
                                View
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default CertificateCard;