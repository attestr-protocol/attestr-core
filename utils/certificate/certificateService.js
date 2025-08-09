// utils/certificate/certificateService.js
import { ethers } from 'ethers';
import CertificateIssuanceABI from '../../contracts/abis/CertificateIssuance.json';
import VerificationABI from '../../contracts/abis/Verification.json';
import { getProvider } from '../blockchain/walletUtils';
// TODO: Implement storage integration from scratch later
// import {
//     formatCertificateMetadata,
//     storeCertificateMetadata,
//     retrieveCertificateMetadata,
//     isStorageInitialized,
//     createMockTransaction,
//     retrieveMockTransaction,
// } from '../storage/arweaveStorage';

// Contract addresses from environment variables
const CONTRACT_ADDRESSES = {
    certificateIssuance: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
    verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS,
};

/**
 * Certificate Service - Unified certificate operations that combine
 * blockchain interactions and permanent storage
 */
class CertificateService {
    /**
     * Get a contract instance
     * @param {string} contractName - Name of the contract
     * @param {boolean} withSigner - Whether to connect with a signer (for transactions)
     * @returns {ethers.Contract} Contract instance
     */
    async getContract(contractName, withSigner = false) {
        const provider = getProvider();

        // Get the contract address
        const address = CONTRACT_ADDRESSES[contractName];
        if (!address) {
            throw new Error(`Contract address not found for ${contractName}`);
        }

        // Get the contract ABI
        const abi = contractName === 'certificateIssuance'
            ? CertificateIssuanceABI
            : VerificationABI;

        // Connect with or without a signer
        if (withSigner) {
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            return new ethers.Contract(address, abi, signer);
        }

        return new ethers.Contract(address, abi, provider);
    }

    /**
     * Issue a certificate including metadata storage and blockchain registration
     * @param {Object} certificateData - Certificate data
     * @returns {Promise<Object>} Result of certificate issuance
     */
    async issueCertificate(certificateData) {
        try {
            // Step 1: Format metadata
            const metadata = formatCertificateMetadata(certificateData);
            let metadataURI;

            // Step 2: Store metadata on Arweave if storage is initialized
            if (isStorageInitialized()) {
                try {
                    console.log('Storing certificate metadata on Arweave...');
                    const txId = await storeCertificateMetadata(metadata);
                    metadataURI = `ar://${txId}`;
                    console.log('Metadata stored on Arweave with URI:', metadataURI);
                } catch (arweaveError) {
                    console.warn('Failed to store on Arweave, using fallback storage:', arweaveError);
                    // Use fallback storage
                    const mockTxId = createMockTransaction(metadata);
                    metadataURI = `ar://${mockTxId}`;
                    console.log('Using fallback storage with mock ID:', mockTxId);
                }
            } else {
                // Use fallback storage if Arweave is not initialized
                console.log('Arweave not initialized, using fallback storage');
                const mockTxId = createMockTransaction(metadata);
                metadataURI = `ar://${mockTxId}`;
                console.log('Using fallback storage with mock ID:', mockTxId);
            }

            // Step 3: Issue certificate on the blockchain
            console.log('Issuing certificate on blockchain with URI:', metadataURI);
            const contract = await this.getContract('certificateIssuance', true);

            // Prepare transaction parameters
            const recipient = certificateData.recipientWallet;
            const expiryDate = certificateData.expiryDate
                ? Math.floor(new Date(certificateData.expiryDate).getTime() / 1000)
                : 0;

            // Issue certificate
            const tx = await contract.issueCertificate(
                recipient,
                metadataURI,
                expiryDate
            );

            // Wait for transaction confirmation
            const receipt = await tx.wait();

            // Find the CertificateIssued event in the logs to get the certificate ID
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            const certificateId = event.args.id;

            return {
                success: true,
                certificateId,
                transactionHash: receipt.transactionHash,
                metadataURI,
                metadata,
            };
        } catch (error) {
            console.error('Error issuing certificate:', error);
            return {
                success: false,
                error: error.message || 'Failed to issue certificate',
            };
        }
    }

    /**
     * Verify a certificate on the blockchain and retrieve its metadata
     * @param {string} certificateId - Certificate ID
     * @returns {Promise<Object>} Verification result with metadata
     */
    async verifyCertificate(certificateId) {
        try {
            // First check if the certificate exists and is valid
            const certContract = await this.getContract('certificateIssuance');
            const verificationResult = await certContract.verifyCertificate(certificateId);

            const [isValid, issuer, issueDate, expiryDate] = verificationResult;

            // If certificate exists, get the full certificate details
            let certificateDetails;
            try {
                certificateDetails = await certContract.getCertificate(certificateId);
            } catch (error) {
                console.error('Error getting certificate details:', error);
                return {
                    success: true,
                    isValid,
                    certificateId,
                    issuer,
                    issueDate: issueDate.toNumber() > 0
                        ? new Date(issueDate.toNumber() * 1000).toISOString()
                        : null,
                    expiryDate: expiryDate.toNumber() > 0
                        ? new Date(expiryDate.toNumber() * 1000).toISOString()
                        : null,
                };
            }

            // Extract certificate details
            const [issuerAddr, recipient, metadataURI, issueDateValue, expiryDateValue, revoked] = certificateDetails;

            // Try to fetch metadata if available
            let metadata = null;
            if (metadataURI && metadataURI.startsWith('ar://')) {
                const txId = metadataURI.replace('ar://', '');

                try {
                    // First try to get from Arweave
                    if (isStorageInitialized()) {
                        console.log('Retrieving metadata from Arweave:', txId);
                        metadata = await retrieveCertificateMetadata(metadataURI);
                        console.log('Successfully retrieved metadata from Arweave');
                    }
                } catch (arweaveError) {
                    console.warn('Error retrieving metadata from Arweave:', arweaveError);
                    // Continue without metadata
                }

                // If that fails or we're not initialized, try the fallback
                if (!metadata) {
                    try {
                        console.log('Trying fallback storage for metadata');
                        metadata = retrieveMockTransaction(txId);
                        if (metadata) {
                            console.log('Retrieved metadata from fallback storage');
                        }
                    } catch (fallbackError) {
                        console.warn('Error retrieving metadata from fallback storage:', fallbackError);
                        // Continue without metadata
                    }
                }
            }

            // Determine certificate status for UI
            let status = 'valid';
            if (!isValid || revoked) {
                status = revoked ? 'revoked' : 'invalid';
            } else if (expiryDateValue.toNumber() > 0 &&
                (new Date(expiryDateValue.toNumber() * 1000) < new Date())) {
                status = 'expired';
            }

            return {
                success: true,
                isValid: isValid && !revoked,
                status,
                certificateId,
                issuer: issuerAddr,
                recipient,
                metadataURI,
                metadata,
                issueDate: new Date(issueDateValue.toNumber() * 1000).toISOString(),
                expiryDate: expiryDateValue.toNumber() > 0
                    ? new Date(expiryDateValue.toNumber() * 1000).toISOString()
                    : null,
                revoked,
            };
        } catch (error) {
            console.error('Error verifying certificate:', error);
            return {
                success: false,
                isValid: false,
                error: error.message || 'Failed to verify certificate',
            };
        }
    }

    /**
     * Record a verification on the blockchain
     * @param {string} certificateId - Certificate ID
     * @returns {Promise<Object>} Verification record result
     */
    async recordVerification(certificateId) {
        try {
            const contract = await this.getContract('verification', true);

            // Record verification
            const tx = await contract.verifyCertificate(certificateId);
            const receipt = await tx.wait();

            // Find the CertificateVerified event in the logs
            const event = receipt.events.find(e => e.event === 'CertificateVerified');
            const {verificationId, isValid} = event.args;

            return {
                success: true,
                verificationId,
                certificateId,
                isValid,
                transactionHash: receipt.transactionHash,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Error recording verification:', error);
            return {
                success: false,
                error: error.message || 'Failed to record verification',
            };
        }
    }

    /**
     * Get verification details by verification ID
     * @param {string} verificationId - Verification ID
     * @returns {Promise<Object>} Verification details
     */
    async getVerificationDetails(verificationId) {
        try {
            const contract = await this.getContract('verification');
            const result = await contract.getVerification(verificationId);

            // Extract verification details
            const [certificateId, verifier, timestamp, isValid] = result;

            return {
                success: true,
                verificationId,
                certificateId,
                verifier,
                timestamp: new Date(timestamp.toNumber() * 1000).toISOString(),
                isValid,
            };
        } catch (error) {
            console.error('Error getting verification details:', error);
            return {
                success: false,
                error: error.message || 'Failed to get verification details',
            };
        }
    }

    /**
     * Get certificates for a recipient
     * @param {string} walletAddress - Recipient wallet address
     * @returns {Promise<Array>} Array of certificates
     */
    async getRecipientCertificates(walletAddress) {
        try {
            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            const contract = await this.getContract('certificateIssuance');
            const certificateIds = await contract.getCertificatesForRecipient(walletAddress);

            // For each certificate ID, get the full details
            const certificates = await Promise.all(
                certificateIds.map(async (id) => {
                    return await this.verifyCertificate(id);
                })
            );

            return certificates.filter(cert => cert.success);
        } catch (error) {
            console.error('Error getting recipient certificates:', error);
            return [];
        }
    }

    /**
     * Get certificates issued by an institution
     * @param {string} walletAddress - Issuer wallet address
     * @returns {Promise<Array>} Array of certificates
     */
    async getIssuerCertificates(walletAddress) {
        try {
            if (!walletAddress) {
                throw new Error('Wallet address is required');
            }

            const contract = await this.getContract('certificateIssuance');
            const certificateIds = await contract.getCertificatesForIssuer(walletAddress);

            // For each certificate ID, get the full details
            const certificates = await Promise.all(
                certificateIds.map(async (id) => {
                    return await this.verifyCertificate(id);
                })
            );

            return certificates.filter(cert => cert.success);
        } catch (error) {
            console.error('Error getting issuer certificates:', error);
            return [];
        }
    }

    /**
     * Check if an address is a verified issuer
     * @param {string} address - Issuer wallet address
     * @returns {Promise<boolean>} Whether the address is a verified issuer
     */
    async isVerifiedIssuer(address) {
        try {
            const contract = await this.getContract('certificateIssuance');
            return await contract.verifiedIssuers(address);
        } catch (error) {
            console.error('Error checking if address is a verified issuer:', error);
            return false;
        }
    }
}

// Export a singleton instance
export const certificateService = new CertificateService();

// Create custom hook for easier usage in React components
export function useCertificate() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Issue a new certificate
     * @param {Object} certificateData - Certificate data
     * @returns {Promise<Object>} Result of issuance
     */
    const issueCertificate = useCallback(async (certificateData) => {
        setIsLoading(true);
        setError(null);

        try {
            return await certificateService.issueCertificate(certificateData);
        } catch (err) {
            setError(err.message || 'An error occurred while issuing the certificate');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Verify a certificate
     * @param {string} certificateId - Certificate ID
     * @returns {Promise<Object>} Verification result
     */
    const verifyCertificate = useCallback(async (certificateId) => {
        setIsLoading(true);
        setError(null);

        try {
            return await certificateService.verifyCertificate(certificateId);
        } catch (err) {
            setError(err.message || 'An error occurred while verifying the certificate');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Record a verification
     * @param {string} certificateId - Certificate ID
     * @returns {Promise<Object>} Verification result
     */
    const recordVerification = useCallback(async (certificateId) => {
        setIsLoading(true);
        setError(null);

        try {
            return await certificateService.recordVerification(certificateId);
        } catch (err) {
            setError(err.message || 'An error occurred while recording the verification');
            return { success: false, error: err.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get recipient certificates
     * @param {string} address - Wallet address
     * @returns {Promise<Array>} Certificates
     */
    const getRecipientCertificates = useCallback(async (address) => {
        setIsLoading(true);
        setError(null);

        try {
            return await certificateService.getRecipientCertificates(address);
        } catch (err) {
            setError(err.message || 'An error occurred while fetching certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Get issuer certificates
     * @param {string} address - Wallet address
     * @returns {Promise<Array>} Certificates
     */
    const getIssuerCertificates = useCallback(async (address) => {
        setIsLoading(true);
        setError(null);

        try {
            return await certificateService.getIssuerCertificates(address);
        } catch (err) {
            setError(err.message || 'An error occurred while fetching certificates');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        issueCertificate,
        verifyCertificate,
        recordVerification,
        getRecipientCertificates,
        getIssuerCertificates,
        isLoading,
        error
    };
}