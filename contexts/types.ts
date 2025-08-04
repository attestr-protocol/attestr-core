// contexts/types.ts
// Shared types and interfaces for context files

// Re-export types from individual contexts for easier importing
// export type {
//     // ArweaveContext types
//     PendingTransaction,
//     CertificateData,
//     CertificateMetadata,
//     StoreCertificateResult,
//     RetrieveCertificateResult,
//     RequestTokensResult,
//     TokenRequestParams,
//     WalletType,
//     ArweaveContextValue,
//     ArweaveProviderProps
// } from './ArweaveContext';

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
    // CertificateContext types
    Certificate,
    VerificationResult,
    IssueCertificateResult,
    StorageResult,
    RecordVerificationResult,
    // ARIOStorageHook,
    UserRole,
    CertificateContextValue,
    CertificateProviderProps
} from './CertificateContext';

// Common shared types that might be used across contexts
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

// Arweave URI type for consistency  
export type ArweaveURI = `ar://${string}`;

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
}