

import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';
import { IntegrationTestStrategy } from './strategies/integration-test/integration-test-strategy.interface';

/**
 * Integration Test Generator
 * Generates integration tests using pluggable strategies
 */
export class IntegrationTestGenerator {
    constructor() {}
    
    async generateIntegrationTest(
        componentName: string,
        dependencies: string[],
        languageId: string
    ): Promise<string> {
        const strategy = CompletionStrategyRegistry.getInstance().getStrategy<IntegrationTestStrategy>(StrategyType.INTEGRATION_TEST, languageId);
        if (strategy) {
            return strategy.generateIntegrationTest(componentName, dependencies);
        }
        return '';
    }
}
