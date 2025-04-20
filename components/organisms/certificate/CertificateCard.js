// components/organisms/certificate/CertificateCard.js
import React, { useState } from 'react';
import {
    ShareIcon,
    ExternalLinkIcon
} from '@heroicons/react/outline';
import Status from '../../atoms/display/Status';
import CopyButton from '../../atoms/display/CopyButton';
import Address from '../../atoms/display/Address';

/**
 * CertificateCard component for displaying certificate information
 * 
 * @param {Object} props
 * @param {Object} props.certificate - Certificate data
 * @param {boolean} props.showActions - Whether to show action buttons
 * @param {Function} props.onShare - Share callback
 * @param {Function} props.onView - View callback
 */
const CertificateCard = ({
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

    // Get border color based on status
    const getBorderColor = () => {
        switch (status) {
            case 'valid':
                return 'border-green-500';
            case 'expired':
                return 'border-yellow-500';
            case 'revoked':
            case 'invalid':
                return 'border-red-500';
            default:
                return 'border-gray-300';
        }
    };

    // Determine recipient name
    const recipientName = certificate.recipient?.name ||
        certificate.metadata?.recipient?.name ||
        <Address address={certificate.recipient} />;

    // Determine issuer name
    const issuerName = certificate.issuer?.name ||
        certificate.metadata?.issuer?.name ||
        <Address address={certificate.issuer} />;

    // Card classes
    const cardClasses = [
        'card border-l-4',
        getBorderColor(),
        className
    ].join(' ');

    return (
        <div className={cardClasses} {...props}>
            <div className="flex flex-col md:flex-row justify-between">
                <div>
                    <div className="flex items-center mb-3">
                        <Status status={status} />
                    </div>

                    <h3 className="text-xl font-bold mb-1">
                        {certificate.credential?.title || certificate.metadata?.credential?.title || 'Certificate'}
                    </h3>

                    <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300">
                            Issued to: <span className="font-medium">{recipientName}</span>
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            Issued by: <span className="font-medium">{issuerName}</span>
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
                        <CopyButton
                            text={certificate.certificateId}
                            title="Copy certificate ID"
                        />

                        {onShare && (
                            <button
                                onClick={() => onShare(certificate)}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light"
                                title="Share certificate"
                            >
                                <ShareIcon className="h-5 w-5" />
                            </button>
                        )}

                        {onView && (
                            <button
                                onClick={() => onView(certificate)}
                                className="p-2 rounded text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-light"
                                title="View details"
                            >
                                <ExternalLinkIcon className="h-5 w-5" />
                            </button>
                        )}
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

