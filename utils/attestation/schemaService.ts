// utils/attestation/schemaService.ts
import { 
    Schema, 
    SchemaCategory, 
    AttestationTemplate,
    TemplateMetadata,
    FormField,
    Result 
} from '../../contexts/types';

/**
 * Schema Service
 * Handles all schema and template-related operations
 */
class SchemaService {
    private contractAddress: string | null = null;
    private provider: any = null;

    /**
     * Initialize the service with contract details
     */
    initialize(contractAddress: string, provider: any) {
        this.contractAddress = contractAddress;
        this.provider = provider;
    }

    /**
     * Create a new attestation schema
     */
    async createSchema(params: {
        name: string;
        description: string;
        jsonSchema: string;
        category: SchemaCategory;
    }): Promise<Result<string>> {
        try {
            console.log('[SchemaService] Creating schema:', params);
            
            // Validate inputs
            if (!params.name?.trim()) {
                throw new Error('Schema name is required');
            }
            
            if (!params.jsonSchema?.trim()) {
                throw new Error('JSON schema is required');
            }

            // TODO: Implement actual contract interaction
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockSchemaId = `schema_${params.category}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

            return {
                success: true,
                data: mockSchemaId,
                timestamp: Date.now()
            };

        } catch (error: any) {
            console.error('[SchemaService] Error creating schema:', error);
            return {
                success: false,
                error: error.message || 'Failed to create schema'
            };
        }
    }

    /**
     * Update an existing schema
     */
    async updateSchema(schemaId: string, description: string, jsonSchema: string): Promise<Result> {
        try {
            console.log('[SchemaService] Updating schema:', { schemaId, description });
            
            if (!schemaId) {
                throw new Error('Schema ID is required');
            }
            
            if (!jsonSchema?.trim()) {
                throw new Error('JSON schema is required');
            }

            // TODO: Implement actual contract interaction
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

            return {
                success: true,
                data: {
                    txHash: mockTxHash,
                    timestamp: Date.now()
                }
            };

        } catch (error: any) {
            console.error('[SchemaService] Error updating schema:', error);
            return {
                success: false,
                error: error.message || 'Failed to update schema'
            };
        }
    }

    /**
     * Deactivate a schema
     */
    async deactivateSchema(schemaId: string): Promise<Result> {
        try {
            console.log('[SchemaService] Deactivating schema:', schemaId);
            
            if (!schemaId) {
                throw new Error('Schema ID is required');
            }

            // TODO: Implement actual contract interaction
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

            return {
                success: true,
                data: {
                    txHash: mockTxHash,
                    timestamp: Date.now()
                }
            };

        } catch (error: any) {
            console.error('[SchemaService] Error deactivating schema:', error);
            return {
                success: false,
                error: error.message || 'Failed to deactivate schema'
            };
        }
    }

    /**
     * Get a schema by ID
     */
    async getSchema(schemaId: string): Promise<Schema | null> {
        try {
            console.log('[SchemaService] Getting schema:', schemaId);
            
            if (!schemaId) {
                return null;
            }

            // TODO: Implement actual contract interaction
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mock implementation - return sample schemas for demo
            const mockSchemas: Record<string, Schema> = {
                'academic-degree': {
                    id: 'academic-degree',
                    name: 'Academic Degree',
                    description: 'Attestation for academic degrees and diplomas',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            institution: { type: 'string', title: 'Institution' },
                            degree: { type: 'string', title: 'Degree' },
                            major: { type: 'string', title: 'Major/Field of Study' },
                            graduationDate: { type: 'string', format: 'date', title: 'Graduation Date' },
                            gpa: { type: 'number', minimum: 0, maximum: 4, title: 'GPA' }
                        },
                        required: ['institution', 'degree', 'major', 'graduationDate']
                    }),
                    creator: '0x1234567890123456789012345678901234567890',
                    createdAt: Date.now() - 86400000,
                    active: true,
                    category: 'education'
                },
                'medical-license': {
                    id: 'medical-license',
                    name: 'Medical License',
                    description: 'Attestation for medical practice licenses',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            licenseNumber: { type: 'string', title: 'License Number' },
                            specialty: { type: 'string', title: 'Medical Specialty' },
                            issuingAuthority: { type: 'string', title: 'Issuing Authority' },
                            issueDate: { type: 'string', format: 'date', title: 'Issue Date' },
                            expiryDate: { type: 'string', format: 'date', title: 'Expiry Date' }
                        },
                        required: ['licenseNumber', 'specialty', 'issuingAuthority', 'issueDate']
                    }),
                    creator: '0x2345678901234567890123456789012345678901',
                    createdAt: Date.now() - 172800000,
                    active: true,
                    category: 'healthcare'
                }
            };

            return mockSchemas[schemaId] || null;

        } catch (error: any) {
            console.error('[SchemaService] Error getting schema:', error);
            return null;
        }
    }

    /**
     * Get all schemas
     */
    async getAllSchemas(): Promise<Schema[]> {
        try {
            console.log('[SchemaService] Getting all schemas');

            // TODO: Implement actual contract interaction
            await new Promise(resolve => setTimeout(resolve, 800));

            // Mock implementation - return sample schemas
            const mockSchemas: Schema[] = [
                {
                    id: 'academic-degree',
                    name: 'Academic Degree',
                    description: 'Attestation for academic degrees and diplomas',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            institution: { type: 'string', title: 'Institution' },
                            degree: { type: 'string', title: 'Degree' },
                            major: { type: 'string', title: 'Major/Field of Study' },
                            graduationDate: { type: 'string', format: 'date', title: 'Graduation Date' },
                            gpa: { type: 'number', minimum: 0, maximum: 4, title: 'GPA' }
                        },
                        required: ['institution', 'degree', 'major', 'graduationDate']
                    }),
                    creator: '0x1234567890123456789012345678901234567890',
                    createdAt: Date.now() - 86400000,
                    active: true,
                    category: 'education'
                },
                {
                    id: 'medical-license',
                    name: 'Medical License',
                    description: 'Attestation for medical practice licenses',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            licenseNumber: { type: 'string', title: 'License Number' },
                            specialty: { type: 'string', title: 'Medical Specialty' },
                            issuingAuthority: { type: 'string', title: 'Issuing Authority' },
                            issueDate: { type: 'string', format: 'date', title: 'Issue Date' },
                            expiryDate: { type: 'string', format: 'date', title: 'Expiry Date' }
                        },
                        required: ['licenseNumber', 'specialty', 'issuingAuthority', 'issueDate']
                    }),
                    creator: '0x2345678901234567890123456789012345678901',
                    createdAt: Date.now() - 172800000,
                    active: true,
                    category: 'healthcare'
                },
                {
                    id: 'identity-verification',
                    name: 'Identity Verification',
                    description: 'KYC identity verification attestation',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            documentType: { 
                                type: 'string', 
                                enum: ['passport', 'drivers-license', 'national-id'],
                                title: 'Document Type' 
                            },
                            documentNumber: { type: 'string', title: 'Document Number' },
                            fullName: { type: 'string', title: 'Full Name' },
                            dateOfBirth: { type: 'string', format: 'date', title: 'Date of Birth' },
                            nationality: { type: 'string', title: 'Nationality' },
                            verificationLevel: {
                                type: 'string',
                                enum: ['basic', 'enhanced', 'premium'],
                                title: 'Verification Level'
                            }
                        },
                        required: ['documentType', 'documentNumber', 'fullName', 'dateOfBirth']
                    }),
                    creator: '0x3456789012345678901234567890123456789012',
                    createdAt: Date.now() - 259200000,
                    active: true,
                    category: 'identity'
                },
                {
                    id: 'supply-chain-origin',
                    name: 'Supply Chain Origin',
                    description: 'Product origin and authenticity attestation',
                    jsonSchema: JSON.stringify({
                        type: 'object',
                        properties: {
                            productName: { type: 'string', title: 'Product Name' },
                            manufacturer: { type: 'string', title: 'Manufacturer' },
                            batchNumber: { type: 'string', title: 'Batch Number' },
                            manufacturingDate: { type: 'string', format: 'date', title: 'Manufacturing Date' },
                            originCountry: { type: 'string', title: 'Country of Origin' },
                            certifications: {
                                type: 'array',
                                items: { type: 'string' },
                                title: 'Certifications'
                            },
                            qualityScore: { type: 'number', minimum: 0, maximum: 100, title: 'Quality Score' }
                        },
                        required: ['productName', 'manufacturer', 'originCountry']
                    }),
                    creator: '0x4567890123456789012345678901234567890123',
                    createdAt: Date.now() - 345600000,
                    active: true,
                    category: 'supply-chain'
                }
            ];

            return mockSchemas;

        } catch (error: any) {
            console.error('[SchemaService] Error getting all schemas:', error);
            return [];
        }
    }

    /**
     * Get schemas by category
     */
    async getSchemasByCategory(category: SchemaCategory): Promise<Schema[]> {
        try {
            console.log('[SchemaService] Getting schemas by category:', category);
            
            const allSchemas = await this.getAllSchemas();
            return allSchemas.filter(schema => schema.category === category);

        } catch (error: any) {
            console.error('[SchemaService] Error getting schemas by category:', error);
            return [];
        }
    }

    /**
     * Get a template for a schema (includes form fields and metadata)
     */
    async getTemplate(schemaId: string): Promise<AttestationTemplate | null> {
        try {
            console.log('[SchemaService] Getting template for schema:', schemaId);
            
            const schema = await this.getSchema(schemaId);
            if (!schema) {
                return null;
            }

            // Parse JSON schema to create form fields
            const fields = this.parseSchemaToFields(schema.jsonSchema);
            
            const template: AttestationTemplate = {
                schema,
                fields,
                metadata: {
                    displayName: schema.name,
                    description: schema.description,
                    category: schema.category,
                    tags: [schema.category, 'attestation'],
                    featured: ['academic-degree', 'medical-license', 'identity-verification'].includes(schemaId),
                    usageCount: Math.floor(Math.random() * 1000), // Mock usage count
                    color: this.getCategoryColor(schema.category),
                    icon: this.getCategoryIcon(schema.category)
                }
            };

            return template;

        } catch (error: any) {
            console.error('[SchemaService] Error getting template:', error);
            return null;
        }
    }

    /**
     * Get featured templates
     */
    async getFeaturedTemplates(): Promise<AttestationTemplate[]> {
        try {
            console.log('[SchemaService] Getting featured templates');
            
            const featuredSchemaIds = ['academic-degree', 'medical-license', 'identity-verification'];
            const templates: AttestationTemplate[] = [];
            
            for (const schemaId of featuredSchemaIds) {
                const template = await this.getTemplate(schemaId);
                if (template) {
                    templates.push(template);
                }
            }
            
            return templates;

        } catch (error: any) {
            console.error('[SchemaService] Error getting featured templates:', error);
            return [];
        }
    }

    /**
     * Search templates by query
     */
    async searchTemplates(query: string): Promise<AttestationTemplate[]> {
        try {
            console.log('[SchemaService] Searching templates:', query);
            
            const allSchemas = await this.getAllSchemas();
            const filteredSchemas = allSchemas.filter(schema => 
                schema.name.toLowerCase().includes(query.toLowerCase()) ||
                schema.description.toLowerCase().includes(query.toLowerCase()) ||
                schema.category.toLowerCase().includes(query.toLowerCase())
            );
            
            const templates: AttestationTemplate[] = [];
            for (const schema of filteredSchemas) {
                const template = await this.getTemplate(schema.id);
                if (template) {
                    templates.push(template);
                }
            }
            
            return templates;

        } catch (error: any) {
            console.error('[SchemaService] Error searching templates:', error);
            return [];
        }
    }

    /**
     * Parse JSON schema to form fields
     */
    private parseSchemaToFields(jsonSchemaStr: string): FormField[] {
        try {
            const jsonSchema = JSON.parse(jsonSchemaStr);
            const fields: FormField[] = [];

            if (jsonSchema.type !== 'object' || !jsonSchema.properties) {
                return fields;
            }

            Object.entries(jsonSchema.properties).forEach(([fieldName, fieldDef]: [string, any]) => {
                const field: FormField = {
                    name: fieldName,
                    type: this.mapJsonTypeToFieldType(fieldDef.type, fieldDef.format, fieldDef.enum),
                    label: fieldDef.title || fieldName,
                    description: fieldDef.description,
                    required: jsonSchema.required?.includes(fieldName) || false,
                    validation: [],
                    defaultValue: fieldDef.default
                };

                // Add validation rules
                if (field.required) {
                    field.validation!.push({
                        type: 'required',
                        message: `${field.label} is required`
                    });
                }

                if (fieldDef.minimum !== undefined) {
                    field.validation!.push({
                        type: 'min',
                        value: fieldDef.minimum,
                        message: `${field.label} must be at least ${fieldDef.minimum}`
                    });
                }

                if (fieldDef.maximum !== undefined) {
                    field.validation!.push({
                        type: 'max',
                        value: fieldDef.maximum,
                        message: `${field.label} must be at most ${fieldDef.maximum}`
                    });
                }

                if (fieldDef.minLength !== undefined) {
                    field.validation!.push({
                        type: 'minLength',
                        value: fieldDef.minLength,
                        message: `${field.label} must be at least ${fieldDef.minLength} characters`
                    });
                }

                if (fieldDef.maxLength !== undefined) {
                    field.validation!.push({
                        type: 'maxLength',
                        value: fieldDef.maxLength,
                        message: `${field.label} must be at most ${fieldDef.maxLength} characters`
                    });
                }

                // Add options for enum fields
                if (fieldDef.enum) {
                    field.options = fieldDef.enum.map((value: any) => ({
                        label: String(value).charAt(0).toUpperCase() + String(value).slice(1),
                        value
                    }));
                }

                fields.push(field);
            });

            return fields;

        } catch (error) {
            console.error('[SchemaService] Error parsing JSON schema:', error);
            return [];
        }
    }

    /**
     * Map JSON schema types to form field types
     */
    private mapJsonTypeToFieldType(type: string, format?: string, enumValues?: any[]): any {
        if (enumValues && enumValues.length > 0) {
            return 'select';
        }

        switch (type) {
            case 'string':
                switch (format) {
                    case 'date':
                        return 'date';
                    case 'date-time':
                        return 'datetime';
                    case 'email':
                        return 'email';
                    case 'uri':
                        return 'url';
                    default:
                        return 'text';
                }
            case 'number':
            case 'integer':
                return 'number';
            case 'boolean':
                return 'checkbox';
            case 'array':
                return 'multiselect';
            default:
                return 'text';
        }
    }

    /**
     * Get color for schema category
     */
    private getCategoryColor(category: SchemaCategory): string {
        const colors: Record<SchemaCategory, string> = {
            'education': '#3B82F6', // Blue
            'healthcare': '#10B981', // Green
            'identity': '#8B5CF6', // Purple
            'supply-chain': '#F59E0B', // Amber
            'legal': '#EF4444', // Red
            'finance': '#06B6D4', // Cyan
            'government': '#6366F1', // Indigo
            'custom': '#6B7280' // Gray
        };
        
        return colors[category] || colors['custom'];
    }

    /**
     * Get icon for schema category
     */
    private getCategoryIcon(category: SchemaCategory): string {
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
        
        return icons[category] || icons['custom'];
    }
}

// Export singleton instance
export const schemaService = new SchemaService();

// Export additional types for this service
export type { Schema, SchemaCategory, AttestationTemplate } from '../../contexts/types';