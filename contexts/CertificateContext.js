// contexts/CertificateContext.js
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { certificateService } from '../utils/certificate/certificateService';
import { isStorageInitialized } from '../utils/storage/arweaveStorage';

// Create context
const CertificateContext = createContext(null);

/**
 * Provider component for certificate operations
 */
export function CertificateProvider({ children }) {
    const [certificates, setCertificates] = useState([]);
    const [currentCertificate, setCurrentCertificate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [storageInitialized, setStorageInitialized] = useState(
        typeof window !== 'undefined' ? isStorageInitialized() : false
    );

    // Check storage initialization status
    const checkStorageStatus = useCallback(() => {
        if (typeof window !== 'undefined') {
            const initialized = isStorageInitialized();
            setStorageInitialized(initialized);
            return initialized;
        }
        return false;
    }, []);

    // Update storage status on mount
    React.useEffect(() => {
        checkStorageStatus();
    }, [checkStorageStatus]);

    // Helper to show temporary success messages
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Issue a certificate
    const issueCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Check if storage is initialized
            if (!checkStorageStatus()) {
                throw new Error('Storage not initialized. Please initialize storage first.');
            }

            const result = await certificateService.issueCertificate(certificateData);

            if (result.success) {
                showSuccess(`Certificate issued successfully with ID: ${result.certificateId.substring(0, 10)}...`);

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
            setError(err.message || 'An error occurred while issuing the certificate');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, [checkStorageStatus]);

    // Verify a certificate
    const verifyCertificate = useCallback(async (certificateId) => {
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
            setError(err.message || 'An error occurred while verifying the certificate');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Record a verification
    const recordVerification = useCallback(async (certificateId) => {
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
            setError(err.message || 'An error occurred while recording the verification');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load user's certificates
    const loadUserCertificates = useCallback(async (address, role = 'recipient') => {
        if (!address) {
            setCertificates([]);
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            let userCertificates;

            if (role === 'issuer') {
                userCertificates = await certificateService.getIssuerCertificates(address);
            } else {
                userCertificates = await certificateService.getRecipientCertificates(address);
            }

            setCertificates(userCertificates);
            return userCertificates;
        } catch (err) {
            console.error('Error loading certificates:', err);
            setError(err.message || 'An error occurred while loading certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if address is a verified issuer
    const checkIsVerifiedIssuer = useCallback(async (address) => {
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
    const value = useMemo(() => ({
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
        checkStorageStatus,
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
        checkStorageStatus,
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
 * @returns {Object} Certificate context
 */
export function useCertificateContext() {
    const context = useContext(CertificateContext);

    if (!context) {
        throw new Error('useCertificateContext must be used within a CertificateProvider');
    }

    return context;
}