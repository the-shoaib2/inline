
import * as vscode from 'vscode';
import { TestStrategy, TestFramework } from './test-strategy.interface';

export class PythonTestStrategy implements TestStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    async detectFramework(document: vscode.TextDocument): Promise<TestFramework> {
        return 'pytest';
    }

    getFrameworkInstructions(framework: TestFramework): string {
        return 'Use pytest syntax with test_ functions. Use assert statements.';
    }

    countTests(code: string, framework: TestFramework): number {
        const pattern = /^def\s+test_/gm;
        const matches = code.match(pattern);
        return matches ? matches.length : 0;
    }
}
