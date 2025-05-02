// utils/hooks/useCertificate.js
import { useState, useCallback, useEffect } from 'react';
import {
    issueCertificate,
    verifyCertificate,
    getCertificatesForRecipient,
    getCertificatesForIssuer
} from '../blockchain/contractUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata,
    retrieveCertificateMetadata,
    initializeStorage,
    isStorageInitialized,
    getCurrentWalletAddress
} from '../storage/arweaveStorage';
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

    // Check storage initialized state on mount
    useEffect(() => {
        setStorageInitialized(isStorageInitialized());
    }, []);

    // Helper to show and auto-hide success messages
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Initialize Arweave storage
    const initializeArweaveStorage = useCallback(async (jwkOrToken) => {
        setIsLoading(true);
        setError(null);

        try {
            // Skip if already initialized
            if (storageInitialized) {
                console.log('Storage already initialized');
                return true;
            }

            console.log('Initializing Arweave storage...');
            const result = await initializeStorage(jwkOrToken);

            if (result) {
                setStorageInitialized(true);
                showSuccess('Arweave storage initialized successfully');
                return true;
            } else {
                throw new Error('Failed to initialize Arweave storage');
            }
        } catch (error) {
            console.error('Error initializing Arweave storage:', error);
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
                // For development, can auto-initialize with a temporary wallet
                // In production, should have proper wallet management
                const initialized = await initializeArweaveStorage();
                if (!initialized) {
                    throw new Error('Arweave storage not initialized. Please initialize storage first.');
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

            // Store metadata on Arweave
            console.log('Storing certificate metadata on Arweave...');
            const txId = await storeCertificateMetadata(metadata);
            const metadataURI = `ar://${txId}`;
            console.log('Metadata stored with URI:', metadataURI);

            // Issue certificate on blockchain
            console.log('Issuing certificate on blockchain...');
            const result = await issueCertificate(certificateData, metadataURI);

            if (!result.success) {
                throw new Error(result.error || 'Failed to issue certificate on blockchain');
            }

            // Add metadata to the result
            result.metadata = metadata;
            result.arweaveTxId = txId;

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
    }, [storageInitialized, initializeArweaveStorage]);

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
            if (result.metadataURI && result.metadataURI.startsWith('ar://')) {
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
            return await Promise.all(
                certificates.map(async (cert) => {
                    // Add a status property for UI purposes
                    let status = 'valid';
                    if (!cert.isValid) {
                        status = cert.revoked ? 'revoked' : 'invalid';
                    } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                        status = 'expired';
                    }

                    return { ...cert, status };
                })
            );
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
            return await Promise.all(
                certificates.map(async (cert) => {
                    // Add a status property for UI purposes
                    let status = 'valid';
                    if (!cert.isValid) {
                        status = cert.revoked ? 'revoked' : 'invalid';
                    } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                        status = 'expired';
                    }

                    return { ...cert, status };
                })
            );
        } catch (error) {
            console.error('Error getting issued certificates:', error);
            setError(error.message || 'An error occurred while fetching issued certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check if storage is already initialized
    const checkStorageStatus = useCallback(() => {
        const initialized = isStorageInitialized();
        setStorageInitialized(initialized);
        return initialized;
    }, []);

    // Get the current wallet address
    const getArweaveAddress = useCallback(async () => {
        try {
            return await getCurrentWalletAddress();
        } catch (error) {
            console.error('Error getting Arweave wallet address:', error);
            return null;
        }
    }, []);

    return {
        initializeArweaveStorage,
        issueNewCertificate,
        verifyExistingCertificate,
        getRecipientCertificates,
        getIssuerCertificates,
        checkStorageStatus,
        getArweaveAddress,
        isLoading,
        error,
        successMessage,
        storageInitialized
    };
};