// utils/hooks/useCertificate.js
import { useState, useCallback } from 'react';
import {
    issueCertificate,
    verifyCertificate,
    getCertificatesForRecipient,
    getCertificatesForIssuer,
    recordVerification
} from '../blockchain/certificateUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata
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

    // Helper to show and auto-hide success messages
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    // Issue a new certificate
    const issueNewCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            // Get current wallet if not provided
            let { issuerWallet } = certificateData;
            if (!issuerWallet) {
                const provider = getProvider();
                const signer = provider.getSigner();
                issuerWallet = await signer.getAddress();
            }

            // Issue certificate (this includes metadata formatting and IPFS storage)
            const result = await issueCertificate({
                ...certificateData,
                issuerWallet,
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to issue certificate');
            }

            showSuccess(`Certificate issued successfully with ID: ${result.certificateId.substring(0, 10)}...`);
            return result;
        } catch (error) {
            console.error('Error issuing certificate:', error);
            setError(error.message || 'An error occurred while issuing the certificate');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Verify a certificate
    const verifyExistingCertificate = useCallback(async (certificateId) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await verifyCertificate(certificateId);

            if (!result.success) {
                throw new Error(result.error || 'Failed to verify certificate');
            }

            // For UI purposes, let's determine a status
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

            // Add a status property to each certificate for UI purposes
            return certificates.map(cert => {
                let status = 'valid';
                if (!cert.isValid) {
                    status = cert.revoked ? 'revoked' : 'invalid';
                } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                    status = 'expired';
                }
                return { ...cert, status };
            });
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

            // Add a status property to each certificate for UI purposes
            return certificates.map(cert => {
                let status = 'valid';
                if (!cert.isValid) {
                    status = cert.revoked ? 'revoked' : 'invalid';
                } else if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
                    status = 'expired';
                }
                return { ...cert, status };
            });
        } catch (error) {
            console.error('Error getting issued certificates:', error);
            setError(error.message || 'An error occurred while fetching issued certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        issueNewCertificate,
        verifyExistingCertificate,
        recordCertificateVerification,
        getRecipientCertificates,
        getIssuerCertificates,
        isLoading,
        error,
        successMessage,
    };
};