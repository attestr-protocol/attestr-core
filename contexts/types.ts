// contexts/types.ts
// Shared types and interfaces for context files - Updated for Universal Attestation System

export type {
    // ThemeContext types
    ColorVariant,
    AccentColors,
    ThemeColors,
    Typography,
    Spacing,
    BorderRadius,
    BoxShadow,
    Transition,
    ZIndex,
    Theme,
    CurrentTheme,
    ThemeMode,
    ThemeContextValue,
    ThemeProviderProps
} from './ThemeContext';

export type {
    // WalletContext types
    ErrorType,
    WalletContextValue,
    WalletProviderProps
} from './WalletContext';

export type {
    // AttestationContext types (renamed from CertificateContext)
    AttestationSchema,
    Attestation,
    VerificationResult,
    IssueAttestationResult,
    StorageResult,
    RecordVerificationResult,
    UserRole,
    AttestationContextValue,
    AttestationProviderProps
} from './AttestationContext';

// ==========================================================================
// Universal Attestation System Types
// ==========================================================================

// Schema-related types
export interface Schema {
    id: string;
    name: string;
    description: string;
    jsonSchema: string;
    creator: string;
    createdAt: number;
    active: boolean;
    category: SchemaCategory;
}

export type SchemaCategory = 
    | 'education'
    | 'healthcare' 
    | 'identity'
    | 'supply-chain'
    | 'legal'
    | 'finance'
    | 'government'
    | 'custom';

// Attestation-related types
export interface Attestation {
    id: string;
    schemaId: string;
    schema?: Schema; // Populated schema object
    attester: string;
    subject: string;
    data: AttestationData;
    metadataURI?: string;
    issueDate: number;
    expiryDate?: number;
    revoked: boolean;
    version: number;
}

export type AttestationData = Record<string, any>;

// Verification types
export interface Verification {
    id: string;
    attestationId: string;
    verifier: string;
    timestamp: number;
    isValid: boolean;
    confidence: number; // 0-100
    notes?: string;
}

// Reputation types
export interface VerifierReputation {
    totalVerifications: number;
    correctVerifications: number;
    incorrectVerifications: number;
    reputationScore: number; // 0-1000
    isActive: boolean;
}

export interface AttestationReputation {
    totalVerifications: number;
    positiveVerifications: number;
    negativeVerifications: number;
    averageConfidence: number;
    hasConsensus: boolean;
}

// Form and validation types
export interface FormField {
    name: string;
    type: FieldType;
    label: string;
    description?: string;
    required: boolean;
    validation?: ValidationRule[];
    options?: FieldOption[]; // For select/radio fields
    defaultValue?: any;
}

export type FieldType = 
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'datetime'
    | 'email'
    | 'url'
    | 'select'
    | 'multiselect'
    | 'radio'
    | 'checkbox'
    | 'file'
    | 'address'; // Ethereum address

export interface FieldOption {
    label: string;
    value: any;
    disabled?: boolean;
}

export interface ValidationRule {
    type: ValidationType;
    value?: any;
    message: string;
}

export type ValidationType = 
    | 'required'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'email'
    | 'url'
    | 'custom';

// Template and dynamic forms
export interface AttestationTemplate {
    schema: Schema;
    fields: FormField[];
    metadata: TemplateMetadata;
}

export interface TemplateMetadata {
    displayName: string;
    description: string;
    icon?: string;
    color?: string;
    category: SchemaCategory;
    tags: string[];
    featured: boolean;
    usageCount: number;
}

// Filter and search types
export interface AttestationFilter {
    schemas?: string[];
    attesters?: string[];
    subjects?: string[];
    dateRange?: {
        from?: number;
        to?: number;
    };
    isValid?: boolean;
    hasExpiry?: boolean;
    categories?: SchemaCategory[];
    searchQuery?: string;
}

export interface VerificationFilter {
    verifiers?: string[];
    confidence?: {
        min?: number;
        max?: number;
    };
    dateRange?: {
        from?: number;
        to?: number;
    };
    isValid?: boolean;
}

// Pagination types
export interface PaginationParams {
    offset: number;
    limit: number;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    hasMore: boolean;
    nextOffset?: number;
}

// Multi-chain types
export interface ChainConfig {
    chainId: number;
    name: string;
    rpcUrl: string;
    blockExplorer: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    contracts: {
        attestationRegistry: string;
        attestationVerifier: string;
    };
}

export type SupportedChain = 'ethereum' | 'polygon' | 'arbitrum' | 'base' | 'optimism';

// ==========================================================================
// Common shared types
// ==========================================================================

export interface BaseContextValue {
    isLoading: boolean;
    error: string | null;
    resetState: () => void;
}

export interface BaseProviderProps {
    children: React.ReactNode;
}

// Utility types for enhanced type safety
export type ContextHookResult<T> = T extends null ? never : T;

export type AsyncOperation<T = void> = Promise<{
    success: boolean;
    data?: T;
    error?: string;
}>;

// Status types commonly used across contexts
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface StatusState {
    status: LoadingState;
    error: string | null;
    lastUpdated: number | null;
}

// Wallet address type for consistency
export type WalletAddress = string | null | undefined;

// Transaction ID type for consistency
export type TransactionId = string;

// IPFS/Arweave URI types
export type IPFSUri = `ipfs://${string}`;
export type ArweaveURI = `ar://${string}`;
export type MetadataURI = IPFSUri | ArweaveURI | string;

// Timestamp type for consistency
export type Timestamp = number;

// Generic success/error result type
export interface Result<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp?: Timestamp;
}

// Network-related types
export type NetworkStatus = 'connected' | 'disconnected' | 'connecting' | 'wrong-network';

export interface NetworkInfo {
    chainId: number;
    name: string;
    supported: boolean;
    contracts: {
        attestationRegistry: string;
        attestationVerifier: string;
    };
}

// Contract interaction types
export interface ContractInteraction {
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    gasUsed?: string;
    blockNumber?: number;
    timestamp?: number;
    error?: string;
}

// Analytics and metrics types
export interface UsageMetrics {
    totalAttestations: number;
    totalSchemas: number;
    totalVerifications: number;
    activeAttesters: number;
    activeVerifiers: number;
    averageReputationScore: number;
}

export interface AttestationStats {
    issued: number;
    verified: number;
    revoked: number;
    expired: number;
}

// Extended stats for dashboard analytics
export interface DashboardStats {
    totalAttestations: number;
    totalAttestationsChange: number;
    activeAttestations: number;
    activeAttestationsChange: number;
    totalVerifications: number;
    totalVerificationsChange: number;
    activeSchemas: number;
    activeSchemasChange: number;
    categoryBreakdown: Record<string, number>;
    chainDistribution: Record<string, number>;
    recentActivity: Array<{
        type: 'attestation_created' | 'attestation_verified' | 'attestation_revoked' | 'schema_created';
        description: string;
        timestamp: number;
        chainId?: number;
        attestationId?: string;
        schemaId?: string;
    }>;
}

// Error types
export type ErrorCategory = 
    | 'network'
    | 'contract'
    | 'validation'
    | 'permission'
    | 'storage'
    | 'unknown';

export interface DetailedError {
    category: ErrorCategory;
    message: string;
    code?: string;
    details?: Record<string, any>;
    timestamp: Timestamp;
}

// Storage provider types
export type StorageProvider = 'ipfs' | 'arweave' | 'filecoin' | 'hybrid';

export interface StorageConfig {
    provider: StorageProvider;
    endpoint?: string;
    apiKey?: string;
    redundancy: number; // Number of copies to store
}

// Export legacy types for backward compatibility (to be removed in future versions)
/** @deprecated Use Attestation instead */
export type Certificate = Attestation;

/** @deprecated Use AttestationContext instead */
export type CertificateContextValue = AttestationContextValue;

/** @deprecated Use AttestationProviderProps instead */
export type CertificateProviderProps = AttestationProviderProps;