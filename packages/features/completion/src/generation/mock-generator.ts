
import { CompletionStrategyRegistry, StrategyType } from '../services/strategy-registry';
import { MockStrategy, MockMethod } from './strategies/mock/mock-strategy.interface';

/**
 * Mock Generator
 * Generates mocks and stubs for testing using pluggable strategies
 */
export class MockGenerator {
    constructor() {}

    generateMock(languageId: string, interfaceName: string, methods: MockMethod[]): string {
        const strategy = CompletionStrategyRegistry.getInstance().getStrategy<MockStrategy>(StrategyType.MOCK, languageId);
        
        if (!strategy) {
            return '';
        }

        return strategy.generateMock(interfaceName, methods);
    }

    generateStub(languageId: string, className: string, methods: string[]): string {
        const strategy = CompletionStrategyRegistry.getInstance().getStrategy<MockStrategy>(StrategyType.MOCK, languageId);
        
        if (!strategy) {
            return '';
        }

        return strategy.generateStub(className, methods);
    }
}
