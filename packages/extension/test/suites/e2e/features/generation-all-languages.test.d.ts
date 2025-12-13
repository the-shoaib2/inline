/**
 * Generation Tests - All Languages
 * Tests all code generation features across all supported languages
 */
import { TestSuite } from '../framework/test-framework';
export declare class GenerationAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for function generation from signature
     */
    generateFunctionSignatureTests(): TestSuite;
    /**
     * Generate test suite for test generation
     */
    generateTestGenerationTests(): TestSuite;
    /**
     * Generate test suite for documentation generation
     */
    generateDocGenerationTests(): TestSuite;
    /**
     * Run all generation tests
     */
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
    private getFunctionBodyPosition;
}
//# sourceMappingURL=generation-all-languages.test.d.ts.map