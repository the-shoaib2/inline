/**
 * Code Understanding Tests - All Languages
 * Tests explain code, hover info, and other understanding features
 */
import { TestSuite } from '../framework/test-framework';
export declare class UnderstandingAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Explain Code
     */
    generateExplainCodeTests(): TestSuite;
    /**
     * Generate test suite for Hovers
     */
    generateHoverTests(): TestSuite;
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
}
//# sourceMappingURL=understanding-all-languages.test.d.ts.map