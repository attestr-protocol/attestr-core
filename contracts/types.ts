// Type definitions for VeriChain smart contracts
import { ContractInterface } from 'ethers';

// Common types
export type Address = string;
export type Bytes32 = string;
export type BigNumberish = string | number;

// Certificate structure from CertificateIssuance contract
export interface Certificate {
  id: Bytes32;
  issuer: Address;
  recipient: Address;
  metadataURI: string;
  issueDate: BigNumberish;
  expiryDate: BigNumberish;
  revoked: boolean;
}

// Verification structure from Verification contract
export interface VerificationRecord {
  certificateId: Bytes32;
  verifier: Address;
  timestamp: BigNumberish;
  isValid: boolean;
}

// Event types for CertificateIssuance contract
export interface CertificateIssuedEvent {
  id: Bytes32;
  issuer: Address;
  recipient: Address;
  issueDate: BigNumberish;
}

export interface CertificateRevokedEvent {
  id: Bytes32;
  issuer: Address;
  revokeDate: BigNumberish;
}

export interface IssuerVerifiedEvent {
  issuer: Address;
}

export interface IssuerRevokedEvent {
  issuer: Address;
}

// Event types for Verification contract
export interface CertificateVerifiedEvent {
  verificationId: Bytes32;
  certificateId: Bytes32;
  verifier: Address;
  isValid: boolean;
  timestamp: BigNumberish;
}

// Contract method interfaces
export interface CertificateIssuanceContract {
  // View functions
  certificates(certificateId: Bytes32): Promise<Certificate>;
  getCertificate(certificateId: Bytes32): Promise<[Address, Address, string, BigNumberish, BigNumberish, boolean]>;
  getCertificatesForIssuer(issuer: Address): Promise<Bytes32[]>;
  getCertificatesForRecipient(recipient: Address): Promise<Bytes32[]>;
  issuerCertificates(issuer: Address, index: BigNumberish): Promise<Bytes32>;
  recipientCertificates(recipient: Address, index: BigNumberish): Promise<Bytes32>;
  owner(): Promise<Address>;
  verifiedIssuers(issuer: Address): Promise<boolean>;
  
  // State-changing functions
  issueCertificate(recipient: Address, metadataURI: string, expiryDate: BigNumberish): Promise<any>;
  revokeCertificate(certificateId: Bytes32): Promise<any>;
  verifyIssuer(issuerAddress: Address): Promise<any>;
  revokeIssuer(issuerAddress: Address): Promise<any>;
  transferOwnership(newOwner: Address): Promise<any>;
  verifyCertificate(certificateId: Bytes32): Promise<[boolean, Address, BigNumberish, BigNumberish]>;
}

export interface VerificationContract {
  // View functions
  certificateContract(): Promise<Address>;
  verifications(verificationId: Bytes32): Promise<VerificationRecord>;
  getVerification(verificationId: Bytes32): Promise<[Bytes32, Address, BigNumberish, boolean]>;
  
  // State-changing functions  
  verifyCertificate(certificateId: Bytes32): Promise<[Bytes32, boolean]>;
}

// ABI type definitions
export interface ABIFragment {
  type: 'function' | 'event' | 'constructor';
  name?: string;
  inputs: ABIInput[];
  outputs?: ABIOutput[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

export interface ABIInput {
  name: string;
  type: string;
  internalType?: string;
  indexed?: boolean;
}

export interface ABIOutput {
  name: string;
  type: string;
  internalType?: string;
}

// Contract ABI types
export type CertificateIssuanceABI = ABIFragment[];
export type VerificationABI = ABIFragment[];

// Deployment information
export interface ContractDeployment {
  address: Address;
  transactionHash: string;
  blockNumber: number;
  networkId: number;
  networkName: string;
}

export interface NetworkDeployments {
  [networkName: string]: {
    CertificateIssuance: ContractDeployment;
    Verification: ContractDeployment;
  };
}

// Transaction types
export interface TransactionRequest {
  to?: Address;
  from?: Address;
  value?: BigNumberish;
  data?: string;
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  maxFeePerGas?: BigNumberish;
  maxPriorityFeePerGas?: BigNumberish;
  nonce?: BigNumberish;
  chainId?: number;
}

export interface TransactionResponse {
  hash: string;
  blockNumber?: number;
  blockHash?: string;
  gasUsed?: BigNumberish;
  effectiveGasPrice?: BigNumberish;
  status?: number;
}

// Contract interaction result types
export interface IssueCertificateResult {
  certificateId: Bytes32;
  transactionHash: string;
  blockNumber: number;
  gasUsed: BigNumberish;
}

export interface VerifyCertificateResult {
  verificationId: Bytes32;
  isValid: boolean;
  issuer: Address;
  issueDate: BigNumberish;
  expiryDate: BigNumberish;
  transactionHash: string;
  blockNumber: number;
}