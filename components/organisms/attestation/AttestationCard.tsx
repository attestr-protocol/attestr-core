// components/organisms/attestation/AttestationCard.tsx
import React, { useState } from 'react';
import { Attestation, Schema, Verification } from '../../../contexts/types';
// import { useAttestationContext } from '../../../contexts'; // TODO: re-enable when needed
import Card from '../../molecules/cards/Card';
import Badge from '../../atoms/display/Badge';
import Address from '../../atoms/display/Address';
import Status from '../../atoms/display/Status';
import Button from '../../atoms/buttons/Button';
import CopyButton from '../../atoms/display/CopyButton';

interface AttestationCardProps {
    attestation: Attestation;
    showActions?: boolean;
    showVerifications?: boolean;
    onVerify?: (attestationId: string) => void;
    onRevoke?: (attestationId: string) => void;
    onViewDetails?: (attestationId: string) => void;
    className?: string;
}

export const AttestationCard: React.FC<AttestationCardProps> = ({
    attestation,
    showActions = true,
    showVerifications = true,
    onVerify,
    onRevoke,
    onViewDetails,
    className = ''
}) => {
    // Remove context dependency for now - component should work without verifications
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loadingVerifications, setLoadingVerifications] = useState(false);
    const [showFullData, setShowFullData] = useState(false);

    // Load verifications for this attestation - TODO: implement when service is ready
    const loadVerifications = async () => {
        if (!showVerifications || loadingVerifications) return;
        
        setLoadingVerifications(true);
        try {
            // TODO: implement getVerificationsForAttestation service
            setVerifications([]);
        } catch (error) {
            console.error('Error loading verifications:', error);
        } finally {
            setLoadingVerifications(false);
        }
    };

    React.useEffect(() => {
        if (showVerifications) {
            loadVerifications();
        }
    }, [showVerifications, attestation.id]);

    // Get status type based on attestation state
    const getStatusType = (): 'valid' | 'invalid' | 'expired' | 'revoked' => {
        if (attestation.revoked) return 'revoked';
        if (attestation.expiryDate && Date.now() > attestation.expiryDate) return 'expired';
        return 'valid';
    };

    // Get category info from schema
    const getCategoryInfo = () => {
        if (!attestation.schema) return { icon: '📄', color: 'gray' };
        
        const categoryIcons: Record<string, string> = {
            'education': '🎓',
            'healthcare': '🏥',
            'identity': '👤',
            'supply-chain': '📦',
            'legal': '⚖️',
            'finance': '💰',
            'government': '🏛️',
            'custom': '📄'
        };
        
        const categoryColors: Record<string, string> = {
            'education': 'blue',
            'healthcare': 'green',
            'identity': 'purple',
            'supply-chain': 'yellow',
            'legal': 'red',
            'finance': 'cyan',
            'government': 'indigo',
            'custom': 'gray'
        };
        
        return {
            icon: categoryIcons[attestation.schema.category] || '📄',
            color: categoryColors[attestation.schema.category] || 'gray'
        };
    };

    // Format attestation data for display
    const formatDataForDisplay = (data: any): { label: string; value: string }[] => {
        const entries: { label: string; value: string }[] = [];
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined && value !== '') {
                const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                let displayValue: string;
                
                if (typeof value === 'object') {
                    displayValue = JSON.stringify(value, null, 2);
                } else if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                } else {
                    displayValue = String(value);
                }
                
                entries.push({ label, value: displayValue });
            }
        }
        
        return entries;
    };

    const categoryInfo = getCategoryInfo();
    const statusType = getStatusType();
    const dataEntries = formatDataForDisplay(attestation.data);

    return (
        <Card className={`transition-all duration-200 hover:shadow-lg ${className}`}>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                        <span className="text-3xl mr-3">{categoryInfo.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {attestation.schema?.name || 'Unknown Schema'}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={categoryInfo.color as any} size="sm">
                                    {attestation.schema?.category || 'unknown'}
                                </Badge>
                                <Status status={statusType} size="sm" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <CopyButton 
                            text={attestation.id}
                            className="text-xs"
                        />
                        {onViewDetails && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewDetails(attestation.id)}
                            >
                                View
                            </Button>
                        )}
                    </div>
                </div>

                {/* Attestation Details */}
                <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Attester:</span>
                            <Address address={attestation.attester} className="block" />
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Subject:</span>
                            <Address address={attestation.subject} className="block" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">Issue Date:</span>
                            <div className="text-gray-900 dark:text-gray-100">
                                {new Date(attestation.issueDate).toLocaleDateString()}
                            </div>
                        </div>
                        {attestation.expiryDate && (
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Expiry Date:</span>
                                <div className="text-gray-900 dark:text-gray-100">
                                    {new Date(attestation.expiryDate).toLocaleDateString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Attestation Data */}
                {dataEntries.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Attestation Data
                            </h4>
                            {dataEntries.length > 3 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFullData(!showFullData)}
                                >
                                    {showFullData ? 'Show Less' : `Show All (${dataEntries.length})`}
                                </Button>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            {(showFullData ? dataEntries : dataEntries.slice(0, 3)).map((entry, index) => (
                                <div 
                                    key={index}
                                    className="flex justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded"
                                >
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {entry.label}:
                                    </span>
                                    <span className="text-sm text-gray-900 dark:text-gray-100 text-right max-w-48 truncate" title={entry.value}>
                                        {entry.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Verifications */}
                {showVerifications && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Verifications
                            </h4>
                            <Badge variant="gray" size="sm">
                                {verifications.length}
                            </Badge>
                        </div>
                        
                        {loadingVerifications ? (
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        ) : verifications.length > 0 ? (
                            <div className="space-y-2">
                                {verifications.slice(0, 2).map((verification) => (
                                    <div 
                                        key={verification.id}
                                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Status
                                                status={verification.isValid ? 'valid' : 'invalid'}
                                                size="sm"
                                            />
                                            <Address address={verification.verifier} />
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {verification.confidence}% confidence
                                        </div>
                                    </div>
                                ))}
                                {verifications.length > 2 && (
                                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                                        +{verifications.length - 2} more verifications
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                No verifications yet
                            </div>
                        )}
                    </div>
                )}

                {/* Metadata URI */}
                {attestation.metadataURI && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Metadata:
                            </span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={attestation.metadataURI}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    View
                                </a>
                                <CopyButton
                                    text={attestation.metadataURI}
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {onVerify && !attestation.revoked && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onVerify(attestation.id)}
                            >
                                Verify
                            </Button>
                        )}
                        {onRevoke && !attestation.revoked && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => onRevoke(attestation.id)}
                            >
                                Revoke
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AttestationCard;