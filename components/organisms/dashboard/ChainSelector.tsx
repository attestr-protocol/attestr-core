// components/organisms/dashboard/ChainSelector.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChainConfig } from '../../../contexts/types';
import { 
    CHAIN_CONFIGS, 
    TESTNET_CONFIGS, 
    getChainIcon, 
    getChainColor,
    getEnvironmentConfig 
} from '../../../utils/blockchain/chainConfig';
import Card from '../../molecules/cards/Card';
import Badge from '../../atoms/display/Badge';

interface ChainSelectorProps {
    selectedChain?: ChainConfig | null;
    onChainSelect: (chain: ChainConfig | null) => void;
    showTestnets?: boolean;
    className?: string;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
    selectedChain,
    onChainSelect,
    showTestnets,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const envConfig = getEnvironmentConfig();

    // Determine if testnets should be shown
    const shouldShowTestnets = showTestnets !== undefined 
        ? showTestnets 
        : envConfig.defaultToTestnet;

    // Get available chains
    const availableChains = React.useMemo(() => {
        const chains: Array<{ chain: ChainConfig; key: string; isTestnet: boolean }> = [];
        
        // Add mainnet chains
        Object.entries(CHAIN_CONFIGS).forEach(([key, chain]) => {
            chains.push({ chain, key, isTestnet: false });
        });

        // Add testnet chains if enabled
        if (shouldShowTestnets) {
            Object.entries(TESTNET_CONFIGS).forEach(([key, chain]) => {
                chains.push({ chain, key, isTestnet: true });
            });
        }

        return chains;
    }, [shouldShowTestnets]);

    // Filter chains based on search query
    const filteredChains = React.useMemo(() => {
        if (!searchQuery.trim()) return availableChains;
        
        const query = searchQuery.toLowerCase();
        return availableChains.filter(({ chain }) =>
            chain.name.toLowerCase().includes(query) ||
            chain.chainId.toString().includes(query)
        );
    }, [availableChains, searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChainSelect = (chain: ChainConfig) => {
        onChainSelect(chain);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleShowAll = () => {
        onChainSelect(null);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Chain Selector Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                <div className="flex items-center">
                    {selectedChain ? (
                        <>
                            <span className="mr-2 text-lg">
                                {getChainIcon(selectedChain.chainId)}
                            </span>
                            <span className="truncate">{selectedChain.name}</span>
                            <Badge 
                                variant="gray" 
                                size="xs" 
                                className="ml-2"
                            >
                                {selectedChain.chainId}
                            </Badge>
                        </>
                    ) : (
                        <>
                            <span className="mr-2 text-lg">🌐</span>
                            <span>All Chains</span>
                        </>
                    )}
                </div>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <Card className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-96 overflow-hidden">
                    <div className="p-3">
                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder="Search chains..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {/* All Chains Option */}
                        <button
                            onClick={handleShowAll}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center ${
                                !selectedChain ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
                            }`}
                        >
                            <span className="mr-3 text-lg">🌐</span>
                            <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    All Chains
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Show attestations from all supported chains
                                </div>
                            </div>
                        </button>

                        {/* Chain Options */}
                        {filteredChains.length > 0 ? (
                            <>
                                {/* Mainnet Chains */}
                                {filteredChains.some(c => !c.isTestnet) && (
                                    <div>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                                            Mainnets
                                        </div>
                                        {filteredChains
                                            .filter(c => !c.isTestnet)
                                            .map(({ chain, key }) => (
                                            <button
                                                key={key}
                                                onClick={() => handleChainSelect(chain)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center ${
                                                    selectedChain?.chainId === chain.chainId 
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                                        : ''
                                                }`}
                                            >
                                                <span className="mr-3 text-lg">
                                                    {getChainIcon(chain.chainId)}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {chain.name}
                                                        </div>
                                                        <Badge 
                                                            variant="gray" 
                                                            size="xs"
                                                        >
                                                            {chain.chainId}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {chain.nativeCurrency.symbol}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Testnet Chains */}
                                {shouldShowTestnets && filteredChains.some(c => c.isTestnet) && (
                                    <div>
                                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                                            Testnets
                                        </div>
                                        {filteredChains
                                            .filter(c => c.isTestnet)
                                            .map(({ chain, key }) => (
                                            <button
                                                key={key}
                                                onClick={() => handleChainSelect(chain)}
                                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center ${
                                                    selectedChain?.chainId === chain.chainId 
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                                        : ''
                                                }`}
                                            >
                                                <span className="mr-3 text-lg">
                                                    {getChainIcon(chain.chainId)}
                                                </span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {chain.name}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="yellow" size="xs">
                                                                Testnet
                                                            </Badge>
                                                            <Badge variant="gray" size="xs">
                                                                {chain.chainId}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {chain.nativeCurrency.symbol}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                <div className="text-2xl mb-2">🔍</div>
                                <div className="font-medium">No chains found</div>
                                <div className="text-sm">Try adjusting your search</div>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ChainSelector;