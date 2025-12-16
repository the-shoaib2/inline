
import { LlamaInference } from '@inline/intelligence';
import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';
import { CRUDStrategy, CRUDField } from './strategies/crud/crud-strategy.interface';

/**
 * CRUD Generator
 * Generates Create, Read, Update, Delete operations
 */
export class CRUDGenerator {
    constructor() {}

    generateCRUD(languageId: string, entityName: string, fields: CRUDField[]): string {
        const strategy = CompletionStrategyRegistry.getInstance().getStrategy<CRUDStrategy>(StrategyType.CRUD, languageId);
        
        if (!strategy) {
            return '';
        }
        
        return strategy.generateCRUD(entityName, fields);
    }
}

