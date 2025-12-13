/**
 * Validation Tests - All Languages
 * Tests error detection, type checking, and security scanning
 */
import { TestSuite } from '../framework/test-framework';
export declare class ValidationAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for syntax error highlighting
     */
    generateSyntaxErrorTests(): TestSuite;
    /**
     * Generate test suite for security scanning
     */
    generateSecurityScanTests(): TestSuite;
    /**
     * Generate test suite for unused variable detection
     */
    generateUnusedVariableTests(): TestSuite;
    /**
     * Run all validation tests
     */
    runAllTests(): Promise<void>;
    private getExtension;
    private createTestFile;
    private getTestContent;
    private checkWebviewForSecurityAlerts;
}
//# sourceMappingURL=validation-all-languages.test.d.ts.map