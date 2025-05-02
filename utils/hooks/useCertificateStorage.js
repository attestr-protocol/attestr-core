// utils/hooks/useCertificateStorage.js
import { useState, useCallback } from 'react';
import { useArweave } from '../../contexts/ArweaveContext';
import { useCertificateContext } from '../../contexts/CertificateContext';
import {
    createMockTransaction,
    retrieveMockTransaction,
    formatCertificateMetadata
} from '../storage/arweaveStorage';

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
            // Format metadata first (we'll need it regardless of storage method)
            const metadata = formatCertificateMetadata(certificateData);
            let txId, arweaveUri;

            // Try to store on Arweave if initialized
            if (arweave.isInitialized) {
                try {
                    console.log('Storing certificate metadata on Arweave...');
                    const arweaveResult = await arweave.storeCertificate(certificateData);

                    if (arweaveResult.success) {
                        txId = arweaveResult.txId;
                        arweaveUri = arweaveResult.arweaveUri;
                        console.log('Successfully stored on Arweave with ID:', txId);
                    } else {
                        throw new Error(arweaveResult.error || 'Failed to store on Arweave');
                    }
                } catch (arweaveError) {
                    console.warn('Arweave storage failed, using fallback storage:', arweaveError);
                    // Fallback to mock storage if Arweave fails
                    txId = createMockTransaction(metadata);
                    arweaveUri = `ar://${txId}`;
                    console.log('Using fallback storage with mock ID:', txId);
                }
            } else {
                // Use mock storage if Arweave is not initialized
                console.log('Arweave not initialized, using fallback storage');
                txId = createMockTransaction(metadata);
                arweaveUri = `ar://${txId}`;
                console.log('Using fallback storage with mock ID:', txId);
            }

            // Issue certificate on blockchain with URI
            console.log('Issuing certificate on blockchain with URI:', arweaveUri);
            const blockchainResult = await issueCertificate(certificateData, arweaveUri);

            if (!blockchainResult.success) {
                throw new Error(blockchainResult.error || 'Failed to issue certificate on blockchain');
            }

            // Success result combines both operations
            const result = {
                success: true,
                arweave: {
                    txId,
                    arweaveUri
                },
                blockchain: {
                    certificateId: blockchainResult.certificateId,
                    transactionHash: blockchainResult.transactionHash
                },
                metadata
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
                const txId = blockchainResult.metadataURI.replace('ar://', '');

                try {
                    // First try to get from Arweave 
                    if (arweave.isInitialized) {
                        const arweaveResult = await arweave.retrieveCertificate(blockchainResult.metadataURI);
                        if (arweaveResult.success) {
                            metadata = arweaveResult.metadata;
                        }
                    }

                    // If that fails or we're not initialized, try the fallback
                    if (!metadata) {
                        const mockData = retrieveMockTransaction(txId);
                        if (mockData) {
                            metadata = mockData;
                            console.log('Retrieved metadata from fallback storage');
                        }
                    }
                } catch (metadataErr) {
                    console.warn('Error retrieving metadata from Arweave:', metadataErr);
                    // Try fallback
                    const mockData = retrieveMockTransaction(txId);
                    if (mockData) {
                        metadata = mockData;
                        console.log('Retrieved metadata from fallback storage after Arweave failure');
                    }
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