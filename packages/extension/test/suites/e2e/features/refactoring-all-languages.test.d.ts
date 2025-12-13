/**
 * Refactoring Tests - All Languages
 * Tests refactoring features: Rename, Extract, Inline
 */
import { TestSuite } from '../framework/test-framework';
export declare class RefactoringAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Rename Symbol
     */
    generateRenameTests(): TestSuite;
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
}
//# sourceMappingURL=refactoring-all-languages.test.d.ts.map