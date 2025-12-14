import * as vscode from 'vscode';
import { TreeSitterService } from './tree-sitter-service';

/**
 * Syntax Validator
 * Validates syntax errors in code for all supported languages
 */
export class SyntaxValidator {
    
    async validateSyntax(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // Use generic syntax validation for all supported languages
        const treeSitter = TreeSitterService.getInstance();
        if (treeSitter.isSupported(languageId)) {
            diagnostics.push(...this.validateGenericSyntax(text, document, languageId));
        }

        return diagnostics;
    }

    private validateGenericSyntax(text: string, document: vscode.TextDocument, languageId: string): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for unclosed brackets (works for most C-style languages)
            const openBrackets = (line.match(/[{[(]/g) || []).length;
            const closeBrackets = (line.match(/[}\])]/g) || []).length;
            
            if (openBrackets > closeBrackets && !line.trim().endsWith(',')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Unclosed bracket detected',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        });

        return diagnostics;
    }

    private validateJavaScriptSyntax(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for unclosed brackets
            const openBrackets = (line.match(/[{[(]/g) || []).length;
            const closeBrackets = (line.match(/[}\])]/g) || []).length;
            
            if (openBrackets > closeBrackets && !line.trim().endsWith(',')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Unclosed bracket detected',
                    vscode.DiagnosticSeverity.Error
                ));
            }

            // Check for missing semicolons (simple heuristic)
            if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
                !line.trim().endsWith('}') && !line.trim().endsWith(',') &&
                !line.trim().startsWith('//') && !line.trim().startsWith('*') &&
                /^(const|let|var|return)\s/.test(line.trim())) {
                const range = new vscode.Range(index, line.length, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Missing semicolon',
                    vscode.DiagnosticSeverity.Warning
                ));
            }

            // Check for undefined variables (basic)
            const match = line.match(/\b(\w+)\s+is\s+not\s+defined/);
            if (match) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `'${match[1]}' is not defined`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        });

        return diagnostics;
    }

    private validatePythonSyntax(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Check for incorrect indentation
            if (line.match(/^\s+/) && line.match(/^\s+/)![0].length % 4 !== 0) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Incorrect indentation (should be multiple of 4 spaces)',
                    vscode.DiagnosticSeverity.Warning
                ));
            }

            // Check for missing colons
            if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\s/.test(line.trim()) &&
                !line.trim().endsWith(':')) {
                const range = new vscode.Range(index, line.length, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Missing colon',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        });

        return diagnostics;
    }
}
