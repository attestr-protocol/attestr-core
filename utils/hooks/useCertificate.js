// utils/hooks/useCertificate.js
import { useState, useCallback, useEffect } from 'react';
import {
    issueCertificate,
    verifyCertificate,
    getCertificatesForRecipient,
    getCertificatesForIssuer,
    recordVerification
} from '../blockchain/certificateUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata,
    initializeStorage,
    retrieveCertificateMetadata,
    isStorageInitialized,
    getCurrentSpaceDid
} from '../storage/ipfsStorage';
import { getProvider } from '../blockchain/walletUtils';

/**
 * Custom hook for certificate operations
 * @returns {Object} Certificate functions and state
 */
export const useCertificate = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [storageInitialized, setStorageInitialized] = useState(false);
    const [emailVerificationPending, setEmailVerificationPending] = useState(false);

    // Check storage initialized state on mount
    useEffect(() => {
        setStorageInitialized(isStorageInitialized());
    }, []);

    // Helper to show and auto-hide success messages
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Initialize IPFS storage
    const initializeIPFSStorage = useCallback(async (email) => {
        setIsLoading(true);
        setError(null);
        setEmailVerificationPending(false);

        try {
            // Skip if already initialized
            if (storageInitialized) {
                console.log('Storage already initialized');
                return true;
            }

            console.log(`Attempting to initialize storage with email: ${email}`);

            try {
                // Try to initialize with the given email
                const result = await initializeStorage(email);

                if (result) {
                    setStorageInitialized(true);
                    showSuccess('Storage initialized successfully');
                    return true;
                } else {
                    setEmailVerificationPending(true);
                    console.log('Email verification pending. Please check your inbox.');
                    return false;
                }
            } catch (initError) {
                if (initError.message && initError.message.includes('email')) {
                    setEmailVerificationPending(true);
                    console.log('Email verification pending. Please check your inbox.');
                    return false;
                }
                throw initError;
            }
        } catch (error) {
            console.error('Error initializing IPFS storage:', error);
            setError('Failed to initialize storage: ' + (error.message || 'Unknown error'));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [storageInitialized]);

    // Issue a new certificate
    const issueNewCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Make sure storage is initialized
            if (!storageInitialized) {
                const initialized = await initializeIPFSStorage(certificateData.issuerEmail);
                if (!initialized) {
                    throw new Error('Storage not initialized. Please complete email verification first.');
                }
            }

            // Get current wallet if not provided
            let { issuerWallet } = certificateData;
            if (!issuerWallet) {
                try {
                    const provider = getProvider();
                    const signer = provider.getSigner();
                    issuerWallet = await signer.getAddress();
                    certificateData.issuerWallet = issuerWallet;
                } catch (walletError) {
                    console.error('Error getting wallet address:', walletError);
                    throw new Error('Failed to get wallet address. Please ensure you are connected to MetaMask.');
                }
            }

            // Format metadata
            const metadata = formatCertificateMetadata({
                ...certificateData,
                issuerWallet,
            });

            // Store metadata on IPFS
            console.log('Storing certificate metadata on IPFS...');
            const ipfsCid = await storeCertificateMetadata(metadata);
            const metadataURI = `ipfs://${ipfsCid}`;
            console.log('Metadata stored with URI:', metadataURI);

            // Issue certificate on blockchain
            console.log('Issuing certificate on blockchain...');
            const result = await issueCertificate({
                ...certificateData,
                issuerWallet,
                metadataURI
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to issue certificate on blockchain');
            }

            // Add metadata to the result
            result.metadata = metadata;
            showSuccess(`Certificate issued successfully with ID: ${result.certificateId.substring(0, 10)}...`);
            return result;
        } catch (error) {
            console.error('Error issuing certificate:', error);
            setError(error.message || 'An error occurred while issuing the certificate');
            return {
                success: false,
                error: error.message || 'Unknown error during certificate issuance'
            };
        } finally {
            setIsLoading(false);
        }
    }, [storageInitialized, initializeIPFSStorage]);

    // Verify a certificate
    const verifyExistingCertificate = useCallback(async (certificateId) => {
        setIsLoading(true);
        setError(null);

        try {
            // Get certificate information from blockchain
            const result = await verifyCertificate(certificateId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to verify certificate');
            }

            // Try to get metadata if available
            if (result.metadataURI) {
                try {
                    const metadata = await retrieveCertificateMetadata(result.metadataURI);
                    result.metadata = metadata;
                } catch (metadataError) {
                    console.warn('Error retrieving metadata:', metadataError);
                    // Continue even without metadata
                }
            }

            // Determine certificate status for UI
            let status = 'valid';
            if (!result.isValid) {
                status = result.revoked ? 'revoked' : 'invalid';
            } else if (result.expiryDate && new Date(result.expiryDate) < new Date()) {
                status = 'expired';
            }

            result.status = status;
            return result;
        } catch (error) {
            console.error('Error verifying certificate:', error);
            setError(error.message || 'An error occurred while verifying the certificate');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Record a verification
    const recordCertificateVerification = useCallback(async (certificateId) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await recordVerification(certificateId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to record verification');
            }

            showSuccess('Verification recorded successfully on the blockchain');
            return result;
        } catch (error) {
            console.error('Error recording verification:', error);
            setError(error.message || 'An error occurred while recording the verification');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get certificates for a recipient
    const getRecipientCertificates = useCallback(async (walletAddress) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            const certificates = await getCertificatesForRecipient(walletAddress);

            // Try to enhance certificates with metadata if available
            const enhancedCertificates = await Promise.all(
                certificates.map(async (cert) => {
                    // Add a status property for UI purposes
                    let status = 'valid';
                    if (!cert.isValid) {
                        status = cert.revoked ? 'revoked' : 'invalid';
                    } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                        status = 'expired';
                    }

                    // Try to get metadata
                    if (cert.metadataURI) {
                        try {
                            const metadata = await retrieveCertificateMetadata(cert.metadataURI);
                            return { ...cert, status, metadata };
                        } catch (err) {
                            console.warn(`Failed to get metadata for certificate ${cert.certificateId}:`, err);
                        }
                    }

                    return { ...cert, status };
                })
            );

            return enhancedCertificates;
        } catch (error) {
            console.error('Error getting certificates:', error);
            setError(error.message || 'An error occurred while fetching certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get certificates issued by an institution
    const getIssuerCertificates = useCallback(async (walletAddress) => {
        setIsLoading(true);
        setError(null);

        try {
            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            const certificates = await getCertificatesForIssuer(walletAddress);

            // Try to enhance certificates with metadata if available
            const enhancedCertificates = await Promise.all(
                certificates.map(async (cert) => {
                    // Add a status property for UI purposes
                    let status = 'valid';
                    if (!cert.isValid) {
                        status = cert.revoked ? 'revoked' : 'invalid';
                    } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                        status = 'expired';
                    }

                    // Try to get metadata
                    if (cert.metadataURI) {
                        try {
                            const metadata = await retrieveCertificateMetadata(cert.metadataURI);
                            return { ...cert, status, metadata };
                        } catch (err) {
                            console.warn(`Failed to get metadata for certificate ${cert.certificateId}:`, err);
                        }
                    }

                    return { ...cert, status };
                })
            );

            return enhancedCertificates;
        } catch (error) {
            console.error('Error getting issued certificates:', error);
            setError(error.message || 'An error occurred while fetching issued certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if a space is already initialized
    const checkStorageStatus = useCallback(() => {
        const initialized = isStorageInitialized();
        setStorageInitialized(initialized);
        return initialized;
    }, []);

    // Get the current space ID
    const getSpaceInfo = useCallback(() => {
        const spaceDid = getCurrentSpaceDid();
        return { spaceDid };
    }, []);

    return {
        initializeIPFSStorage,
        issueNewCertificate,
        verifyExistingCertificate,
        recordCertificateVerification,
        getRecipientCertificates,
        getIssuerCertificates,
        checkStorageStatus,
        getSpaceInfo,
        isLoading,
        error,
        successMessage,
        storageInitialized,
        emailVerificationPending
    };
};