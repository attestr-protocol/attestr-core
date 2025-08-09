// contexts/index.ts
// Centralized exports for all context files - Updated for Universal Attestation System

// Primary Context Providers (Universal Attestation System)
export { AttestationProvider, useAttestationContext } from './AttestationContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { WalletProvider, useWalletContext as useWallet } from './WalletContext';

// Legacy Context Providers (for backward compatibility - will be deprecated)
/** @deprecated Use AttestationProvider instead */
export { CertificateProvider, useCertificate } from './CertificateContext';

// Types
export * from './types';

// Individual context exports (for specific imports)
export type { AttestationContextValue, AttestationProviderProps } from './AttestationContext';
export type { ThemeContextValue, ThemeProviderProps } from './ThemeContext';
export type { WalletContextValue, WalletProviderProps } from './WalletContext';

// Legacy types (for backward compatibility)
/** @deprecated Use AttestationContextValue instead */
export type { CertificateContextValue, CertificateProviderProps } from './CertificateContext';