// components/molecules/forms/SchemaSelector.tsx
import React, { useState, useEffect } from 'react';
import { Schema, SchemaCategory, AttestationTemplate } from '../../../contexts/types';
import { schemaService } from '../../../utils/attestation/schemaService';
import Card from '../cards/Card';
import Badge from '../../atoms/display/Badge';
import TextInput from '../../atoms/inputs/TextInput';

interface SchemaSelectorProps {
    onSchemaSelect: (schema: Schema, template?: AttestationTemplate) => void;
    selectedSchemaId?: string;
    category?: SchemaCategory;
    showSearch?: boolean;
    showFeatured?: boolean;
    className?: string;
}

export const SchemaSelector: React.FC<SchemaSelectorProps> = ({
    onSchemaSelect,
    selectedSchemaId,
    category,
    showSearch = true,
    showFeatured = true,
    className = ''
}) => {
    // Use schemaService directly instead of context
    
    const [searchQuery, setSearchQuery] = useState('');
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [filteredSchemas, setFilteredSchemas] = useState<Schema[]>([]);
    const [featuredTemplates, setFeaturedTemplates] = useState<AttestationTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    // Load schemas and featured templates on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const allSchemas = await schemaService.getAllSchemas();
                setSchemas(allSchemas);
                if (showFeatured) {
                    const featured = await schemaService.getFeaturedTemplates();
                    setFeaturedTemplates(featured);
                }
            } catch (error) {
                console.error('Error loading schema data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [showFeatured]);

    // Filter schemas based on search query and category
    useEffect(() => {
        let filtered = schemas;

        // Filter by category if specified
        if (category) {
            filtered = filtered.filter(schema => schema.category === category);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(schema =>
                schema.name.toLowerCase().includes(query) ||
                schema.description.toLowerCase().includes(query) ||
                schema.category.toLowerCase().includes(query)
            );
        }

        // Only show active schemas
        filtered = filtered.filter(schema => schema.active);

        setFilteredSchemas(filtered);
    }, [schemas, searchQuery, category]);

    // Handle schema selection
    const handleSchemaSelect = async (schema: Schema) => {
        try {
            // Try to get the template for this schema
            const template = featuredTemplates.find(t => t.schema.id === schema.id);
            onSchemaSelect(schema, template);
        } catch (error) {
            console.error('Error getting template for schema:', error);
            onSchemaSelect(schema);
        }
    };

    // Get category color
    const getCategoryColor = (cat: SchemaCategory): string => {
        const colors: Record<SchemaCategory, string> = {
            'education': 'blue',
            'healthcare': 'green',
            'identity': 'purple',
            'supply-chain': 'yellow',
            'legal': 'red',
            'finance': 'cyan',
            'government': 'indigo',
            'custom': 'gray'
        };
        return colors[cat] || 'gray';
    };

    // Get category icon
    const getCategoryIcon = (cat: SchemaCategory): string => {
        const icons: Record<SchemaCategory, string> = {
            'education': '🎓',
            'healthcare': '🏥',
            'identity': '👤',
            'supply-chain': '📦',
            'legal': '⚖️',
            'finance': '💰',
            'government': '🏛️',
            'custom': '📄'
        };
        return icons[cat] || '📄';
    };

    if (loading) {
        return (
            <div className={`${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            {/* Search Bar */}
            {showSearch && (
                <div className="mb-6">
                    <TextInput
                        id="schema-search"
                        name="schemaSearch"
                        label="Search Templates"
                        placeholder="Search by name, description, or category..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        className="w-full"
                    />
                </div>
            )}

            {/* Featured Templates Section */}
            {showFeatured && featuredTemplates.length > 0 && !searchQuery && !category && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        ⭐ Featured Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredTemplates.map((template) => (
                            <Card
                                key={template.schema.id}
                                className={`
                                    cursor-pointer transition-all duration-200 hover:shadow-lg
                                    ${selectedSchemaId === template.schema.id 
                                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'hover:shadow-md'
                                    }
                                `}
                                onClick={() => handleSchemaSelect(template.schema)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-2">
                                                {template.metadata.icon || getCategoryIcon(template.schema.category)}
                                            </span>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {template.metadata.displayName}
                                                </h4>
                                                <Badge
                                                    variant={getCategoryColor(template.schema.category) as any}
                                                    size="sm"
                                                    className="mt-1"
                                                >
                                                    {template.schema.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        {template.metadata.featured && (
                                            <span className="text-yellow-500">⭐</span>
                                        )}
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {template.metadata.description}
                                    </p>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{template.fields.length} fields</span>
                                        <span>{template.metadata.usageCount} uses</span>
                                    </div>
                                    
                                    {/* Tags */}
                                    {template.metadata.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {template.metadata.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* All Schemas Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Templates` : 'All Templates'}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                        ({filteredSchemas.length})
                    </span>
                </h3>

                {filteredSchemas.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-600 mb-2">
                            {searchQuery ? '🔍' : '📄'}
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {searchQuery ? 'No templates found' : 'No templates available'}
                        </h4>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery 
                                ? 'Try adjusting your search terms'
                                : 'Create a new schema to get started'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSchemas.map((schema) => {
                            const isFeatured = featuredTemplates.some(t => t.schema.id === schema.id);
                            
                            return (
                                <Card
                                    key={schema.id}
                                    className={`
                                        cursor-pointer transition-all duration-200 hover:shadow-lg
                                        ${selectedSchemaId === schema.id 
                                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'hover:shadow-md'
                                        }
                                    `}
                                    onClick={() => handleSchemaSelect(schema)}
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-2">
                                                    {getCategoryIcon(schema.category)}
                                                </span>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {schema.name}
                                                    </h4>
                                                    <Badge
                                                        variant={getCategoryColor(schema.category) as any}
                                                        size="sm"
                                                        className="mt-1"
                                                    >
                                                        {schema.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {isFeatured && (
                                                <span className="text-yellow-500">⭐</span>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            {schema.description}
                                        </p>
                                        
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <span>
                                                Created {new Date(schema.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="truncate max-w-20" title={schema.creator}>
                                                {schema.creator.slice(0, 6)}...{schema.creator.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchemaSelector;