import { ModelInfo } from '@inline/intelligence';
/**
 * Mock model for testing
 */
export declare class MockModel {
    private responseDelay;
    constructor(delay?: number);
    generate(prompt: string): Promise<string>;
}
/**
 * Create mock model info
 */
export declare function createMockModelInfo(overrides?: Partial<ModelInfo>): ModelInfo;
/**
 * Create multiple mock models
 */
export declare function createMockModels(): ModelInfo[];
//# sourceMappingURL=model-mock.d.ts.map