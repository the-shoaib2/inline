/**
 * Testing Features Tests - All Languages
 * Tests test generation features: Unit tests, Integration tests, etc.
 */
import { TestSuite } from '../framework/test-framework';
export declare class TestingFeaturesAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Unit Test Generation
     */
    generateUnitTestGenTests(): TestSuite;
    runAllTests(): Promise<void>;
    private createTestFile;
}
//# sourceMappingURL=testing-features-all-languages.test.d.ts.map