/**
 * Core Intelligence Tests - All Languages
 * Covers: Model Management (S), Context Intelligence (T), Validation (Z), Feedback (AA)
 */
import { TestSuite } from '../framework/test-framework';
export declare class CoreIntelligenceTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Model Management
     */
    generateModelManagementTests(): TestSuite;
    /**
     * Generate test suite for Context Intelligence
     */
    generateContextTests(): TestSuite;
    /**
     * Generate test suite for Validation & Analysis
     */
    generateValidationTests(): TestSuite;
    /**
     * Generate test suite for Feedback & Learning
     */
    generateFeedbackTests(): TestSuite;
    runAllTests(): Promise<void>;
}
//# sourceMappingURL=core-intelligence.test.d.ts.map