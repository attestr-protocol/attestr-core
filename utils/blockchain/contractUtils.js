import { ethers } from 'ethers';

// Contract ABIs - will be replaced with actual compiled ABIs
import CertificateIssuanceABI from '../../contracts/abis/CertificateIssuance.json';
import VerificationABI from '../../contracts/abis/Verification.json';

// Contract addresses - will be updated after deployment
const CONTRACT_ADDRESSES = {
    certificateIssuance: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
    verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS,
};

/**
 * Get an ethers provider instance
 * @returns {ethers.providers.Web3Provider} Provider instance
 */
export const getProvider = () => {
    // Check if window is defined (browser environment)
    if (typeof window !== 'undefined' && window.ethereum) {
        return new ethers.providers.Web3Provider(window.ethereum);
    }
    // Fallback to a JSON-RPC provider (for server-side)
    return new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
};

/**
 * Get a contract instance
 * @param {string} contractName - Name of the contract
 * @param {boolean} withSigner - Whether to connect with a signer (for transactions)
 * @returns {ethers.Contract} Contract instance
 */
export const getContract = async (contractName, withSigner = false) => {
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
};

/**
 * Issue a certificate on the blockchain
 * @param {Object} certificateData - Certificate data
 * @param {string} metadataURI - IPFS URI for certificate metadata
 * @returns {Promise<Object>} Transaction result with certificate ID
 */
export const issueCertificate = async (certificateData, metadataURI) => {
    try {
        const contract = await getContract('certificateIssuance', true);

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
        };
    } catch (error) {
        console.error('Error issuing certificate:', error);
        return {
            success: false,
            error: error.message,
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
        if (isValid) {
            const certificateDetails = await certContract.getCertificate(certificateId);
            const [issuerAddr, recipient, metadataURI, issueDateValue, expiryDateValue, revoked] = certificateDetails;

            return {
                success: true,
                isValid,
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
        }

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
    } catch (error) {
        console.error('Error verifying certificate:', error);
        return {
            success: false,
            isValid: false,
            error: error.message,
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
        };
    } catch (error) {
        console.error('Error recording verification:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Get certificates for a recipient
 * @param {string} address - Recipient wallet address
 * @returns {Promise<Array>} Array of certificate IDs
 */
export const getCertificatesForRecipient = async (address) => {
    try {
        const contract = await getContract('certificateIssuance');
        const certificateIds = await contract.getCertificatesForRecipient(address);

        // For each certificate ID, get the full details
        const certificates = await Promise.all(
            certificateIds.map(async (id) => {
                return await verifyCertificate(id);
            })
        );

        return certificates.filter(cert => cert.success);
    } catch (error) {
        console.error('Error getting certificates:', error);
        return [];
    }
};

/**
 * Get certificates issued by an institution
 * @param {string} address - Issuer wallet address
 * @returns {Promise<Array>} Array of certificate IDs
 */
export const getCertificatesForIssuer = async (address) => {
    try {
        const contract = await getContract('certificateIssuance');
        const certificateIds = await contract.getCertificatesForIssuer(address);

        // For each certificate ID, get the full details
        const certificates = await Promise.all(
            certificateIds.map(async (id) => {
                return await verifyCertificate(id);
            })
        );

        return certificates.filter(cert => cert.success);
    } catch (error) {
        console.error('Error getting certificates:', error);
        return [];
    }
};