
import { DTOStrategy, DTOField } from './strategies/dto/dto-strategy.interface';
import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';

/**
 * DTO Generator
 * Generates Data Transfer Object classes using pluggable strategies
 */
export class DTOGenerator {
    constructor() {}

    generateDTO(languageId: string, name: string, fields: DTOField[]): string {
        const strategy = CompletionStrategyRegistry.getInstance().getStrategy<DTOStrategy>(StrategyType.DTO, languageId);
        
        if (!strategy) {
            console.warn(`[DTOGenerator] No strategy found for language: ${languageId}`);
            return '';
        }

        return strategy.generate(name, fields);
    }
}
