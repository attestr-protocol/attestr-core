// components/organisms/certificate/CertificateList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import CertificateCard from './CertificateCard';
import Badge from '../../atoms/display/Badge';
import Button from '../../atoms/buttons/Button';
import Card from '../../molecules/cards/Card';
import { DocumentAddIcon, InformationCircleIcon, RefreshIcon } from '@heroicons/react/outline';
import { useCertificateContext } from '../../../contexts/CertificateContext';
import type { Certificate } from '../../../contexts/CertificateContext';

interface CertificateListProps {
    walletAddress: string;
    role?: 'issuer' | 'recipient';
    onShare?: (certificate: Certificate) => void;
    onView?: (certificate: Certificate) => void;
    onRequestCertificate?: () => void;
    showActions?: boolean;
    emptyMessage?: string;
    title?: string;
    className?: string;
}

/**
 * Enhanced certificate list component that combines all certificate display functionality
 */
const CertificateList: React.FC<CertificateListProps> = ({
    walletAddress,
    role = 'recipient',
    onShare,
    onView,
    onRequestCertificate,
    showActions = true,
    emptyMessage,
    title,
    className = '',
    ...props
}) => {
    // Get certificate context
    const {
        loadUserCertificates,
        certificates: contextCertificates,
        isLoading: contextLoading,
        error: contextError
    } = useCertificateContext();

    // Local state
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Default title and empty message based on role
    const defaultTitle = role === 'recipient' ? 'Your Certificates' : 'Issued Certificates';
    const defaultEmptyMessage = role === 'recipient'
        ? "You haven't received any certificates yet"
        : "You haven't issued any certificates yet";

    // Load certificates from blockchain and storage
    const loadCertificates = useCallback(async () => {
        if (!walletAddress) {
            setCertificates([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Load certificates
            await loadUserCertificates(walletAddress, role);
        } catch (err) {
            console.error('Error loading certificates:', err);
            setError(err instanceof Error ? err.message : 'Failed to load certificates');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress, role, loadUserCertificates]);

    // Load certificates when wallet address or role changes
    useEffect(() => {
        if (walletAddress) {
            loadCertificates();
        } else {
            setCertificates([]);
        }
    }, [walletAddress, role, loadCertificates]);

    // Sync certificates from context
    useEffect(() => {
        if (contextCertificates?.length > 0) {
            setCertificates(contextCertificates);
        }
    }, [contextCertificates]);

    // Handle certificate share
    const handleShare = (certificate: Certificate) => {
        if (onShare) {
            onShare(certificate);
        }
        else if (navigator.share) {
            navigator.share({
                title: (certificate as any).title || (certificate as any).certificateTitle || 'Blockchain Certificate',
                text: `Check out my verified credential: ${(certificate as any).title || (certificate as any).certificateTitle}`,
                url: `${window.location.origin}/verify/${certificate.id}`,
            }).catch(err => {
                console.error('Error sharing:', err);
            });
        }
        else {
            // Fallback for browsers that don't support the Web Share API
            const shareUrl = `${window.location.origin}/verify/${certificate.id}`;
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    alert('Share link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Error copying to clipboard:', err);
                });
        }
    };

    // Handle certificate view
    const handleView = (certificate: Certificate) => {
        if (onView) {
            onView(certificate);
        } else {
            // Default view behavior - navigate to certificate detail page
            window.location.href = `/verify/${certificate.id}`;
        }
    };

    // Loading state
    if (isLoading || contextLoading) {
        return (
            <div className={`text-center py-12 ${className}`} {...props}>
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Loading certificates...</p>
            </div>
        );
    }

    // Error state
    const displayError = error || contextError;
    if (displayError) {
        return (
            <Card className={`bg-red-50 dark:bg-red-900/20 ${className}`} {...props}>
                <div className="p-4">
                    <div className="flex items-center mb-3">
                        <InformationCircleIcon className="h-6 w-6 text-red-500 mr-2" />
                        <h3 className="text-lg font-medium text-red-800 dark:text-red-300">
                            Error Loading Certificates
                        </h3>
                    </div>
                    <p className="text-red-700 dark:text-red-300 mb-4">{displayError}</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadCertificates}
                        startIcon={<RefreshIcon className="h-4 w-4" />}
                    >
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    // Main component
    return (
        <div className={className} {...props}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {title || defaultTitle}
                    </h2>
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
                            key={certificate.id}
                            certificate={certificate as any}
                            onShare={() => handleShare(certificate)}
                            onView={() => handleView(certificate)}
                            showActions={showActions}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-dark rounded-full mb-4">
                        <InformationCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {emptyMessage || defaultEmptyMessage}
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