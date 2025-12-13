/**
 * Execution Tools Tests - All Languages
 * Covers: Build & Run (O), Terminal (P)
 */
import { TestSuite } from '../framework/test-framework';
export declare class ExecutionToolsAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Build & Run Features
     */
    generateBuildRunTests(): TestSuite;
    /**
     * Generate test suite for Terminal Features
     */
    generateTerminalTests(): TestSuite;
    runAllTests(): Promise<void>;
    private isCompiledLanguage;
    private createTestFile;
    private getExtension;
    private getHelloWorld;
}
//# sourceMappingURL=execution-tools-all-languages.test.d.ts.map