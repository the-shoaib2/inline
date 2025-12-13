/**
 * E2E Test Framework
 * Provides infrastructure for testing all features across all languages
 */
import * as vscode from 'vscode';
export interface TestResult {
    feature: string;
    language: string;
    passed: boolean;
    duration: number;
    error?: string;
    details?: any;
}
export interface TestSuite {
    name: string;
    tests: TestCase[];
}
export interface TestCase {
    name: string;
    language: string;
    feature: string;
    setup?: () => Promise<void>;
    execute: () => Promise<void>;
    verify: () => Promise<boolean>;
    cleanup?: () => Promise<void>;
}
export declare class E2ETestFramework {
    private results;
    private startTime;
    private testWorkspace;
    constructor(workspacePath: string);
    /**
     * Run a single test case
     */
    runTest(testCase: TestCase): Promise<TestResult>;
    /**
     * Run a test suite
     */
    runSuite(suite: TestSuite): Promise<TestResult[]>;
    /**
     * Run multiple test suites in parallel
     */
    runSuitesParallel(suites: TestSuite[], maxConcurrency?: number): Promise<TestResult[]>;
    /**
     * Get test statistics
     */
    getStatistics(): {
        total: number;
        passed: number;
        failed: number;
        passRate: number;
        totalDuration: number;
        avgDuration: number;
        byFeature: {
            [k: string]: {
                passed: number;
                failed: number;
            };
        };
        byLanguage: {
            [k: string]: {
                passed: number;
                failed: number;
            };
        };
    };
    /**
     * Generate HTML report
     */
    generateHTMLReport(): string;
    /**
     * Save report to file
     */
    saveReport(outputPath: string): Promise<void>;
    /**
     * Export results to JSON
     */
    exportJSON(): string;
    /**
     * Clear all results
     */
    clearResults(): void;
    /**
     * Get all results
     */
    getResults(): TestResult[];
    /**
     * Wait for a condition to be true
     */
    waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<boolean>;
    /**
     * Sleep for a specified duration
     */
    sleep(ms: number): Promise<void>;
}
/**
 * Helper function to create a test workspace
 */
export declare function createTestWorkspace(baseDir: string): Promise<string>;
/**
 * Helper function to open a file in VS Code
 */
export declare function openFile(filePath: string): Promise<vscode.TextDocument>;
/**
 * Helper function to wait for a condition
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<boolean>;
/**
 * Helper function to trigger completion
 */
export declare function triggerCompletion(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionList | vscode.CompletionItem[] | undefined>;
//# sourceMappingURL=test-framework.d.ts.map