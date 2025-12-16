import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Linter } from '../../src/validation/linter';
import { LinterRegistry } from '../../src/validation/linter-registry';
import { TypeScriptLinterStrategy } from '../../src/validation/strategies/typescript-linter-strategy';
import { PythonLinterStrategy } from '../../src/validation/strategies/python-linter-strategy';

// Mock VS Code module
vi.mock('vscode', () => {
    return {
        Range: class {
            constructor(public startLine: number, public startChar: number, public endLine: number, public endChar: number) {}
        },
        Diagnostic: class {
            constructor(public range: any, public message: string, public severity: any) {}
        },
        DiagnosticSeverity: {
            Error: 0,
            Warning: 1,
            Information: 2,
            Hint: 3
        },
        Position: class {
            constructor(public line: number, public character: number) {}
        },
        Uri: {
            parse: (s: string) => ({ toString: () => s })
        }
    };
});

import * as vscode from 'vscode'; // Import after mock to get mocked version

// Mock VS Code objects
class MockTextDocument implements vscode.TextDocument {
    uri: vscode.Uri;
    fileName: string;
    isUntitled: boolean;
    languageId: string;
    version: number;
    isDirty: boolean;
    isClosed: boolean;
    eol: vscode.EndOfLine;
    lineCount: number;

    constructor(private content: string, languageId: string) {
        this.languageId = languageId;
        this.lineCount = content.split('\n').length;
        this.uri = vscode.Uri.parse('file:///mock');
    }

    getText(): string {
        return this.content;
    }

    // Other methods irrelevant for this test
    save(): Thenable<boolean> { return Promise.resolve(true); }
    lineAt(line: number): vscode.TextLine { return {} as any; }
    offsetAt(position: vscode.Position): number { return 0; }
    positionAt(offset: number): vscode.Position { return new vscode.Position(0, 0); }
    validateRange(range: vscode.Range): vscode.Range { return range; }
    validatePosition(position: vscode.Position): vscode.Position { return position; }
    getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined { return undefined; }
}

describe('Linter E2E - Strategy Pattern', () => {
    let linter: Linter;

    beforeEach(() => {
        // Registry is valid singleton, so we'll clear and re-register to be safe
        const registry = LinterRegistry.getInstance();
        registry.clear();
        registry.register(new TypeScriptLinterStrategy());
        registry.register(new PythonLinterStrategy());
        
        linter = new Linter();
    });

    it('should lint TypeScript code using strategy', async () => {
        const code = `
            const MyVariable = 10; // Bad naming
            console.log('debug'); // Bad practice
            var x = 5; // Bad practice
        `;
        const doc = new MockTextDocument(code, 'typescript');
        const diagnostics = await linter.lint(doc);

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics.some(d => d.message.includes("Variable 'MyVariable' should use camelCase"))).toBe(true);
        expect(diagnostics.some(d => d.message.includes("Unexpected debug statement"))).toBe(true);
        expect(diagnostics.some(d => d.message.includes("Use let or const"))).toBe(true);
    });

    it('should lint Python code using strategy', async () => {
        const code = `
            myVariable = 10  # Bad naming (camelCase instead of snake_case)
            print("debug")   # Bad practice
        `;
        const doc = new MockTextDocument(code, 'python');
        const diagnostics = await linter.lint(doc);

        expect(diagnostics.length).toBeGreaterThan(0);
        expect(diagnostics.some(d => d.message.includes("Variable 'myVariable' should use snake_case"))).toBe(true);
        expect(diagnostics.some(d => d.message.includes("Unexpected debug statement"))).toBe(true);
    });

    it('should fall back to common rules for unknown language', async () => {
        const code = `
            function veryLongLine() {
                ${'a'.repeat(150)}
            }
        `;
        const doc = new MockTextDocument(code, 'unknown-lang');
        const diagnostics = await linter.lint(doc);

        // Should still catch line length issues (common rule)
        expect(diagnostics.some(d => d.message.includes('Line exceeds maximum length'))).toBe(true);
        // But should NOT try to check naming conventions (no strategy)
        expect(diagnostics.some(d => d.message.includes('camelCase'))).toBe(false);
    });
});
