// components/organisms/dashboard/AttestationList.tsx
import React, { useState, useMemo } from 'react';
import { Attestation } from '../../../contexts/types';
import { useAttestationContext } from '../../../contexts';
import { AttestationCard } from '../attestation/AttestationCard';
import Button from '../../atoms/buttons/Button';

interface AttestationListProps {
    attestations: Attestation[];
    isLoading?: boolean;
    showPagination?: boolean;
    pageSize?: number;
    onAttestationSelect?: (attestation: Attestation) => void;
    className?: string;
}

export const AttestationList: React.FC<AttestationListProps> = ({
    attestations,
    isLoading = false,
    showPagination = true,
    pageSize = 10,
    onAttestationSelect,
    className = ''
}) => {
    const { verifyAttestation, revokeAttestation } = useAttestationContext();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAttestation, setSelectedAttestation] = useState<string | null>(null);

    // Paginated attestations
    const paginatedAttestations = useMemo(() => {
        if (!showPagination) return attestations;
        
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return attestations.slice(startIndex, endIndex);
    }, [attestations, currentPage, pageSize, showPagination]);

    const totalPages = useMemo(() => {
        return Math.ceil(attestations.length / pageSize);
    }, [attestations.length, pageSize]);

    const handleVerify = async (attestationId: string) => {
        try {
            await verifyAttestation(attestationId, 95, 'Verified through dashboard');
            // Optionally refresh the list or show success message
        } catch (error) {
            console.error('Error verifying attestation:', error);
            // Handle error (show toast, etc.)
        }
    };

    const handleRevoke = async (attestationId: string) => {
        try {
            await revokeAttestation(attestationId, 'Revoked through dashboard');
            // Optionally refresh the list or show success message
        } catch (error) {
            console.error('Error revoking attestation:', error);
            // Handle error (show toast, etc.)
        }
    };

    const handleViewDetails = (attestationId: string) => {
        setSelectedAttestation(attestationId);
        const attestation = attestations.find(a => a.id === attestationId);
        if (attestation && onAttestationSelect) {
            onAttestationSelect(attestation);
        }
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const getPaginationRange = () => {
        const delta = 2;
        const range: number[] = [];
        const rangeWithDots: (number | string)[] = [];

        for (let i = Math.max(2, currentPage - delta); 
             i <= Math.min(totalPages - 1, currentPage + delta); 
             i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (isLoading) {
        return (
            <div className={`space-y-4 ${className}`}>
                {[...Array(3)].map((_, index) => (
                    <div 
                        key={index}
                        className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48"
                    />
                ))}
            </div>
        );
    }

    if (attestations.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <svg 
                        className="mx-auto h-12 w-12" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No attestations found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    No attestations match your current filters. Try adjusting your search criteria.
                </p>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            {/* Attestation Cards */}
            <div className="space-y-4 mb-6">
                {paginatedAttestations.map((attestation) => (
                    <AttestationCard
                        key={attestation.id}
                        attestation={attestation}
                        showActions={true}
                        showVerifications={true}
                        onVerify={handleVerify}
                        onRevoke={handleRevoke}
                        onViewDetails={handleViewDetails}
                        className={selectedAttestation === attestation.id ? 'ring-2 ring-blue-500' : ''}
                    />
                ))}
            </div>

            {/* Pagination */}
            {showPagination && totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                        <span>
                            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                            {Math.min(currentPage * pageSize, attestations.length)} of{' '}
                            {attestations.length} attestations
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2"
                        >
                            <svg 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 19l-7-7 7-7" 
                                />
                            </svg>
                            Previous
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                            {getPaginationRange().map((page, index) => (
                                <React.Fragment key={index}>
                                    {page === '...' ? (
                                        <span className="px-3 py-2 text-gray-500">...</span>
                                    ) : (
                                        <Button
                                            variant={currentPage === page ? 'primary' : 'ghost'}
                                            size="sm"
                                            onClick={() => goToPage(page as number)}
                                            className="px-3 py-2 min-w-[40px]"
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Next Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2"
                        >
                            Next
                            <svg 
                                className="h-4 w-4 ml-1" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9 5l7 7-7 7" 
                                />
                            </svg>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttestationList;