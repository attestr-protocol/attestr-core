import { ethers } from 'ethers';
import CertificateIssuanceABI from '../../contracts/abis/CertificateIssuance.json';
import VerificationABI from '../../contracts/abis/Verification.json';
import { getProvider } from './walletUtils';
import {
    formatCertificateMetadata,
    storeCertificateMetadata,
    retrieveCertificateMetadata
} from '../storage/ipfsStorage';

// Contract addresses from environment variables
const getContractAddresses = () => ({
    certificateIssuance: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
    verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS,
});

/**
 * Get a contract instance
 * @param {string} contractName - Name of the contract
 * @param {boolean} withSigner - Whether to connect with a signer (for transactions)
 * @returns {Promise<ethers.Contract>} Contract instance
 */
export const getContract = async (contractName, withSigner = false) => {
    try {
        const provider = getProvider();
        const addresses = getContractAddresses();

        // Get the contract address
        const address = addresses[contractName];
        if (!address) {
            throw new Error(`Contract address not found for ${contractName}. Make sure your environment variables are set correctly.`);
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
    } catch (error) {
        console.error(`Error getting ${contractName} contract:`, error);
        throw error;
    }
};

/**
 * Issue a certificate on the blockchain
 * @param {Object} certificateData - Certificate data
 * @returns {Promise<Object>} Transaction result with certificate ID
 */
export const issueCertificate = async (certificateData) => {
    try {
        // Format the metadata
        const metadata = formatCertificateMetadata(certificateData);

        // Store metadata on IPFS
        console.log('Storing certificate metadata on IPFS...');
        const ipfsCid = await storeCertificateMetadata(metadata);
        const metadataURI = `ipfs://${ipfsCid}`;
        console.log('Metadata stored with URI:', metadataURI);

        const contract = await getContract('certificateIssuance', true);

        // Prepare transaction parameters
        const recipient = certificateData.recipientWallet;
        const expiryDate = certificateData.expiryDate
            ? Math.floor(new Date(certificateData.expiryDate).getTime() / 1000)
            : 0;

        console.log("Issuing certificate with params:", {
            recipient,
            metadataURI,
            expiryDate
        });

        // Issue certificate
        console.log('Sending transaction to blockchain...');
        const tx = await contract.issueCertificate(
            recipient,
            metadataURI,
            expiryDate
        );

        console.log('Transaction submitted:', tx.hash);
        console.log('Waiting for confirmation...');

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Find the CertificateIssued event in the logs to get the certificate ID
        const event = receipt.events.find(e => e.event === 'CertificateIssued');
        if (!event) {
            throw new Error('Certificate issued but event not found in transaction receipt');
        }

        const certificateId = event.args.id;
        console.log('Certificate ID:', certificateId);

        return {
            success: true,
            certificateId,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            metadataURI,
            metadata
        };
    } catch (error) {
        console.error('Error issuing certificate:', error);
        return {
            success: false,
            error: error.message || 'Failed to issue certificate',
        };
    }
};

/**
 * Verify a certificate on the blockchain
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Object>} Verification result
 */
export const verifyCertificate = async (certificateId) => {
    try {
        // First check if the certificate exists and is valid
        const certContract = await getContract('certificateIssuance');
        const verificationResult = await certContract.verifyCertificate(certificateId);

        const [isValid, issuer, issueDate, expiryDate] = verificationResult;

        // If valid, get the full certificate details
        let certificateDetails = { success: false };

        try {
            const details = await certContract.getCertificate(certificateId);
            const [issuerAddr, recipient, metadataURI, issueDateValue, expiryDateValue, revoked] = details;

            certificateDetails = {
                success: true,
                isValid: isValid && !revoked,
                certificateId,
                issuer: issuerAddr,
                recipient,
                metadataURI,
                issueDate: new Date(issueDateValue.toNumber() * 1000).toISOString(),
                expiryDate: expiryDateValue.toNumber() > 0
                    ? new Date(expiryDateValue.toNumber() * 1000).toISOString()
                    : null,
                revoked,
            };

            // Try to fetch metadata if available
            if (metadataURI) {
                try {
                    console.log('Retrieving metadata from IPFS:', metadataURI);
                    const metadata = await retrieveCertificateMetadata(metadataURI);
                    certificateDetails.metadata = metadata;
                    console.log('Metadata retrieved successfully');
                } catch (metadataError) {
                    console.warn('Could not fetch metadata:', metadataError);
                    // Continue even if metadata fetch fails
                }
            }
        } catch (detailsError) {
            console.error('Error getting certificate details:', detailsError);
            // Return basic verification result if details fetch fails
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

        return certificateDetails;
    } catch (error) {
        console.error('Error verifying certificate:', error);
        return {
            success: false,
            isValid: false,
            error: error.message || 'Failed to verify certificate',
        };
    }
};

/**
 * Record a verification on the blockchain
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Object>} Verification record result
 */
export const recordVerification = async (certificateId) => {
    try {
        const contract = await getContract('verification', true);

        // Record verification
        console.log('Recording verification for certificate:', certificateId);
        const tx = await contract.verifyCertificate(certificateId);
        console.log('Verification transaction submitted:', tx.hash);

        const receipt = await tx.wait();
        console.log('Verification transaction confirmed in block:', receipt.blockNumber);

        // Find the CertificateVerified event in the logs
        const event = receipt.events.find(e => e.event === 'CertificateVerified');
        if (!event) {
            throw new Error('Verification recorded but event not found in transaction receipt');
        }

        const { verificationId, isValid } = event.args;

        return {
            success: true,
            verificationId,
            certificateId,
            isValid,
            transactionHash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error recording verification:', error);
        return {
            success: false,
            error: error.message || 'Failed to record verification',
        };
    }
};

/**
 * Get certificates for a recipient
 * @param {string} address - Recipient wallet address
 * @returns {Promise<Array>} Array of certificate objects
 */
export const getCertificatesForRecipient = async (address) => {
    try {
        console.log('Getting certificates for recipient:', address);
        const contract = await getContract('certificateIssuance');
        const certificateIds = await contract.getCertificatesForRecipient(address);
        console.log(`Found ${certificateIds.length} certificates for recipient`);

        // For each certificate ID, get the full details
        const certificates = await Promise.all(
            certificateIds.map(async (id) => {
                const result = await verifyCertificate(id);
                // Add recipient address for reference
                if (result.success) {
                    result.recipientAddress = address;
                }
                return result;
            })
        );

        return certificates.filter(cert => cert.success);
    } catch (error) {
        console.error('Error getting certificates for recipient:', error);
        return [];
    }
};

/**
 * Get certificates issued by an institution
 * @param {string} address - Issuer wallet address
 * @returns {Promise<Array>} Array of certificate objects
 */
export const getCertificatesForIssuer = async (address) => {
    try {
        console.log('Getting certificates issued by:', address);
        const contract = await getContract('certificateIssuance');
        const certificateIds = await contract.getCertificatesForIssuer(address);
        console.log(`Found ${certificateIds.length} certificates issued by the institution`);

        // For each certificate ID, get the full details
        const certificates = await Promise.all(
            certificateIds.map(async (id) => {
                const result = await verifyCertificate(id);
                // Add issuer address for reference
                if (result.success) {
                    result.issuerAddress = address;
                }
                return result;
            })
        );

        return certificates.filter(cert => cert.success);
    } catch (error) {
        console.error('Error getting certificates for issuer:', error);
        return [];
    }
};

/**
 * Check if an address is a verified issuer
 * @param {string} address - Wallet address to check
 * @returns {Promise<boolean>} Whether the address is a verified issuer
 */
export const isVerifiedIssuer = async (address) => {
    try {
        const contract = await getContract('certificateIssuance');
        return await contract.verifiedIssuers(address);
    } catch (error) {
        console.error('Error checking if address is verified issuer:', error);
        return false;
    }
};

/**
 * Get verification details
 * @param {string} verificationId - Verification ID
 * @returns {Promise<Object>} Verification details
 */
export const getVerificationDetails = async (verificationId) => {
    try {
        const contract = await getContract('verification');
        const details = await contract.getVerification(verificationId);

        const [certificateId, verifier, timestamp, isValid] = details;

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
};