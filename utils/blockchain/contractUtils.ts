import { ethers, BigNumber } from 'ethers';
import type { CertificateData, CertificateMetadata } from '../storage/arweaveStorage';

// Contract ABIs - will be replaced with actual compiled ABIs
import CertificateIssuanceABI from '../../contracts/abis/CertificateIssuance.json';
import VerificationABI from '../../contracts/abis/Verification.json';
import { 
  formatCertificateMetadata, 
  storeCertificateMetadata, 
  retrieveCertificateMetadata 
} from '../storage/arweaveStorage';
import { getProvider } from './walletUtils';

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
  error?: string;
}

interface VerificationResult {
  success: boolean;
  isValid: boolean;
  certificateId?: string;
  issuer?: string;
  recipient?: string;
  metadataURI?: string;
  metadata?: CertificateMetadata | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  revoked?: boolean;
  error?: string;
}

interface VerificationRecordResult {
  success: boolean;
  verificationId?: string;
  certificateId?: string;
  isValid?: boolean;
  transactionHash?: string;
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

// Contract addresses - will be updated after deployment
const CONTRACT_ADDRESSES: ContractAddresses = {
  certificateIssuance: process.env.NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS,
  verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS,
};

/**
 * Get a contract instance
 * @param contractName - Name of the contract
 * @param withSigner - Whether to connect with a signer (for transactions)
 * @returns Contract instance
 */
export const getContract = async (
  contractName: ContractName, 
  withSigner: boolean = false
): Promise<ethers.Contract> => {
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
 * @param certificateData - Certificate data
 * @param metadataURI - Arweave URI for certificate metadata
 * @returns Transaction result with certificate ID
 */
export const issueCertificate = async (
  certificateData: CertificateData, 
  metadataURI?: string
): Promise<CertificateIssuanceResult> => {
  try {
    let finalMetadataURI = metadataURI;
    
    // If metadataURI isn't provided, create and store metadata on Arweave
    if (!finalMetadataURI) {
      // Format the metadata
      const metadata = formatCertificateMetadata(certificateData);

      // Store metadata on Arweave
      console.log('Storing certificate metadata on Arweave...');
      const txId = await storeCertificateMetadata(metadata);
      finalMetadataURI = `ar://${txId}`;
      console.log('Metadata stored with URI:', finalMetadataURI);
    }

    const contract = await getContract('certificateIssuance', true);

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
    };
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Verify a certificate on the blockchain
 * @param certificateId - Certificate ID
 * @returns Verification result
 */
export const verifyCertificate = async (certificateId: string): Promise<VerificationResult> => {
  try {
    // First check if the certificate exists and is valid
    const certContract = await getContract('certificateIssuance');
    const verificationResult = await certContract.verifyCertificate(certificateId);

    const [isValid, issuer, issueDate, expiryDate] = verificationResult;

    // If valid, get the full certificate details
    if (isValid) {
      const certificateDetails = await certContract.getCertificate(certificateId);
      const [issuerAddr, recipient, metadataURI, issueDateValue, expiryDateValue, revoked] = certificateDetails;

      // Try to fetch metadata from Arweave if available
      let metadata: CertificateMetadata | null = null;
      if (metadataURI && metadataURI.startsWith('ar://')) {
        try {
          metadata = await retrieveCertificateMetadata(metadataURI);
        } catch (error) {
          console.warn('Error retrieving metadata from Arweave:', error);
          // Continue even if metadata fetch fails
        }
      }

      return {
        success: true,
        isValid,
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
      };
    }

    return {
      success: true,
      isValid,
      certificateId,
      issuer,
      issueDate: (issueDate as BigNumber).toNumber() > 0
        ? new Date((issueDate as BigNumber).toNumber() * 1000).toISOString()
        : null,
      expiryDate: (expiryDate as BigNumber).toNumber() > 0
        ? new Date((expiryDate as BigNumber).toNumber() * 1000).toISOString()
        : null,
    };
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return {
      success: false,
      isValid: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Record a verification on the blockchain
 * @param certificateId - Certificate ID
 * @returns Verification record result
 */
export const recordVerification = async (certificateId: string): Promise<VerificationRecordResult> => {
  try {
    const contract = await getContract('verification', true);

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
    };
  } catch (error) {
    console.error('Error recording verification:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

/**
 * Get certificates for a recipient
 * @param address - Recipient wallet address
 * @returns Array of certificate IDs
 */
export const getCertificatesForRecipient = async (address: string): Promise<VerificationResult[]> => {
  try {
    const contract = await getContract('certificateIssuance');
    const certificateIds: string[] = await contract.getCertificatesForRecipient(address);

    // For each certificate ID, get the full details
    const certificates = await Promise.all(
      certificateIds.map(async (id: string) => {
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
 * @param address - Issuer wallet address
 * @returns Array of certificate IDs
 */
export const getCertificatesForIssuer = async (address: string): Promise<VerificationResult[]> => {
  try {
    const contract = await getContract('certificateIssuance');
    const certificateIds: string[] = await contract.getCertificatesForIssuer(address);

    // For each certificate ID, get the full details
    const certificates = await Promise.all(
      certificateIds.map(async (id: string) => {
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
 * Check if an address is a verified issuer
 * @param address - Issuer wallet address
 * @returns Whether the address is a verified issuer
 */
export const isVerifiedIssuer = async (address: string): Promise<boolean> => {
  try {
    const contract = await getContract('certificateIssuance');
    return await contract.verifiedIssuers(address);
  } catch (error) {
    console.error('Error checking if issuer is verified:', error);
    return false;
  }
};

export type { 
  ContractName, 
  CertificateIssuanceResult, 
  VerificationResult, 
  VerificationRecordResult 
};