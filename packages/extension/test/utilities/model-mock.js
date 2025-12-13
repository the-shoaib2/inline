"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockModel = void 0;
exports.createMockModelInfo = createMockModelInfo;
exports.createMockModels = createMockModels;
/**
 * Mock model for testing
 */
class MockModel {
    constructor(delay = 100) {
        this.responseDelay = delay;
    }
    async generate(prompt) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, this.responseDelay));
        // Generate mock completion based on prompt
        if (prompt.includes('function')) {
            return 'function example() {\n  return true;\n}';
        }
        else if (prompt.includes('class')) {
            return 'class Example {\n  constructor() {}\n}';
        }
        else if (prompt.includes('import')) {
            return "import { something } from 'module';";
        }
        else {
            return 'const result = true;';
        }
    }
}
exports.MockModel = MockModel;
/**
 * Create mock model info
 */
function createMockModelInfo(overrides) {
    return {
        id: 'mock-model',
        name: 'Mock Model',
        size: 1000000,
        description: 'Mock model for testing',
        languages: ['typescript', 'javascript', 'python'],
        requirements: {
            vram: 2,
            ram: 4,
            cpu: true,
            gpu: false
        },
        isDownloaded: true,
        path: '/mock/path/model.gguf',
        ...overrides
    };
}
/**
 * Create multiple mock models
 */
function createMockModels() {
    return [
        createMockModelInfo({
            id: 'small-model',
            name: 'Small Model',
            size: 500000,
            requirements: { vram: 1, ram: 2, cpu: true }
        }),
        createMockModelInfo({
            id: 'medium-model',
            name: 'Medium Model',
            size: 2000000,
            requirements: { vram: 4, ram: 6, cpu: true, gpu: true }
        }),
        createMockModelInfo({
            id: 'large-model',
            name: 'Large Model',
            size: 8000000,
            requirements: { vram: 8, ram: 12, gpu: true }
        })
    ];
}
//# sourceMappingURL=model-mock.js.map