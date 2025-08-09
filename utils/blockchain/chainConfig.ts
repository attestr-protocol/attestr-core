// utils/blockchain/chainConfig.ts
import { ChainConfig, SupportedChain } from '../../contexts/types';

/**
 * Multi-chain configuration for Attestr Protocol
 * Supports multiple blockchain networks with different contract deployments
 */

// Chain configurations
export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
    ethereum: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://ethereum.llamarpc.com',
        blockExplorer: 'https://etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_ETHEREUM_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_ETHEREUM_ATTESTATION_VERIFIER || ''
        }
    },
    polygon: {
        chainId: 137,
        name: 'Polygon',
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
        blockExplorer: 'https://polygonscan.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_POLYGON_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_POLYGON_ATTESTATION_VERIFIER || ''
        }
    },
    arbitrum: {
        chainId: 42161,
        name: 'Arbitrum One',
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
        blockExplorer: 'https://arbiscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_ARBITRUM_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_ARBITRUM_ATTESTATION_VERIFIER || ''
        }
    },
    base: {
        chainId: 8453,
        name: 'Base',
        rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://base.llamarpc.com',
        blockExplorer: 'https://basescan.org',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_BASE_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_BASE_ATTESTATION_VERIFIER || ''
        }
    },
    optimism: {
        chainId: 10,
        name: 'OP Mainnet',
        rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://optimism.llamarpc.com',
        blockExplorer: 'https://optimistic.etherscan.io',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_OPTIMISM_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_OPTIMISM_ATTESTATION_VERIFIER || ''
        }
    }
};

// Testnet configurations
export const TESTNET_CONFIGS: Record<string, ChainConfig> = {
    'polygon-amoy': {
        chainId: 80002,
        name: 'Polygon Amoy',
        rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
        blockExplorer: 'https://amoy.polygonscan.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_AMOY_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_AMOY_ATTESTATION_VERIFIER || ''
        }
    },
    'ethereum-sepolia': {
        chainId: 11155111,
        name: 'Sepolia',
        rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
        blockExplorer: 'https://sepolia.etherscan.io',
        nativeCurrency: {
            name: 'SepoliaETH',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_SEPOLIA_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_SEPOLIA_ATTESTATION_VERIFIER || ''
        }
    },
    'arbitrum-goerli': {
        chainId: 421613,
        name: 'Arbitrum Goerli',
        rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_RPC_URL || 'https://goerli-rollup.arbitrum.io/rpc',
        blockExplorer: 'https://goerli.arbiscan.io',
        nativeCurrency: {
            name: 'Arbitrum Goerli Ether',
            symbol: 'ETH',
            decimals: 18
        },
        contracts: {
            attestationRegistry: process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ATTESTATION_REGISTRY || '',
            attestationVerifier: process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_ATTESTATION_VERIFIER || ''
        }
    }
};

// All supported chains (mainnet + testnet)
export const ALL_CHAIN_CONFIGS = {
    ...CHAIN_CONFIGS,
    ...TESTNET_CONFIGS
};

// Default chain (can be overridden by environment variable)
export const DEFAULT_CHAIN: SupportedChain = (process.env.NEXT_PUBLIC_DEFAULT_CHAIN as SupportedChain) || 'polygon';

// Get chain configuration by chain ID
export const getChainConfig = (chainId: number): ChainConfig | undefined => {
    return Object.values(ALL_CHAIN_CONFIGS).find(config => config.chainId === chainId);
};

// Get chain configuration by name
export const getChainConfigByName = (chainName: string): ChainConfig | undefined => {
    return ALL_CHAIN_CONFIGS[chainName as keyof typeof ALL_CHAIN_CONFIGS];
};

// Check if a chain is supported
export const isSupportedChain = (chainId: number): boolean => {
    return Object.values(ALL_CHAIN_CONFIGS).some(config => config.chainId === chainId);
};

// Get supported chain IDs
export const getSupportedChainIds = (): number[] => {
    return Object.values(ALL_CHAIN_CONFIGS).map(config => config.chainId);
};

// Get mainnet chains only
export const getMainnetChains = (): Record<SupportedChain, ChainConfig> => {
    return CHAIN_CONFIGS;
};

// Get testnet chains only
export const getTestnetChains = (): Record<string, ChainConfig> => {
    return TESTNET_CONFIGS;
};

// Check if chain has contracts deployed
export const hasContractsDeployed = (chainId: number): boolean => {
    const config = getChainConfig(chainId);
    return !!(config?.contracts.attestationRegistry && config?.contracts.attestationVerifier);
};

// Get chain-specific explorer URL for transaction
export const getTxExplorerUrl = (chainId: number, txHash: string): string => {
    const config = getChainConfig(chainId);
    if (!config) return '';
    return `${config.blockExplorer}/tx/${txHash}`;
};

// Get chain-specific explorer URL for address
export const getAddressExplorerUrl = (chainId: number, address: string): string => {
    const config = getChainConfig(chainId);
    if (!config) return '';
    return `${config.blockExplorer}/address/${address}`;
};

// Get chain-specific explorer URL for contract
export const getContractExplorerUrl = (chainId: number, address: string): string => {
    return getAddressExplorerUrl(chainId, address);
};

// Chain icons/logos
export const CHAIN_ICONS: Record<string, string> = {
    ethereum: '🔷',
    polygon: '🟣',
    arbitrum: '🔵',
    base: '🔵',
    optimism: '🔴',
    'polygon-amoy': '🟣',
    'ethereum-sepolia': '🔷',
    'arbitrum-goerli': '🔵'
};

// Get chain icon
export const getChainIcon = (chainId: number): string => {
    const config = getChainConfig(chainId);
    if (!config) return '⚪';
    
    const chainKey = Object.keys(ALL_CHAIN_CONFIGS).find(
        key => ALL_CHAIN_CONFIGS[key as keyof typeof ALL_CHAIN_CONFIGS].chainId === chainId
    );
    
    return CHAIN_ICONS[chainKey || ''] || '⚪';
};

// Chain colors for UI
export const CHAIN_COLORS: Record<string, string> = {
    ethereum: '#627EEA',
    polygon: '#8247E5',
    arbitrum: '#28A0F0',
    base: '#0052FF',
    optimism: '#FF0420',
    'polygon-amoy': '#8247E5',
    'ethereum-sepolia': '#627EEA',
    'arbitrum-goerli': '#28A0F0'
};

// Get chain color
export const getChainColor = (chainId: number): string => {
    const config = getChainConfig(chainId);
    if (!config) return '#6B7280';
    
    const chainKey = Object.keys(ALL_CHAIN_CONFIGS).find(
        key => ALL_CHAIN_CONFIGS[key as keyof typeof ALL_CHAIN_CONFIGS].chainId === chainId
    );
    
    return CHAIN_COLORS[chainKey || ''] || '#6B7280';
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
        isProduction,
        isDevelopment,
        defaultToTestnet: isDevelopment || process.env.NEXT_PUBLIC_USE_TESTNET === 'true',
        enabledChains: isProduction 
            ? Object.keys(CHAIN_CONFIGS) as SupportedChain[]
            : [...Object.keys(CHAIN_CONFIGS), ...Object.keys(TESTNET_CONFIGS)] as SupportedChain[]
    };
};

// Validate chain configuration
export const validateChainConfig = (config: ChainConfig): boolean => {
    return !!(
        config.chainId &&
        config.name &&
        config.rpcUrl &&
        config.blockExplorer &&
        config.nativeCurrency &&
        config.contracts.attestationRegistry &&
        config.contracts.attestationVerifier
    );
};

// Get deployment info for all chains
export const getDeploymentInfo = () => {
    const deploymentInfo: Record<string, any> = {};
    
    Object.entries(ALL_CHAIN_CONFIGS).forEach(([chainName, config]) => {
        deploymentInfo[chainName] = {
            chainId: config.chainId,
            name: config.name,
            hasContracts: hasContractsDeployed(config.chainId),
            attestationRegistry: config.contracts.attestationRegistry,
            attestationVerifier: config.contracts.attestationVerifier,
            explorerUrl: config.blockExplorer
        };
    });
    
    return deploymentInfo;
};