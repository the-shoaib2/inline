import * as vscode from 'vscode';
import { LinterStrategy } from './linter-strategy.interface';

export class PythonLinterStrategy implements LinterStrategy {
    supports(languageId: string): boolean {
        return languageId === 'python';
    }

    checkNamingConventions(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for snake_case in variables
            // This is a naive check; a real linter would use AST. 
            // Migrating existing logic which checks for CamelCase where snake_case is expected.
            const varMatch = line.match(/(\w+[A-Z]\w+)\s*=/);
            if (varMatch && !line.includes('class ')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Variable '${varMatch[1]}' should use snake_case`,
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
            // Check for print statements
            if (line.includes('print(') && !line.trim().startsWith('#')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Unexpected debug statement in production code',
                    vscode.DiagnosticSeverity.Information
                ));
            }
        });

        return diagnostics;
    }
}
