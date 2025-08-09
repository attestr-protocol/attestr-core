// components/organisms/dashboard/AttestationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Attestation, Schema, Verification, DashboardStats, ChainConfig } from '../../../contexts/types';
import { useAttestationContext } from '../../../contexts';
import Card from '../../molecules/cards/Card';
import Badge from '../../atoms/display/Badge';
import { AttestationList } from './AttestationList';
import { StatsOverview } from './StatsOverview';
import { ChainSelector } from './ChainSelector';
import { AttestationFilters } from './AttestationFilters';

interface AttestationDashboardProps {
    userAddress?: string;
    showFilters?: boolean;
    showChainSelector?: boolean;
    className?: string;
}

export interface FilterState {
    category?: string;
    status?: 'active' | 'expired' | 'revoked';
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    searchQuery?: string;
    schemaId?: string;
}

export const AttestationDashboard: React.FC<AttestationDashboardProps> = ({
    userAddress,
    showFilters = true,
    showChainSelector = true,
    className = ''
}) => {
    const { 
        attestations, 
        isLoading, 
        // getAttestationStats,
        // getAttestationsForUser,
        // getAllAttestations
    } = useAttestationContext();
    
    // TODO: Add schema service integration
    const schemas: any[] = [];

    const [activeTab, setActiveTab] = useState<'issued' | 'received' | 'all'>('all');
    const [selectedChain, setSelectedChain] = useState<ChainConfig | null>(null);
    const [filters, setFilters] = useState<FilterState>({});
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [filteredAttestations, setFilteredAttestations] = useState<Attestation[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // Load dashboard data
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Load attestations based on active tab and user
                let attestationList: Attestation[] = [];
                
                // TODO: Implement actual data loading
                // if (userAddress && activeTab !== 'all') {
                //     attestationList = await getAttestationsForUser(userAddress);
                // } else {
                //     attestationList = await getAllAttestations();
                // }
                attestationList = []; // Temporary mock data

                // Filter by tab
                if (userAddress && activeTab === 'issued') {
                    attestationList = attestationList.filter(a => a.attester === userAddress);
                } else if (userAddress && activeTab === 'received') {
                    attestationList = attestationList.filter(a => a.subject === userAddress);
                }

                setFilteredAttestations(attestationList);

                // Load stats
                setLoadingStats(true);
                // TODO: Implement actual stats loading
                // const dashboardStats = await getAttestationStats();
                const dashboardStats: DashboardStats = {
                    totalAttestations: 0,
                    totalAttestationsChange: 0,
                    activeAttestations: 0,
                    activeAttestationsChange: 0,
                    totalVerifications: 0,
                    totalVerificationsChange: 0,
                    activeSchemas: 0,
                    activeSchemasChange: 0,
                    categoryBreakdown: {},
                    chainDistribution: {},
                    recentActivity: []
                };
                setStats(dashboardStats);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoadingStats(false);
            }
        };

        loadDashboardData();
    }, [activeTab, userAddress, selectedChain]);

    // Apply filters to attestations
    useEffect(() => {
        let filtered = [...attestations];

        // Filter by category (temporarily commented out due to type issues)
        // if (filters.category) {
        //     filtered = filtered.filter(a => a.schema?.category === filters.category);
        // }

        // Filter by status (temporarily disabled due to type issues)
        // if (filters.status) {
        //     const now = Date.now();
        //     filtered = filtered.filter(a => {
        //         switch (filters.status) {
        //             case 'active':
        //                 return !a.revoked && (!a.expiryDate || a.expiryDate > now);
        //             case 'expired':
        //                 return !a.revoked && a.expiryDate && a.expiryDate <= now;
        //             case 'revoked':
        //                 return a.revoked;
        //             default:
        //                 return true;
        //         }
        //     });
        // }

        // Filter by date range (temporarily disabled due to type issues)
        // if (filters.dateRange?.start || filters.dateRange?.end) {
        //     filtered = filtered.filter(a => {
        //         const issueDate = new Date(a.issueDate);
        //         if (filters.dateRange?.start && issueDate < filters.dateRange.start) {
        //             return false;
        //         }
        //         if (filters.dateRange?.end && issueDate > filters.dateRange.end) {
        //             return false;
        //         }
        //         return true;
        //     });
        // }

        // Filter by search query (temporarily disabled due to type issues)
        // if (filters.searchQuery) {
        //     const query = filters.searchQuery.toLowerCase();
        //     filtered = filtered.filter(a =>
        //         a.schema?.name.toLowerCase().includes(query) ||
        //         a.schema?.description.toLowerCase().includes(query) ||
        //         a.attester.toLowerCase().includes(query) ||
        //         a.subject.toLowerCase().includes(query) ||
        //         a.id.toLowerCase().includes(query)
        //     );
        // }

        // Filter by schema (temporarily disabled due to type issues)
        // if (filters.schemaId) {
        //     filtered = filtered.filter(a => a.schemaId === filters.schemaId);
        // }

        setFilteredAttestations(filtered);
    }, [attestations, filters]);

    const handleTabChange = (tab: 'issued' | 'received' | 'all') => {
        setActiveTab(tab);
    };

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const clearFilters = () => {
        setFilters({});
    };

    if (isLoading) {
        return (
            <div className={`${className}`}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Attestation Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor and manage your attestations across all chains
                    </p>
                </div>
                {showChainSelector && (
                    <ChainSelector
                        selectedChain={selectedChain}
                        onChainSelect={setSelectedChain}
                        className="w-64"
                    />
                )}
            </div>

            {/* Stats Overview */}
            <StatsOverview
                stats={stats}
                isLoading={loadingStats}
                selectedChain={selectedChain}
            />

            {/* Navigation Tabs */}
            {userAddress && (
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { key: 'all', label: 'All Attestations' },
                            { key: 'issued', label: 'Issued by You' },
                            { key: 'received', label: 'Received by You' }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key as any)}
                                className={`
                                    py-2 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${activeTab === tab.key
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }
                                `}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <AttestationFilters
                    filters={filters}
                    schemas={schemas}
                    onFilterChange={handleFilterChange}
                    onClearFilters={clearFilters}
                />
            )}

            {/* Summary */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Attestations
                    </h2>
                    <Badge variant="gray" size="sm">
                        {filteredAttestations.length} results
                    </Badge>
                </div>
                
                {Object.keys(filters).length > 0 && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Attestation List */}
            <AttestationList
                attestations={filteredAttestations}
                isLoading={isLoading}
                showPagination={true}
                pageSize={10}
            />
        </div>
    );
};

export default AttestationDashboard;