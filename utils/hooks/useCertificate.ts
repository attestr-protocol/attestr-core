// utils/hooks/useCertificate.ts (updated for AR.io)
import { useState, useCallback, useEffect } from 'react';
import {
  issueCertificate,
  verifyCertificate,
  getCertificatesForRecipient,
  getCertificatesForIssuer
} from '../blockchain/contractUtils';
import type { VerificationResult } from '../blockchain/contractUtils';
import {
  formatCertificateMetadata,
  storeCertificateMetadata,
  retrieveCertificateMetadata,
  isStorageInitialized,
  getCurrentWalletAddress
} from '../storage/arweaveStorage';
import type { CertificateData, CertificateMetadata } from '../storage/arweaveStorage';
import { getProvider } from '../blockchain/walletUtils';

interface CertificateResultWithStatus extends VerificationResult {
  status?: string;
}

interface CertificateIssuanceResult {
  success: boolean;
  certificateId?: string;
  transactionHash?: string;
  metadataURI?: string;
  metadata?: CertificateMetadata;
  arweaveTxId?: string;
  error?: string;
}

interface UseCertificateReturn {
  issueNewCertificate: (certificateData: CertificateData) => Promise<CertificateIssuanceResult>;
  verifyExistingCertificate: (certificateId: string) => Promise<CertificateResultWithStatus>;
  getRecipientCertificates: (walletAddress: string) => Promise<CertificateResultWithStatus[]>;
  getIssuerCertificates: (walletAddress: string) => Promise<CertificateResultWithStatus[]>;
  checkStorageStatus: () => Promise<boolean>;
  arweaveAddress: string | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  storageInitialized: boolean;
}

/**
 * Custom hook for certificate operations with AR.io integration
 * @returns Certificate functions and state
 */
export const useCertificate = (): UseCertificateReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [storageInitialized, setStorageInitialized] = useState<boolean>(false);
  const [arweaveAddress, setArweaveAddress] = useState<string | null>(null);

  // Check storage initialized state on mount
  useEffect(() => {
    const checkStorage = async (): Promise<void> => {
      const initialized = isStorageInitialized();
      setStorageInitialized(initialized);

      if (initialized) {
        try {
          const address = await getCurrentWalletAddress();
          setArweaveAddress(address);
        } catch (error) {
          console.warn('Could not get current AR.io wallet address', error);
        }
      }
    };

    checkStorage();
  }, []);

  // Helper to show and auto-hide success messages
  const showSuccess = (message: string): void => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Issue a new certificate
  const issueNewCertificate = useCallback(async (certificateData: CertificateData): Promise<CertificateIssuanceResult> => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Make sure storage is initialized
      if (!isStorageInitialized()) {
        throw new Error('AR.io storage not initialized. Please initialize your AR.io wallet first.');
      }

      // Get current wallet if not provided
      let { issuerWallet } = certificateData;
      if (!issuerWallet) {
        try {
          const provider = getProvider();
          const signer = provider.getSigner();
          issuerWallet = await signer.getAddress();
          certificateData.issuerWallet = issuerWallet;
        } catch (walletError) {
          console.error('Error getting wallet address:', walletError);
          throw new Error('Failed to get wallet address. Please ensure you are connected to MetaMask.');
        }
      }

      // Format metadata
      const metadata = formatCertificateMetadata({
        ...certificateData,
        issuerWallet,
      });

      // Store metadata on AR.io
      console.log('Storing certificate metadata on AR.io testnet...');
      const txId = await storeCertificateMetadata(metadata);
      const metadataURI = `ar://${txId}`;
      console.log('Metadata stored with URI:', metadataURI);

      // Issue certificate on blockchain
      console.log('Issuing certificate on blockchain...');
      const result = await issueCertificate(certificateData, metadataURI);

      if (!result.success) {
        throw new Error(result.error || 'Failed to issue certificate on blockchain');
      }

      // Add metadata to the result
      const finalResult: CertificateIssuanceResult = {
        ...result,
        metadata,
        arweaveTxId: txId,
      };

      showSuccess(`Certificate issued successfully with ID: ${result.certificateId?.substring(0, 10)}...`);
      return finalResult;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      setError((error as Error).message || 'An error occurred while issuing the certificate');
      return {
        success: false,
        error: (error as Error).message || 'Unknown error during certificate issuance'
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify a certificate
  const verifyExistingCertificate = useCallback(async (certificateId: string): Promise<CertificateResultWithStatus> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get certificate information from blockchain
      const result = await verifyCertificate(certificateId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify certificate');
      }

      // Try to get metadata if available
      if (result.metadataURI && result.metadataURI.startsWith('ar://')) {
        try {
          const metadata = await retrieveCertificateMetadata(result.metadataURI);
          result.metadata = metadata;
        } catch (metadataError) {
          console.warn('Error retrieving metadata:', metadataError);
          // Continue even without metadata
        }
      }

      // Determine certificate status for UI
      let status = 'valid';
      if (!result.isValid) {
        status = result.revoked ? 'revoked' : 'invalid';
      } else if (result.expiryDate && new Date(result.expiryDate) < new Date()) {
        status = 'expired';
      }

      return { ...result, status };
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setError((error as Error).message || 'An error occurred while verifying the certificate');
      return { 
        success: false, 
        isValid: false,
        error: (error as Error).message 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get certificates for a recipient
  const getRecipientCertificates = useCallback(async (walletAddress: string): Promise<CertificateResultWithStatus[]> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const certificates = await getCertificatesForRecipient(walletAddress);

      // Add a status property for UI purposes
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
      setError((error as Error).message || 'An error occurred while fetching certificates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get certificates issued by an institution
  const getIssuerCertificates = useCallback(async (walletAddress: string): Promise<CertificateResultWithStatus[]> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      const certificates = await getCertificatesForIssuer(walletAddress);

      // Add a status property for UI purposes
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
      setError((error as Error).message || 'An error occurred while fetching issued certificates');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if storage is already initialized
  const checkStorageStatus = useCallback(async (): Promise<boolean> => {
    const initialized = isStorageInitialized();
    setStorageInitialized(initialized);

    if (initialized) {
      try {
        const address = await getCurrentWalletAddress();
        setArweaveAddress(address);
      } catch (error) {
        console.warn('Could not get current AR.io wallet address', error);
      }
    }

    return initialized;
  }, []);

  return {
    issueNewCertificate,
    verifyExistingCertificate,
    getRecipientCertificates,
    getIssuerCertificates,
    checkStorageStatus,
    arweaveAddress,
    isLoading,
    error,
    successMessage,
    storageInitialized
  };
};

export type { UseCertificateReturn, CertificateResultWithStatus, CertificateIssuanceResult };