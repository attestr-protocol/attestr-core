// components/organisms/dashboard/AttestationFilters.tsx
import React, { useState } from 'react';
import { Schema, SchemaCategory } from '../../../contexts/types';
import Card from '../../molecules/cards/Card';
import TextInput from '../../atoms/inputs/TextInput';
import Button from '../../atoms/buttons/Button';
import Badge from '../../atoms/display/Badge';
import { FilterState } from './AttestationDashboard';

interface AttestationFiltersProps {
    filters: FilterState;
    schemas: Schema[];
    onFilterChange: (filters: FilterState) => void;
    onClearFilters: () => void;
    className?: string;
}

export const AttestationFilters: React.FC<AttestationFiltersProps> = ({
    filters,
    schemas,
    onFilterChange,
    onClearFilters,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [tempFilters, setTempFilters] = useState<FilterState>(filters);

    // Category options
    const categoryOptions: { value: SchemaCategory; label: string; icon: string }[] = [
        { value: 'education', label: 'Education', icon: '🎓' },
        { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
        { value: 'identity', label: 'Identity', icon: '👤' },
        { value: 'supply-chain', label: 'Supply Chain', icon: '📦' },
        { value: 'legal', label: 'Legal', icon: '⚖️' },
        { value: 'finance', label: 'Finance', icon: '💰' },
        { value: 'government', label: 'Government', icon: '🏛️' },
        { value: 'custom', label: 'Custom', icon: '📄' }
    ];

    // Status options
    const statusOptions = [
        { value: 'active', label: 'Active', icon: '✅', color: 'green' },
        { value: 'expired', label: 'Expired', icon: '⏰', color: 'yellow' },
        { value: 'revoked', label: 'Revoked', icon: '❌', color: 'red' }
    ];

    const handleFilterUpdate = (newFilters: Partial<FilterState>) => {
        const updated = { ...tempFilters, ...newFilters };
        setTempFilters(updated);
        onFilterChange(updated);
    };

    const handleClearFilters = () => {
        setTempFilters({});
        onClearFilters();
    };

    const getActiveFilterCount = () => {
        return Object.values(filters).filter(value => {
            if (value === null || value === undefined || value === '') return false;
            if (typeof value === 'object' && Object.keys(value).length === 0) return false;
            return true;
        }).length;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <Card className={`${className}`}>
            <div className="p-4">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Filters
                        </h3>
                        {activeFilterCount > 0 && (
                            <Badge variant="blue" size="sm">
                                {activeFilterCount} active
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Clear all
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center"
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                            <svg
                                className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
                        </Button>
                    </div>
                </div>

                {/* Quick Filters (Always Visible) */}
                <div className="space-y-4">
                    {/* Search */}
                    <div>
                        <TextInput
                            id="searchQuery"
                            name="searchQuery"
                            label="Search"
                            placeholder="Search by ID, schema, attester, or subject..."
                            value={tempFilters.searchQuery || ''}
                            onChange={(value) => handleFilterUpdate({ searchQuery: value })}
                            className="w-full"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Status
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleFilterUpdate({ status: undefined })}
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    !tempFilters.status
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                All
                            </button>
                            {statusOptions.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => handleFilterUpdate({ 
                                        status: tempFilters.status === status.value ? undefined : status.value as any 
                                    })}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        tempFilters.status === status.value
                                            ? `bg-${status.color}-100 text-${status.color}-800 dark:bg-${status.color}-900 dark:text-${status.color}-200`
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    <span className="mr-1">{status.icon}</span>
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Extended Filters */}
                {isExpanded && (
                    <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {/* Category Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleFilterUpdate({ category: undefined })}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        !tempFilters.category
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    All Categories
                                </button>
                                {categoryOptions.map((category) => (
                                    <button
                                        key={category.value}
                                        onClick={() => handleFilterUpdate({ 
                                            category: tempFilters.category === category.value ? undefined : category.value 
                                        })}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            tempFilters.category === category.value
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        <span className="mr-1">{category.icon}</span>
                                        {category.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schema Filter */}
                        {schemas.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Schema
                                </label>
                                <select
                                    value={tempFilters.schemaId || ''}
                                    onChange={(e) => handleFilterUpdate({ 
                                        schemaId: e.target.value || undefined 
                                    })}
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Schemas</option>
                                    {schemas
                                        .filter(schema => schema.active)
                                        .map((schema) => (
                                        <option key={schema.id} value={schema.id}>
                                            {schema.name} ({schema.category})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Issue Date Range
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="date"
                                        placeholder="Start Date"
                                        value={tempFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
                                        onChange={(e) => {
                                            const startDate = e.target.value ? new Date(e.target.value) : undefined;
                                            handleFilterUpdate({
                                                dateRange: {
                                                    ...tempFilters.dateRange,
                                                    start: startDate
                                                }
                                            });
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="date"
                                        placeholder="End Date"
                                        value={tempFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
                                        onChange={(e) => {
                                            const endDate = e.target.value ? new Date(e.target.value) : undefined;
                                            handleFilterUpdate({
                                                dateRange: {
                                                    ...tempFilters.dateRange,
                                                    end: endDate
                                                }
                                            });
                                        }}
                                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AttestationFilters;