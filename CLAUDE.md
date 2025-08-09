# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev        # Start development server on localhost:3000
npm run build      # Build for production (runs TypeScript + Next.js build)
npm run lint       # Run ESLint checks
npm start          # Start production server
```

### Smart Contracts (contracts/ directory)
```bash
cd contracts
npm run compile    # Compile all smart contracts
npm test          # Run contract tests with coverage
npm run deploy:amoy    # Deploy to Polygon Amoy testnet
npm run deploy:local   # Deploy to local hardhat network
npm run gas-report     # Generate gas usage report
```

## Architecture Overview

Attestr Protocol is a **Universal Verification Infrastructure** that has evolved from a simple certificate platform into a comprehensive attestation system. The architecture follows these key patterns:

### Core System Architecture
- **Universal Attestation System**: Moved beyond certificates to support any type of attestation across domains (education, healthcare, identity, supply chain, etc.)
- **Schema-Driven Design**: Dynamic attestations based on JSON schemas, allowing flexible data structures
- **Multi-Chain Support**: Built for Ethereum, Polygon Amoy testnet, with extensibility for other chains
- **Decentralized Storage**: Arweave integration for permanent metadata storage, with AR.IO gateway access

### Frontend Architecture (Next.js 15.3)
The frontend uses **Atomic Design Pattern**:
- `components/atoms/` - Basic UI elements (Button, TextInput, Badge, etc.)
- `components/molecules/` - Composite components (Card, FormField, Modal, etc.) 
- `components/organisms/` - Complex business logic components (AttestationDashboard, VerificationResult, etc.)
- `components/page-templates/` - Full page layouts

### State Management Pattern
Uses React Context API with three primary contexts:
- **AttestationContext** (`contexts/AttestationContext.tsx`) - Main attestation operations
- **WalletContext** - Web3 wallet integration with ThirdWeb SDK
- **ThemeContext** - Dark/light mode theming

### Service Layer Architecture
- **AttestationService** (`utils/attestation/attestationService.ts`) - Blockchain attestation operations
- **SchemaService** (`utils/attestation/schemaService.ts`) - Schema and template management  
- Services are initialized with contract addresses and providers, currently using mock implementations for development

### Smart Contract Evolution
The contracts have been transformed from certificate-specific to universal attestation:
- **AttestationRegistry.sol** (evolved from CertificateIssuance.sol) - Issues attestations with schema-based metadata
- **AttestationVerifier.sol** (evolved from Verification.sol) - Handles on-chain verification records
- Contracts support EIP-712 signatures, batch operations, and role-based access control

## Critical Development Notes

### Component Interface Patterns
Components follow specific interface patterns that must be maintained:

**TextInput Interface:**
```typescript
interface TextInputProps {
  onChange: (value: string) => void; // NOT (event) => void
  id: string; // Required
  name: string; // Required
  // ... other props
}
```

**Context Usage:**
- Always use `useAttestationContext()` hook, not `useAttestation()`
- Import from `'../../../contexts'` using the correct hook name

### Security Configuration
The application includes comprehensive security headers in `next.config.mjs`:
- Content Security Policy (CSP) configured to prevent XSS
- Navigation must use Next.js `router.push()` instead of `window.location.href` to comply with CSP
- External links should use DOM element creation instead of `window.open()`

### Build Requirements
- TypeScript strict mode enabled - all type errors must be resolved
- ESLint runs during builds - major violations will fail the build  
- The build system validates both frontend and contract compilation

### Development Workflow
1. The project maintains **legacy Certificate contexts** for backward compatibility but **new development should use Attestation contexts**
2. When adding new attestation types, create schemas in the SchemaService rather than hardcoding types
3. All blockchain operations go through the service layer, not direct contract calls in components
4. Components should handle loading states and errors from the context layer

### Environment Configuration
Required environment variables in `.env.local`:
```env
NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=your_attestation_contract_address
NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=your_verification_contract_address  
NEXT_PUBLIC_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_CHAIN_ID=80002
NEXT_PUBLIC_WEB3_STORAGE_TOKEN=your_web3_storage_token
```

### Testing and Quality
- Smart contracts have comprehensive test coverage in `contracts/test/`
- Frontend components should be tested with attention to the new context patterns
- Always run `npm run build` to verify TypeScript compilation before committing

The codebase represents a mature transition from a certificate-specific system to a universal attestation infrastructure, with careful attention to backward compatibility while enabling future extensibility.