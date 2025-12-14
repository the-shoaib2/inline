import * as vscode from 'vscode';
import { TreeSitterService } from '../parsers/tree-sitter-service';

/**
 * Linter
 * Checks code style and best practices
 */
export class Linter {
    
    async lint(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // Common linting rules
        diagnostics.push(...this.checkLineLength(text, document));
        diagnostics.push(...this.checkNamingConventions(text, document, languageId));
        diagnostics.push(...this.checkComplexity(text, document));
        diagnostics.push(...this.checkBestPractices(text, document, languageId));

        return diagnostics;
    }

    private checkLineLength(text: string, document: vscode.TextDocument, maxLength: number = 120): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            if (line.length > maxLength) {
                const range = new vscode.Range(index, maxLength, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Line exceeds maximum length of ${maxLength} characters`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        });

        return diagnostics;
    }

    private checkNamingConventions(text: string, document: vscode.TextDocument, languageId: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');
        const treeSitter = TreeSitterService.getInstance();
        
        if (!treeSitter.isSupported(languageId)) return diagnostics;

        lines.forEach((line, index) => {
            // Check for camelCase in C-style languages (JS, TS, Java, C#, C, C++, Rust, Go, etc.)
            const cStyleLanguages = ['typescript', 'javascript', 'java', 'csharp', 'c', 'cpp', 'rust', 'go', 'swift', 'kotlin', 'scala', 'dart'];
            if (cStyleLanguages.includes(languageId)) {
                const varMatch = line.match(/(?:const|let|var|auto|val)\s+([A-Z]\w+)\s*=/);
                if (varMatch) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Variable '${varMatch[1]}' should use camelCase`,
                        vscode.DiagnosticSeverity.Warning
                    ));
                }

                // Check for PascalCase in class names
                const classMatch = line.match(/class\s+([a-z]\w+)/);
                if (classMatch) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Class '${classMatch[1]}' should use PascalCase`,
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }

            // Check for snake_case in Scripting languages (Python, Ruby, Lua, etc.)
            const scriptingLanguages = ['python', 'ruby', 'php', 'lua', 'bash', 'shell'];
            if (scriptingLanguages.includes(languageId)) {
                const varMatch = line.match(/(\w+[A-Z]\w+)\s*=/);
                if (varMatch && !line.includes('class ')) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Variable '${varMatch[1]}' should use snake_case`,
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }
        });

        return diagnostics;
    }

    private checkComplexity(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');
        let functionStart = -1;
        let complexity = 0;

        lines.forEach((line, index) => {
            if (/function\s+\w+|=>\s*{/.test(line)) {
                functionStart = index;
                complexity = 1;
            }

            if (functionStart !== -1) {
                // Count complexity indicators
                if (/\b(if|else|for|while|case|catch|\?|&&|\|\|)\b/.test(line)) {
                    complexity++;
                }

                if (line.includes('}') && functionStart !== -1) {
                    if (complexity > 10) {
                        const range = new vscode.Range(functionStart, 0, index, line.length);
                        diagnostics.push(new vscode.Diagnostic(
                            range,
                            `Function has cyclomatic complexity of ${complexity} (threshold: 10)`,
                            vscode.DiagnosticSeverity.Warning
                        ));
                    }
                    functionStart = -1;
                }
            }
        });

        return diagnostics;
    }

    private checkBestPractices(text: string, document: vscode.TextDocument, languageId: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');
        const treeSitter = TreeSitterService.getInstance();
        
        if (!treeSitter.isSupported(languageId)) return diagnostics;

        lines.forEach((line, index) => {
            // Check for console.log/print statements in production code
            const webLanguages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
            const scriptingLanguages = ['python', 'ruby', 'php', 'lua'];
            
            if (webLanguages.includes(languageId) || scriptingLanguages.includes(languageId)) {
                if ((line.includes('console.log') || line.includes('print(')) && !line.trim().startsWith('//') && !line.trim().startsWith('#')) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        'Unexpected debug statement in production code',
                        vscode.DiagnosticSeverity.Information
                    ));
                }
            }

            // Check for == instead of === (JavaScript/TypeScript)
            if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId)) {
                if (/[^=!]==[^=]/.test(line)) {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        'Use === instead of ==',
                        vscode.DiagnosticSeverity.Warning
                    ));
                }
            }

            // Check for var instead of let/const (JavaScript/TypeScript)
            if (['javascript', 'typescript', 'javascriptreact', 'typescriptreact'].includes(languageId) && /\bvar\s+/.test(line)) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Use let or const instead of var',
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        });

        return diagnostics;
    }
}
