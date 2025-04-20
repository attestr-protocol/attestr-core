// components/organisms/certificate/CertificateList.js
import React from 'react';
import CertificateCard from './CertificateCard';
import Badge from '../../atoms/display/Badge';

/**
 * Display a list of certificates
 * 
 * @param {Object} props
 * @param {Array} props.certificates - Array of certificate objects
 * @param {Function} props.onShare - Share callback
 * @param {Function} props.onView - View callback
 * @param {boolean} props.isLoading - Whether data is loading
 */
const CertificateList = ({
    certificates = [],
    onShare,
    onView,
    isLoading = false,
    emptyMessage = 'No certificates found',
    title = 'Certificates',
    className = '',
    ...props
}) => {
    if (isLoading) {
        return (
            <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading certificates...</p>
            </div>
        );
    }

    return (
        <div className={className} {...props}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <Badge
                    variant="primary"
                    text={`${certificates.length} Certificates`}
                />
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
                <div className="card text-center py-8">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {emptyMessage}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CertificateList;

