/**
 * Completion Tests - All Languages
 * Tests all code completion features across all supported languages
 */
import { TestSuite } from '../framework/test-framework';
export declare class CompletionAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for single-line completion
     */
    generateSingleLineCompletionTests(): TestSuite;
    /**
     * Generate test suite for multi-line completion
     */
    generateMultiLineCompletionTests(): TestSuite;
    /**
     * Generate test suite for function completion
     */
    generateFunctionCompletionTests(): TestSuite;
    /**
     * Generate test suite for class scaffolding
     */
    generateClassScaffoldingTests(): TestSuite;
    /**
     * Run all completion tests
     */
    runAllTests(): Promise<void>;
    /**
     * Helper: Get file extension for language
     */
    private getExtension;
    /**
     * Helper: Create test file
     */
    private createTestFile;
    /**
     * Helper: Get test content for language and type
     */
    private getTestContent;
    /**
     * Helper: Get function position for language
     */
    private getFunctionPosition;
    /**
     * Helper: Get class position for language
     */
    private getClassPosition;
}
//# sourceMappingURL=completion-all-languages.test.d.ts.map