/**
 * Code Actions Tests - All Languages
 * Tests code actions: Quick Fix, Organize Imports, etc.
 */
import { TestSuite } from '../framework/test-framework';
export declare class ActionsAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Quick Fix
     */
    generateQuickFixTests(): TestSuite;
    /**
     * Generate test suite for Organize Imports
     */
    generateOrganizeImportsTests(): TestSuite;
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
}
//# sourceMappingURL=actions-all-languages.test.d.ts.map