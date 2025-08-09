// contexts/index.ts
// Centralized exports for all context files

// Context Providers
export { AttestationProvider, useAttestationContext } from './AttestationContext';
export { CertificateProvider, useCertificateContext } from './CertificateContext';
export { ThemeProvider, useTheme } from './ThemeContext';
export { WalletProvider, useWalletContext } from './WalletContext';

// Types
export * from './types';

// Individual context exports (if needed for specific imports)
export type { AttestationContextValue } from './AttestationContext';
export type { CertificateContextValue } from './CertificateContext';
export type { ThemeContextValue } from './ThemeContext';
export type { WalletContextValue } from './WalletContext';