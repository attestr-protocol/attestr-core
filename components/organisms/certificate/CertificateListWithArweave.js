// components/organisms/certificate/CertificateListWithArweave.jsx
import React, { useState, useEffect } from 'react';
import CertificateList from './CertificateList';
import { arweaveCertificateService } from '../../../utils/services/arweavecertificateService';
import Button from '../../atoms/buttons/Button';
import { RefreshIcon } from '@heroicons/react/outline';

/**
 * Enhanced certificate list component that loads certificates from Arweave
 * 
 * @param {Object} props
 * @param {string} props.walletAddress - User's wallet address
 * @param {string} props.role - 'issuer' or 'recipient'
 * @param {Function} props.onShare - Share callback
 * @param {Function} props.onView - View callback
 */
const CertificateListWithArweave = ({
    walletAddress,
    role = 'recipient',
    onShare,
    onView,
    onRequestCertificate,
    className = '',
    ...props
}) => {
    const [certificates, setCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load certificates from Arweave
    const loadCertificates = async () => {
        if (!walletAddress) {
            setCertificates([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Call service to get user's certificates
            const result = await arweaveCertificateService.getUserCertificates(
                walletAddress,
                role
            );

            setCertificates(result);
        } catch (err) {
            console.error('Error loading certificates:', err);
            setError(err.message || 'Failed to load certificates');
        } finally {
            setIsLoading(false);
        }
    };

    // Load certificates when wallet changes
    useEffect(() => {
        loadCertificates();
    }, [walletAddress, role]);

    // Transform Arweave certificates to format expected by CertificateList
    const transformedCertificates = certificates.map(cert => ({
        certificateId: cert.id,
        arweaveTxId: cert.id,
        issuer: cert.issuer,
        recipient: cert.recipient,
        issueDate: cert.timestamp,
        metadata: cert.metadata,
        credential: {
            title: cert.metadata?.credential?.title || cert.title || 'Untitled Certificate'
        },
        status: 'valid', // Simplification - in a real app, you'd check the status
        viewUrl: cert.viewUrl
    }));

    return (
        <div className={className} {...props}>
            {/* Error message if loading failed */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 p-4 rounded-md text-red-700 dark:text-red-300 mb-4">
                    <p className="font-medium">Error loading certificates</p>
                    <p>{error}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={loadCertificates}
                        startIcon={<RefreshIcon className="h-4 w-4" />}
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Certificate list */}
            <CertificateList
                certificates={transformedCertificates}
                onShare={onShare}
                onView={onView}
                isLoading={isLoading}
                emptyMessage={
                    role === 'recipient'
                        ? "You haven't received any certificates yet"
                        : "You haven't issued any certificates yet"
                }
                title={role === 'recipient' ? 'Your Certificates' : 'Issued Certificates'}
                onRequestCertificate={onRequestCertificate}
            />
        </div>
    );
};

export default CertificateListWithArweave;