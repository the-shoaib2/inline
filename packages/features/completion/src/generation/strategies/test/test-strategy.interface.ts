
import * as vscode from 'vscode';

export type TestFramework = 'jest' | 'mocha' | 'vitest' | 'pytest' | 'junit' | 'go-test' | 'rust-test' | 'auto';

export interface TestStrategy {
    supports(languageId: string): boolean;
    detectFramework(document: vscode.TextDocument): Promise<TestFramework>;
    getFrameworkInstructions(framework: TestFramework): string;
    countTests(code: string, framework: TestFramework): number;
}
