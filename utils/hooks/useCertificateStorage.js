// utils/hooks/useCertificateStorage.js
import { useState, useCallback } from 'react';
import { useArweave } from '../../contexts/ArweaveContext';
import { useCertificateContext } from '../../contexts/CertificateContext';

/**
 * Custom hook for certificate storage operations that combines Arweave
 * permanent storage with blockchain operations.
 */
export function useCertificateStorage() {
    const [isStoring, setIsStoring] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Get Arweave context for permanent storage
    const arweave = useArweave();

    // Get blockchain certificate context for smart contract interaction
    const { issueCertificate } = useCertificateContext();

    /**
     * Issue a new certificate with permanent storage on Arweave
     * @param {Object} certificateData - Certificate data
     * @returns {Promise<Object>} Result of certificate issuance
     */
    const storeCertificate = useCallback(async (certificateData) => {
        setIsStoring(true);
        setError(null);
        setSuccess(null);

        try {
            // Check if Arweave storage is initialized
            if (!arweave.isInitialized) {
                throw new Error('Arweave storage not initialized. Please initialize storage first.');
            }

            // Step 1: Store metadata on Arweave for permanent storage
            console.log('Storing certificate metadata on Arweave...');
            const arweaveResult = await arweave.storeCertificate(certificateData);

            if (!arweaveResult.success) {
                throw new Error(arweaveResult.error || 'Failed to store certificate on Arweave');
            }

            // Step 2: Issue certificate on blockchain with Arweave URI
            console.log('Issuing certificate on blockchain with Arweave URI:', arweaveResult.arweaveUri);
            const blockchainResult = await issueCertificate(certificateData, arweaveResult.arweaveUri);

            if (!blockchainResult.success) {
                throw new Error(blockchainResult.error || 'Failed to issue certificate on blockchain');
            }

            // Success result combines both operations
            const result = {
                success: true,
                arweave: {
                    txId: arweaveResult.txId,
                    arweaveUri: arweaveResult.arweaveUri
                },
                blockchain: {
                    certificateId: blockchainResult.certificateId,
                    transactionHash: blockchainResult.transactionHash
                },
                metadata: arweaveResult.metadata
            };

            setSuccess(result);
            return result;

        } catch (err) {
            console.error('Error issuing certificate:', err);
            setError(err.message || 'An unexpected error occurred while issuing the certificate');

            return {
                success: false,
                error: err.message || 'Unknown error during certificate issuance'
            };
        } finally {
            setIsStoring(false);
        }
    }, [arweave, issueCertificate]);

    /**
     * Verify and retrieve certificate data from both blockchain and Arweave
     * @param {string} certificateId - Certificate ID on blockchain
     * @returns {Promise<Object>} Certificate data with verification results
     */
    const verifyCertificate = useCallback(async (certificateId) => {
        setIsStoring(true);
        setError(null);

        try {
            // First verify on blockchain
            const { verifyCertificate } = useCertificateContext();
            const blockchainResult = await verifyCertificate(certificateId);

            if (!blockchainResult.success) {
                throw new Error(blockchainResult.error || 'Failed to verify certificate on blockchain');
            }

            // Then retrieve metadata from Arweave if we have a URI
            let metadata = null;
            if (blockchainResult.metadataURI && blockchainResult.metadataURI.startsWith('ar://')) {
                try {
                    const arweaveResult = await arweave.retrieveCertificate(blockchainResult.metadataURI);
                    if (arweaveResult.success) {
                        metadata = arweaveResult.metadata;
                    }
                } catch (metadataErr) {
                    console.warn('Error retrieving metadata from Arweave:', metadataErr);
                    // Continue even without metadata
                }
            }

            // Combine results
            return {
                ...blockchainResult,
                metadata
            };

        } catch (err) {
            console.error('Error verifying certificate:', err);
            setError(err.message || 'An error occurred while verifying the certificate');

            return {
                success: false,
                error: err.message
            };
        } finally {
            setIsStoring(false);
        }
    }, [arweave]);

    /**
     * Initialize Arweave storage for demo purposes
     */
    const initializeStorage = useCallback(async () => {
        setIsStoring(true);
        setError(null);

        try {
            // For demo, generate a temporary wallet
            const success = await arweave.generateTestWallet();

            if (!success) {
                throw new Error('Failed to initialize Arweave storage');
            }

            return true;
        } catch (err) {
            console.error('Error initializing storage:', err);
            setError(err.message || 'Failed to initialize storage');
            return false;
        } finally {
            setIsStoring(false);
        }
    }, [arweave]);

    return {
        storeCertificate,
        verifyCertificate,
        initializeStorage,
        isStoring,
        error,
        success,
        isInitialized: arweave.isInitialized
    };
}