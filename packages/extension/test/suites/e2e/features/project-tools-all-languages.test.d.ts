/**
 * Project Tools Tests - All Languages
 * Covers: Version Control (K), Search (L), Documentation (M), Dependencies (N)
 */
import { TestSuite } from '../framework/test-framework';
export declare class ProjectToolsAllLanguagesTest {
    private framework;
    private generator;
    private matrix;
    constructor(workspacePath: string, languagesJsonPath: string);
    /**
     * Generate test suite for Version Control Features
     */
    generateVcsTests(): TestSuite;
    /**
     * Generate test suite for Search Features
     */
    generateSearchTests(): TestSuite;
    /**
     * Generate test suite for Documentation Features
     */
    generateDocumentationTests(): TestSuite;
    /**
     * Generate test suite for Dependency Features
     */
    generateDependencyTests(): TestSuite;
    runAllTests(): Promise<void>;
    private createTestFile;
}
//# sourceMappingURL=project-tools-all-languages.test.d.ts.map