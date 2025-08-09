// utils/attestation/index.ts
// Centralized exports for attestation-related services

// Core services
export { attestationService } from './attestationService';
export { schemaService } from './schemaService';
export { verificationService } from './verificationService';

// Re-export types from services for convenience
export type {
    IssueAttestationParams,
    IssueAttestationResult,
    BatchIssueParams,
    BatchIssueResult
} from './attestationService';

export type {
    Schema,
    SchemaCategory,
    AttestationTemplate
} from './schemaService';

export type {
    Verification,
    VerificationResult,
    VerificationFilter
} from './verificationService';

// Service initialization helper
export const initializeAttestationServices = (
    attestationRegistryAddress: string,
    attestationVerifierAddress: string,
    provider: any
) => {
    attestationService.initialize(attestationRegistryAddress, provider);
    schemaService.initialize(attestationRegistryAddress, provider);
    verificationService.initialize(attestationVerifierAddress, provider);
    
    console.log('[AttestationServices] Initialized with contracts:', {
        attestationRegistry: attestationRegistryAddress,
        attestationVerifier: attestationVerifierAddress
    });
};