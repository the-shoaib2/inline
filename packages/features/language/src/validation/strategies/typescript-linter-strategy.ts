import * as vscode from 'vscode';
import { LinterStrategy } from './linter-strategy.interface';

export class TypeScriptLinterStrategy implements LinterStrategy {
    supports(languageId: string): boolean {
        return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
    }

    checkNamingConventions(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for camelCase in variables
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
        });

        return diagnostics;
    }

    checkBestPractices(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for console.log statements
            if ((line.includes('console.log')) && !line.trim().startsWith('//')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Unexpected debug statement in production code',
                    vscode.DiagnosticSeverity.Information
                ));
            }

            // Check for == instead of ===
            if (/[^=!]==[^=]/.test(line)) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Use === instead of ==',
                    vscode.DiagnosticSeverity.Warning
                ));
            }

            // Check for var instead of let/const
            if (/\bvar\s+/.test(line)) {
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
