// components/organisms/certificate/CertificateList.js
import React from 'react';
import CertificateCard from './CertificateCard';
import Badge from '../../atoms/display/Badge';
import Button from '../../atoms/buttons/Button';
import { DocumentAddIcon, InformationCircleIcon } from '@heroicons/react/outline';

/**
 * Enhanced certificate list component
 * 
 * @param {Object} props
 * @param {Array} props.certificates - Array of certificate objects
 * @param {Function} props.onShare - Share callback
 * @param {Function} props.onView - View callback
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string} props.emptyMessage - Message to display when no certificates are found
 * @param {string} props.title - Section title
 * @param {Function} props.onRequestCertificate - Callback when user requests a certificate
 */
const CertificateList = ({
    certificates = [],
    onShare,
    onView,
    isLoading = false,
    emptyMessage = 'No certificates found',
    title = 'Certificates',
    onRequestCertificate,
    className = '',
    ...props
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading certificates...</p>
            </div>
        );
    }

    return (
        <div className={className} {...props}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <Badge
                        variant="primary"
                        text={`${certificates.length}`}
                        size="sm"
                    />
                </div>

                {onRequestCertificate && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onRequestCertificate}
                        startIcon={<DocumentAddIcon className="h-5 w-5" />}
                    >
                        Request Certificate
                    </Button>
                )}
            </div>

            {certificates.length > 0 ? (
                <div className="space-y-4">
                    {certificates.map((certificate) => (
                        <CertificateCard
                            key={certificate.certificateId}
                            certificate={certificate}
                            onShare={onShare}
                            onView={onView}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-dark rounded-full mb-4">
                        <InformationCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {emptyMessage}
                    </p>
                    {onRequestCertificate && (
                        <Button
                            variant="primary"
                            onClick={onRequestCertificate}
                            startIcon={<DocumentAddIcon className="h-5 w-5" />}
                        >
                            Request a Certificate
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CertificateList;