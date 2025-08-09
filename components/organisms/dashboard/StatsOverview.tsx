// components/organisms/dashboard/StatsOverview.tsx
import React from 'react';
import { DashboardStats, ChainConfig } from '../../../contexts/types';
import Card from '../../molecules/cards/Card';
import Badge from '../../atoms/display/Badge';
import { getChainIcon, getChainColor } from '../../../utils/blockchain/chainConfig';

interface StatsOverviewProps {
    stats: DashboardStats | null;
    isLoading?: boolean;
    selectedChain?: ChainConfig | null;
    className?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
    stats,
    isLoading = false,
    selectedChain,
    className = ''
}) => {
    if (isLoading) {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const statCards = [
        {
            title: 'Total Attestations',
            value: stats.totalAttestations,
            change: stats.totalAttestationsChange,
            changeType: (stats.totalAttestationsChange >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
            icon: '📄',
            color: 'blue'
        },
        {
            title: 'Active Attestations',
            value: stats.activeAttestations,
            change: stats.activeAttestationsChange,
            changeType: (stats.activeAttestationsChange >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
            icon: '✅',
            color: 'green'
        },
        {
            title: 'Total Verifications',
            value: stats.totalVerifications,
            change: stats.totalVerificationsChange,
            changeType: (stats.totalVerificationsChange >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
            icon: '🔍',
            color: 'purple'
        },
        {
            title: 'Active Schemas',
            value: stats.activeSchemas,
            change: stats.activeSchemasChange,
            changeType: (stats.activeSchemasChange >= 0 ? 'increase' : 'decrease') as 'increase' | 'decrease',
            icon: '📋',
            color: 'cyan'
        }
    ];

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    const getChangeIcon = (changeType: 'increase' | 'decrease') => {
        return changeType === 'increase' ? '📈' : '📉';
    };

    const getChangeColor = (changeType: 'increase' | 'decrease') => {
        return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
    };

    return (
        <div className={`${className}`}>
            {/* Chain Info (if selected) */}
            {selectedChain && (
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getChainIcon(selectedChain.chainId)}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {selectedChain.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Chain ID: {selectedChain.chainId}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-gray-100 dark:bg-gray-700">
                                    <span className="text-lg">{stat.icon}</span>
                                </div>
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                        {stat.title}
                                    </dt>
                                </div>
                                <div className="flex items-baseline">
                                    <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                        {formatNumber(stat.value)}
                                    </dd>
                                    {stat.change !== 0 && (
                                        <div className={`ml-2 flex items-baseline text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                                            <span className="mr-1">{getChangeIcon(stat.changeType)}</span>
                                            {Math.abs(stat.change)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Category Breakdown */}
            {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Attestations by Category
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {Object.entries(stats.categoryBreakdown).map(([category, count]) => {
                            const categoryIcons: Record<string, string> = {
                                'education': '🎓',
                                'healthcare': '🏥',
                                'identity': '👤',
                                'supply-chain': '📦',
                                'legal': '⚖️',
                                'finance': '💰',
                                'government': '🏛️',
                                'custom': '📄'
                            };

                            const categoryColors: Record<string, string> = {
                                'education': 'blue',
                                'healthcare': 'green',
                                'identity': 'purple',
                                'supply-chain': 'yellow',
                                'legal': 'red',
                                'finance': 'cyan',
                                'government': 'indigo',
                                'custom': 'gray'
                            };

                            return (
                                <Card key={category} className="p-4 text-center">
                                    <div className="text-2xl mb-2">
                                        {categoryIcons[category] || '📄'}
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {count}
                                    </div>
                                    <Badge 
                                        variant={categoryColors[category] as any || 'gray'} 
                                        size="sm" 
                                        className="mt-1"
                                    >
                                        {category}
                                    </Badge>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Chain Distribution */}
            {stats.chainDistribution && Object.keys(stats.chainDistribution).length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Distribution Across Chains
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(stats.chainDistribution).map(([chainId, count]) => {
                            const chainIdNum = parseInt(chainId);
                            return (
                                <Card key={chainId} className="p-4 text-center">
                                    <div className="text-2xl mb-2">
                                        {getChainIcon(chainIdNum)}
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        {count}
                                    </div>
                                    <div 
                                        className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                                        style={{ color: getChainColor(chainIdNum) }}
                                    >
                                        Chain {chainId}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Recent Activity
                    </h3>
                    <Card className="p-4">
                        <div className="space-y-3">
                            {stats.recentActivity.slice(0, 5).map((activity, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">
                                            {activity.type === 'attestation_created' ? '📄' : 
                                             activity.type === 'attestation_verified' ? '✅' :
                                             activity.type === 'attestation_revoked' ? '❌' : '🔄'}
                                        </span>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {activity.description}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {new Date(activity.timestamp).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="gray" size="xs">
                                        {activity.chainId ? `Chain ${activity.chainId}` : 'Unknown'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default StatsOverview;