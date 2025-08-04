// utils/services/arweaveCertificateService.ts
import { ethers, BigNumber } from 'ethers';
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
import type { CertificateData, CertificateMetadata } from '../storage/arweaveStorage';

type ContractName = 'certificateIssuance' | 'verification';

interface ContractAddresses {
  certificateIssuance?: string;
  verification?: string;
}

interface CertificateIssuanceResult {
  success: boolean;
  certificateId?: string;
  transactionHash?: string;
  metadataURI?: string;
  metadata?: CertificateMetadata;
  error?: string;
}

interface VerificationResult {
  success: boolean;
  isValid: boolean;
  status?: string;
  certificateId?: string;
  issuer?: string;
  recipient?: string;
  metadataURI?: string;
  metadata?: CertificateMetadata | null;
  issueDate?: string;
  expiryDate?: string | null;
  revoked?: boolean;
  arweaveUrl?: string | null;
  error?: string;
}

interface VerificationRecordResult {
  success: boolean;
  verificationId?: string;
  certificateId?: string;
  isValid?: boolean;
  transactionHash?: string;
  timestamp?: string;
  error?: string;
}

interface VerificationDetailsResult {
  success: boolean;
  verificationId?: string;
  certificateId?: string;
  verifier?: string;
  timestamp?: string;
  isValid?: boolean;
  error?: string;
}

interface EventLog {
  event?: string;
  args: any;
}

interface TransactionReceipt {
  transactionHash: string;
  events: EventLog[];
}

// Contract addresses from environment variables
const CONTRACT_ADDRESSES: ContractAddresses = {
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
   * @param contractName - Name of the contract
   * @param withSigner - Whether to connect with a signer (for transactions)
   * @returns Contract instance
   */
  async getContract(contractName: ContractName, withSigner: boolean = false): Promise<ethers.Contract> {
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
   * @param certificateData - Certificate data
   * @param metadataURI - Optional AR.IO URI if metadata is already stored
   * @returns Result of certificate issuance
   */
  async issueCertificate(
    certificateData: CertificateData, 
    metadataURI: string | null = null
  ): Promise<CertificateIssuanceResult> {
    try {
      // Step 1: Format metadata if not already done
      const metadata = formatCertificateMetadata(certificateData);
      let finalMetadataURI = metadataURI;

      // Step 2: Store metadata on AR.IO if not already stored
      if (!finalMetadataURI) {
        if (!isStorageInitialized()) {
          throw new Error('AR.IO storage not initialized. Please initialize storage first.');
        }

        console.log('Storing certificate metadata on AR.IO testnet...');
        const txId = await storeCertificateMetadata(metadata);
        finalMetadataURI = `ar://${txId}`;
        console.log('Metadata stored on AR.IO with URI:', finalMetadataURI);
      }

      // Step 3: Issue certificate on the blockchain
      console.log('Issuing certificate on blockchain with URI:', finalMetadataURI);
      const contract = await this.getContract('certificateIssuance', true);

      // Prepare transaction parameters
      const recipient = certificateData.recipientWallet;
      const expiryDate = certificateData.expiryDate
        ? Math.floor(new Date(certificateData.expiryDate).getTime() / 1000)
        : 0;

      // Issue certificate
      const tx = await contract.issueCertificate(
        recipient,
        finalMetadataURI,
        expiryDate
      );

      // Wait for transaction confirmation
      const receipt: TransactionReceipt = await tx.wait();

      // Find the CertificateIssued event in the logs to get the certificate ID
      const event = receipt.events.find((e: EventLog) => e.event === 'CertificateIssued');
      if (!event) {
        throw new Error('CertificateIssued event not found in transaction receipt');
      }
      const certificateId = event.args.id;

      return {
        success: true,
        certificateId,
        transactionHash: receipt.transactionHash,
        metadataURI: finalMetadataURI,
        metadata,
      };
    } catch (error) {
      console.error('Error issuing certificate:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to issue certificate',
      };
    }
  }

  /**
   * Verify a certificate on the blockchain and retrieve its metadata from AR.IO
   * @param certificateId - Certificate ID
   * @returns Verification result with metadata
   */
  async verifyCertificate(certificateId: string): Promise<VerificationResult> {
    try {
      // First check if the certificate exists and is valid
      const certContract = await this.getContract('certificateIssuance');
      const verificationResult = await certContract.verifyCertificate(certificateId);

      const [isValid, issuer, issueDate, expiryDate] = verificationResult;

      // If certificate exists, get the full certificate details
      let certificateDetails: any;
      try {
        certificateDetails = await certContract.getCertificate(certificateId);
      } catch (error) {
        console.error('Error getting certificate details:', error);
        return {
          success: true,
          isValid,
          certificateId,
          issuer,
          issueDate: (issueDate as BigNumber).toNumber() > 0
            ? new Date((issueDate as BigNumber).toNumber() * 1000).toISOString()
            : undefined,
          expiryDate: (expiryDate as BigNumber).toNumber() > 0
            ? new Date((expiryDate as BigNumber).toNumber() * 1000).toISOString()
            : null,
        };
      }

      // Extract certificate details
      const [issuerAddr, recipient, metadataURI, issueDateValue, expiryDateValue, revoked] = certificateDetails;

      // Try to fetch metadata from AR.IO if available
      let metadata: CertificateMetadata | null = null;
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
      } else if ((expiryDateValue as BigNumber).toNumber() > 0 &&
        (new Date((expiryDateValue as BigNumber).toNumber() * 1000) < new Date())) {
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
        issueDate: new Date((issueDateValue as BigNumber).toNumber() * 1000).toISOString(),
        expiryDate: (expiryDateValue as BigNumber).toNumber() > 0
          ? new Date((expiryDateValue as BigNumber).toNumber() * 1000).toISOString()
          : null,
        revoked,
        arweaveUrl: metadataURI ? getGatewayUrl(metadataURI.replace('ar://', '')) : null,
      };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return {
        success: false,
        isValid: false,
        error: (error as Error).message || 'Failed to verify certificate',
      };
    }
  }

  /**
   * Record a verification on the blockchain
   * @param certificateId - Certificate ID
   * @returns Verification record result
   */
  async recordVerification(certificateId: string): Promise<VerificationRecordResult> {
    try {
      const contract = await this.getContract('verification', true);

      // Record verification
      const tx = await contract.verifyCertificate(certificateId);
      const receipt: TransactionReceipt = await tx.wait();

      // Find the CertificateVerified event in the logs
      const event = receipt.events.find((e: EventLog) => e.event === 'CertificateVerified');
      if (!event) {
        throw new Error('CertificateVerified event not found in transaction receipt');
      }
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
        error: (error as Error).message || 'Failed to record verification',
      };
    }
  }

  /**
   * Get verification details by verification ID
   * @param verificationId - Verification ID
   * @returns Verification details
   */
  async getVerificationDetails(verificationId: string): Promise<VerificationDetailsResult> {
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
        timestamp: new Date((timestamp as BigNumber).toNumber() * 1000).toISOString(),
        isValid,
      };
    } catch (error) {
      console.error('Error getting verification details:', error);
      return {
        success: false,
        error: (error as Error).message || 'Failed to get verification details',
      };
    }
  }

  /**
   * Get certificates for a recipient
   * @param walletAddress - Recipient wallet address
   * @returns Array of certificates
   */
  async getRecipientCertificates(walletAddress: string): Promise<VerificationResult[]> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const contract = await this.getContract('certificateIssuance');
      const certificateIds: string[] = await contract.getCertificatesForRecipient(walletAddress);

      // For each certificate ID, get the full details
      const certificates = await Promise.all(
        certificateIds.map(async (id: string) => {
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
   * @param walletAddress - Issuer wallet address
   * @returns Array of certificates
   */
  async getIssuerCertificates(walletAddress: string): Promise<VerificationResult[]> {
    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const contract = await this.getContract('certificateIssuance');
      const certificateIds: string[] = await contract.getCertificatesForIssuer(walletAddress);

      // For each certificate ID, get the full details
      const certificates = await Promise.all(
        certificateIds.map(async (id: string) => {
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
   * @param address - Issuer wallet address
   * @returns Whether the address is a verified issuer
   */
  async isVerifiedIssuer(address: string): Promise<boolean> {
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

export type { 
  CertificateIssuanceResult, 
  VerificationResult, 
  VerificationRecordResult, 
  VerificationDetailsResult 
};