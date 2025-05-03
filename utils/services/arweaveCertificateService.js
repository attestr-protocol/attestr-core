// utils/certificate/certificateService.js
import { ethers } from 'ethers';
import CertificateIssuanceABI from '../../contracts/abis/CertificateIssuance.json';
import VerificationABI from '../../contracts/abis/Verification.json';
import { getProvider } from '../blockchain/walletUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata,
    retrieveCertificateMetadata,
    isStorageInitialized,
    getGatewayUrl
} from '../storage/arweaveStorage';

// Contract addresses from environment variables
const CONTRACT_ADDRESSES = {
    certificateIssuance: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
    verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS,
};

/**
 * Certificate Service - Unified certificate operations that combine
 * blockchain interactions and permanent storage on AR.IO
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
     * @param {string} metadataURI - Optional AR.IO URI if metadata is already stored
     * @returns {Promise<Object>} Result of certificate issuance
     */
    async issueCertificate(certificateData, metadataURI = null) {
        try {
            // Step 1: Format metadata if not already done
            const metadata = formatCertificateMetadata(certificateData);

            // Step 2: Store metadata on AR.IO if not already stored
            if (!metadataURI) {
                if (!isStorageInitialized()) {
                    throw new Error('AR.IO storage not initialized. Please initialize storage first.');
                }

                console.log('Storing certificate metadata on AR.IO testnet...');
                const txId = await storeCertificateMetadata(metadata);
                metadataURI = `ar://${txId}`;
                console.log('Metadata stored on AR.IO with URI:', metadataURI);
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
     * Verify a certificate on the blockchain and retrieve its metadata from AR.IO
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

            // Try to fetch metadata from AR.IO if available
            let metadata = null;
            if (metadataURI && metadataURI.startsWith('ar://')) {
                try {
                    console.log('Retrieving metadata from AR.IO:', metadataURI);
                    metadata = await retrieveCertificateMetadata(metadataURI);
                    console.log('Successfully retrieved metadata from AR.IO');
                } catch (error) {
                    console.warn('Error retrieving metadata from AR.IO:', error);
                    // Continue without metadata
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
                arweaveUrl: metadataURI ? getGatewayUrl(metadataURI.replace('ar://', '')) : null,
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
            const { verificationId, isValid } = event.args;

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