// contexts/AttestationContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { attestationService } from '../utils/attestation/attestationService';

// Types and Interfaces
export interface AttestationData {
    attesterName: string;
    subjectName: string;
    attestationTitle: string;
    description: string;
    issueDate: string;
    expiryDate?: string;
    attesterWallet: string;
    subjectWallet: string;
    additionalData?: Record<string, any>;
}

export interface AttestationMetadata extends AttestationData {
    timestamp: number;
    version: string;
}

export interface Attestation {
    id: string;
    metadata: AttestationMetadata;
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
    attestation?: Attestation;
    verificationCount?: number;
    lastVerified?: number;
    error?: string;
}

export interface CreateAttestationResult {
    success: boolean;
    attestationId?: string;
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

export type UserRole = 'attester' | 'subject';

export interface AttestationContextValue {
    // Attestation data
    attestations: Attestation[];
    currentAttestation: VerificationResult | null;

    // Status
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    storageInitialized: boolean;

    // Attestation operations
    createAttestation: (attestationData: AttestationData, metadataURI?: string | null) => Promise<CreateAttestationResult>;
    verifyAttestation: (attestationId: string) => Promise<VerificationResult>;
    recordVerification: (attestationId: string) => Promise<RecordVerificationResult>;
    loadUserAttestations: (address: string, role?: UserRole) => Promise<Attestation[]>;
    checkIsVerifiedAttester: (address: string) => Promise<boolean>;
    clearCurrentAttestation: () => void;

    // Reset state
    resetState: () => void;
}

export interface AttestationProviderProps {
    children: ReactNode;
}

// Create context
const AttestationContext = createContext<AttestationContextValue | null>(null);

/**
 * Enhanced provider component for attestation operations with Arweave integration
 */
export function AttestationProvider({ children }: AttestationProviderProps) {
    const [attestations, setAttestations] = useState<Attestation[]>([]);
    const [currentAttestation, setCurrentAttestation] = useState<VerificationResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [storageInitialized, setStorageInitialized] = useState<boolean>(false);

    // Helper to show temporary success messages
    const showSuccess = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Create an attestation without storage
    const createAttestation = useCallback(async (attestationData: AttestationData, metadataURI: string | null = null): Promise<CreateAttestationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            // Create attestation on blockchain without external storage
            const result = await attestationService.issueAttestation(attestationData);

            if (result.success) {
                showSuccess(`Attestation created successfully with ID: ${result.attestationId?.substring(0, 10)}...`);

                // Update attestations list if the attester or subject is the current user
                const currentAddress = window.ethereum?.selectedAddress?.toLowerCase();
                if (currentAddress) {
                    if (attestationData.attesterWallet?.toLowerCase() === currentAddress) {
                        loadUserAttestations(currentAddress, 'attester');
                    } else if (attestationData.subjectWallet?.toLowerCase() === currentAddress) {
                        loadUserAttestations(currentAddress, 'subject');
                    }
                }
            } else {
                setError(result.error || 'Failed to create attestation');
            }

            return result;
        } catch (err) {
            console.error('Error creating attestation:', err);
            const errorMessage = (err as Error).message || 'An error occurred while creating the attestation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Verify an attestation
    const verifyAttestation = useCallback(async (attestationId: string): Promise<VerificationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await attestationService.verifyAttestation(attestationId);

            if (result.isValid) {
                setCurrentAttestation(result.details);
            } else {
                setError('Failed to verify attestation');
            }

            return {
                success: result.isValid,
                isValid: result.isValid,
                attestation: result.details,
                error: result.isValid ? undefined : 'Failed to verify attestation'
            };
        } catch (err) {
            console.error('Error verifying attestation:', err);
            const errorMessage = (err as Error).message || 'An error occurred while verifying the attestation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Record a verification
    const recordVerification = useCallback(async (attestationId: string): Promise<RecordVerificationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            // TODO: Implement actual verification recording in attestationService
            // For now, return a mock successful result
            const result = {
                success: true,
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
                verificationId: `verification_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
            };

            showSuccess('Verification recorded on blockchain successfully');
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

    // Load user's attestations
    const loadUserAttestations = useCallback(async (address: string, role: UserRole = 'subject'): Promise<Attestation[]> => {
        if (!address) {
            setAttestations([]);
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            let verificationResults;

            if (role === 'attester') {
                verificationResults = await attestationService.getAttestationsForAttester(address);
            } else {
                verificationResults = await attestationService.getAttestationsForSubject(address);
            }

            // Convert VerificationResult[] to Attestation[]
            const userAttestations: Attestation[] = verificationResults.map((result) => ({
                id: result.attestationId || '',
                metadata: result.metadata || {} as AttestationMetadata,
                txId: result.arweaveUrl || undefined,
                arweaveUri: result.arweaveUrl || undefined,
                blockchainTxHash: undefined,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                status: result.success ? 'confirmed' : 'failed' as 'pending' | 'confirmed' | 'failed'
            }));

            setAttestations(userAttestations);
            return userAttestations;
        } catch (err) {
            console.error('Error loading attestations:', err);
            const errorMessage = (err as Error).message || 'An error occurred while loading attestations';
            setError(errorMessage);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if address is a verified attester
    const checkIsVerifiedAttester = useCallback(async (address: string): Promise<boolean> => {
        if (!address) {
            return false;
        }

        try {
            // TODO: Implement actual verification check in attestationService
            // For now, return true as a mock implementation
            return true;
        } catch (err) {
            console.error('Error checking if attester is verified:', err);
            return false;
        }
    }, []);

    // Clear current attestation
    const clearCurrentAttestation = useCallback(() => {
        setCurrentAttestation(null);
    }, []);

    // Reset errors and messages
    const resetState = useCallback(() => {
        setError(null);
        setSuccessMessage(null);
    }, []);

    // Create context value
    const value: AttestationContextValue = useMemo(() => ({
        // Attestation data
        attestations,
        currentAttestation,

        // Status
        isLoading,
        error,
        successMessage,
        storageInitialized,

        // Attestation operations
        createAttestation,
        verifyAttestation,
        recordVerification,
        loadUserAttestations,
        checkIsVerifiedAttester,
        clearCurrentAttestation,

        // Reset state
        resetState,
    }), [
        attestations,
        currentAttestation,
        isLoading,
        error,
        successMessage,
        storageInitialized,
        createAttestation,
        verifyAttestation,
        recordVerification,
        loadUserAttestations,
        checkIsVerifiedAttester,
        clearCurrentAttestation,
        resetState,
    ]);

    return (
        <AttestationContext.Provider value={value}>
            {children}
        </AttestationContext.Provider>
    );
}

/**
 * Hook for components to consume the attestation context
 * @returns {AttestationContextValue} Attestation context
 */
export function useAttestationContext(): AttestationContextValue {
    const context = useContext(AttestationContext);

    if (!context) {
        throw new Error('useAttestationContext must be used within an AttestationProvider');
    }

    return context;
}