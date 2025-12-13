/**
 * Smart Commands Tests - All Languages
 * Tests slash commands: /explain, /fix, /optimize, /test, etc.
 */
import { TestSuite } from '../framework/test-framework';
export declare class SmartCommandsAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for /explain command
     */
    generateExplainCommandTests(): TestSuite;
    /**
    * Generate test suite for /fix command
    */
    generateFixCommandTests(): TestSuite;
    runAllTests(): Promise<void>;
    private createTestFile;
}
//# sourceMappingURL=smart-commands-all-languages.test.d.ts.map