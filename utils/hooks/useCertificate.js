import { useState, useCallback } from 'react';
import {
    issueCertificate,
    verifyCertificate,
    getCertificatesForRecipient
} from '../blockchain/certificateUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata
} from '../storage/ipfsStorage';

/**
 * Custom hook for certificate operations
 * @returns {Object} Certificate functions and state
 */
export const useCertificate = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Issue a new certificate
    const issueNewCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);

        try {
            // Format metadata
            const metadata = formatCertificateMetadata({
                ...certificateData,
                issuerWallet: certificateData.issuerWallet || window.ethereum.selectedAddress,
            });

            // Store metadata on IPFS
            const ipfsCid = await storeCertificateMetadata(metadata);
            const metadataURI = `ipfs://${ipfsCid}`;

            // Issue certificate on blockchain
            const result = await issueCertificate(certificateData, metadataURI);

            if (!result.success) {
                throw new Error(result.error || 'Failed to issue certificate');
            }

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

            return result;
        } catch (error) {
            console.error('Error verifying certificate:', error);
            setError(error.message || 'An error occurred while verifying the certificate');
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Get certificates for a wallet address
    const getRecipientCertificates = useCallback(async (walletAddress) => {
        setIsLoading(true);
        setError(null);

        try {
            return await getCertificatesForRecipient(walletAddress);
        } catch (error) {
            console.error('Error getting certificates:', error);
            setError(error.message || 'An error occurred while fetching certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        issueNewCertificate,
        verifyExistingCertificate,
        getRecipientCertificates,
        isLoading,
        error,
    };
};

