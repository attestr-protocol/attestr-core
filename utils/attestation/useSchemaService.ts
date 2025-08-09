// utils/attestation/useSchemaService.ts
import { schemaService } from './schemaService';

/**
 * Hook for using the schema service
 */
export const useSchemaService = () => {
  return {
    getSchemas: () => schemaService.getAllSchemas(),
    getSchemaById: (id: string) => schemaService.getSchema(id),
    getSchemasByCategory: (category: any) => schemaService.getSchemasByCategory(category),
    getTemplate: (schemaId: string) => schemaService.getTemplate(schemaId),
    getFeaturedTemplates: () => schemaService.getFeaturedTemplates(),
    searchTemplates: (query: string) => schemaService.searchTemplates(query),
    createSchema: (params: any) => schemaService.createSchema(params),
    updateSchema: (schemaId: string, description: string, jsonSchema: string) => 
      schemaService.updateSchema(schemaId, description, jsonSchema),
    deactivateSchema: (schemaId: string) => schemaService.deactivateSchema(schemaId)
  };
};