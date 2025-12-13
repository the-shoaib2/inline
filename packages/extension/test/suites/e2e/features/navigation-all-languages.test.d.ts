/**
 * Navigation Tests - All Languages
 * Tests code navigation features: Go to Definition, Find References, etc.
 */
import { TestSuite } from '../framework/test-framework';
export declare class NavigationAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Go to Definition
     */
    generateGoToDefinitionTests(): TestSuite;
    /**
     * Generate test suite for Find References
     */
    generateFindReferencesTests(): TestSuite;
    /**
     * Generate test suite for Navigate to Symbol
     */
    generateSymbolNavigationTests(): TestSuite;
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
    private getDefinitionPosition;
    private getUsagePosition;
}
//# sourceMappingURL=navigation-all-languages.test.d.ts.map