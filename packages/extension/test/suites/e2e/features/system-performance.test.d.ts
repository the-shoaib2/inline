/**
 * System Performance Tests - All Languages
 * Covers: Performance (Q), Caching (R), Resource Management (V)
 */
import { TestSuite } from '../framework/test-framework';
export declare class SystemPerformanceTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Performance Monitoring
     */
    generatePerformanceTests(): TestSuite;
    /**
     * Generate test suite for Caching
     */
    generateCachingTests(): TestSuite;
    /**
     * Generate test suite for Resource Management
     */
    generateResourceTests(): TestSuite;
    runAllTests(): Promise<void>;
}
//# sourceMappingURL=system-performance.test.d.ts.map