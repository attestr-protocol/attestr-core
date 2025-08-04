// contexts/CertificateContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { certificateService } from '../utils/certificate/certificateService';
// import { isStorageInitialized } from '../utils/storage/arweaveStorage';
// import { useARIOStorage } from '../utils/hooks/useARIOStorage';

// Types and Interfaces
export interface CertificateData {
    issuerName: string;
    recipientName: string;
    certificateTitle: string;
    description: string;
    issueDate: string;
    expiryDate?: string;
    issuerWallet: string;
    recipientWallet: string;
    additionalData?: Record<string, any>;
}

export interface CertificateMetadata extends CertificateData {
    timestamp: number;
    version: string;
}

export interface Certificate {
    id: string;
    metadata: CertificateMetadata;
    txId?: string;
    arweaveUri?: string;
    blockchainTxHash?: string;
    createdAt: number;
    updatedAt: number;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface VerificationResult {
    success: boolean;
    isValid?: boolean;
    certificate?: Certificate;
    verificationCount?: number;
    lastVerified?: number;
    error?: string;
}

export interface IssueCertificateResult {
    success: boolean;
    certificateId?: string;
    txHash?: string;
    arweaveUri?: string;
    error?: string;
}

export interface StorageResult {
    success: boolean;
    arweaveUri?: string;
    txId?: string;
    error?: string;
}

export interface RecordVerificationResult {
    success: boolean;
    txHash?: string;
    verificationCount?: number;
    error?: string;
}

// export interface ARIOStorageHook {
//     storeCertificate: (certificateData: CertificateData) => Promise<StorageResult>;
//     retrieveCertificate: (arweaveIdOrUri: string) => Promise<{ success: boolean; metadata?: CertificateMetadata; error?: string; }>;
//     isInitialized: () => boolean;
//     isLoading: boolean;
//     error: string | null;
//     balance: number | null;
//     requestTokens: (amount?: number) => Promise<{ success: boolean; error?: string; }>;
//     getStatus: (txId: string) => Promise<{ confirmed: boolean; status?: string; }>;
//     disconnect: () => void;
// }

export type UserRole = 'issuer' | 'recipient';

export interface CertificateContextValue {
    // Certificate data
    certificates: Certificate[];
    currentCertificate: VerificationResult | null;

    // Status
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    storageInitialized: boolean;

    // Certificate operations
    issueCertificate: (certificateData: CertificateData, metadataURI?: string | null) => Promise<IssueCertificateResult>;
    verifyCertificate: (certificateId: string) => Promise<VerificationResult>;
    recordVerification: (certificateId: string) => Promise<RecordVerificationResult>;
    loadUserCertificates: (address: string, role?: UserRole) => Promise<Certificate[]>;
    checkIsVerifiedIssuer: (address: string) => Promise<boolean>;
    clearCurrentCertificate: () => void;

    // Reset state
    resetState: () => void;
}

export interface CertificateProviderProps {
    children: ReactNode;
}

// Create context
const CertificateContext = createContext<CertificateContextValue | null>(null);

/**
 * Enhanced provider component for certificate operations with AR.IO integration
 */
export function CertificateProvider({ children }: CertificateProviderProps) {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [currentCertificate, setCurrentCertificate] = useState<VerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Storage disabled
    // const arIOStorage = useARIOStorage();
    const [storageInitialized, setStorageInitialized] = useState<boolean>(false);

    // Check storage initialization status - disabled
    // const checkStorageStatus = useCallback((): boolean => {
    //     if (typeof window !== 'undefined') {
    //         const initialized = isStorageInitialized();
    //         setStorageInitialized(initialized);
    //         return initialized;
    //     }
    //     return false;
    // }, []);

    // Update storage status when AR.IO status changes - disabled
    // useEffect(() => {
    //     const initialized = arIOStorage.isInitialized();
    //     setStorageInitialized(initialized);
    // }, [arIOStorage]);

    // Check storage status on mount - disabled
    // useEffect(() => {
    //     checkStorageStatus();
    // }, [checkStorageStatus]);

    // Helper to show temporary success messages
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Issue a certificate without storage
    const issueCertificate = useCallback(async (certificateData: CertificateData, metadataURI: string | null = null): Promise<IssueCertificateResult> => {
        setIsLoading(true);
        setError(null);

        try {
            // Issue certificate on blockchain without external storage
            const result = await certificateService.issueCertificate(certificateData);

            if (result.success) {
                showSuccess(`Certificate issued successfully with ID: ${result.certificateId?.substring(0, 10)}...`);

                // Update certificates list if the issuer or recipient is the current user
                const currentAddress = window.ethereum?.selectedAddress?.toLowerCase();
                if (currentAddress) {
                    if (certificateData.issuerWallet?.toLowerCase() === currentAddress) {
                        loadUserCertificates(currentAddress, 'issuer');
                    } else if (certificateData.recipientWallet?.toLowerCase() === currentAddress) {
                        loadUserCertificates(currentAddress, 'recipient');
                    }
                }
            } else {
                setError(result.error || 'Failed to issue certificate');
            }

            return result;
        } catch (err) {
            console.error('Error issuing certificate:', err);
            const errorMessage = (err as Error).message || 'An error occurred while issuing the certificate';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Verify a certificate
    const verifyCertificate = useCallback(async (certificateId: string): Promise<VerificationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await certificateService.verifyCertificate(certificateId);

            if (result.success) {
                setCurrentCertificate(result);
            } else {
                setError(result.error || 'Failed to verify certificate');
            }

            return result;
        } catch (err) {
            console.error('Error verifying certificate:', err);
            const errorMessage = (err as Error).message || 'An error occurred while verifying the certificate';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Record a verification
    const recordVerification = useCallback(async (certificateId: string): Promise<RecordVerificationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await certificateService.recordVerification(certificateId);

            if (result.success) {
                showSuccess('Verification recorded on blockchain successfully');
            } else {
                setError(result.error || 'Failed to record verification');
            }

            return result;
        } catch (err) {
            console.error('Error recording verification:', err);
            const errorMessage = (err as Error).message || 'An error occurred while recording the verification';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load user's certificates
    const loadUserCertificates = useCallback(async (address: string, role: UserRole = 'recipient'): Promise<Certificate[]> => {
        if (!address) {
            setCertificates([]);
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            let verificationResults;

            if (role === 'issuer') {
                verificationResults = await certificateService.getIssuerCertificates(address);
            } else {
                verificationResults = await certificateService.getRecipientCertificates(address);
            }

            // Convert VerificationResult[] to Certificate[]
            const userCertificates: Certificate[] = verificationResults.map((result) => ({
                id: result.certificateId || '',
                metadata: result.metadata || {} as CertificateMetadata,
                txId: result.arweaveUrl || undefined,
                arweaveUri: result.arweaveUrl || undefined,
                blockchainTxHash: undefined,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: result.success ? 'confirmed' : 'failed' as 'pending' | 'confirmed' | 'failed'
            }));

            setCertificates(userCertificates);
            return userCertificates;
        } catch (err) {
            console.error('Error loading certificates:', err);
            const errorMessage = (err as Error).message || 'An error occurred while loading certificates';
            setError(errorMessage);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if address is a verified issuer
    const checkIsVerifiedIssuer = useCallback(async (address: string): Promise<boolean> => {
        if (!address) {
            return false;
        }

        try {
            return await certificateService.isVerifiedIssuer(address);
        } catch (err) {
            console.error('Error checking if issuer is verified:', err);
            return false;
        }
    }, []);

    // Get certificate metadata - disabled
    // const getCertificateMetadata = useCallback(async (arweaveIdOrUri: string): Promise<{ success: boolean; metadata?: CertificateMetadata; error?: string; }> => {
    //     if (!arweaveIdOrUri) {
    //         return { success: false, error: 'No AR.IO ID or URI provided' };
    //     }

    //     return await arIOStorage.retrieveCertificate(arweaveIdOrUri);
    // }, [arIOStorage]);

    // Clear current certificate
    const clearCurrentCertificate = useCallback(() => {
        setCurrentCertificate(null);
    }, []);

    // Reset errors and messages
    const resetState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Create context value
    const value: CertificateContextValue = useMemo(() => ({
        // Certificate data
        certificates,
        currentCertificate,

        // Status
        isLoading,
        error,
        successMessage,
        storageInitialized,

        // Certificate operations
        issueCertificate,
        verifyCertificate,
        recordVerification,
        loadUserCertificates,
        checkIsVerifiedIssuer,
        clearCurrentCertificate,

        // Reset state
        resetState,
    }), [
        certificates,
        currentCertificate,
        isLoading,
        error,
        successMessage,
        storageInitialized,
        issueCertificate,
        verifyCertificate,
        recordVerification,
        loadUserCertificates,
        checkIsVerifiedIssuer,
        clearCurrentCertificate,
        resetState,
    ]);

    return (
        <CertificateContext.Provider value={value}>
            {children}
        </CertificateContext.Provider>
    );
}

/**
 * Hook for components to consume the certificate context
 * @returns {CertificateContextValue} Certificate context
 */
export function useCertificateContext(): CertificateContextValue {
    const context = useContext(CertificateContext);

    if (!context) {
        throw new Error('useCertificateContext must be used within a CertificateProvider');
    }

    return context;
}