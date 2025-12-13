import * as vscode from 'vscode';
/**
 * Wait for a condition to be true
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number): Promise<void>;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Create a test document
 */
export declare function createTestDocument(content: string, language?: string): Promise<vscode.TextDocument>;
/**
 * Open a test file from fixtures
 */
export declare function openTestFile(relativePath: string): Promise<vscode.TextDocument>;
/**
 * Measure execution time
 */
export declare function measureTime<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Clean up all open editors
 */
export declare function closeAllEditors(): Promise<void>;
/**
 * Get extension by ID
 */
export declare function getExtension(): vscode.Extension<any> | undefined;
/**
 * Activate extension and wait for it to be ready
 */
export declare function activateExtension(): Promise<void>;
/**
 * Check if real model should be used in tests
 */
export declare function enableRealModel(): boolean;
/**
 * Setup mock inference engine for testing
 */
export declare function setupMockInference(provider: any): Promise<void>;
//# sourceMappingURL=test-utils.d.ts.map