import * as vscode from 'vscode';
import { TreeSitterService } from '../parsers/tree-sitter-service';

/**
 * Basic type checker for code diagnostics.
 *
 * Detects:
 * - Type mismatches in assignments
 * - Missing return type annotations
 * - Implicit 'any' type parameters
 * - Type inference from literal values
 *
 * Supports all languages with type systems.
 * Uses regex-based heuristic analysis (not full type system).
 */
export class TypeChecker {

    /**
     * Check types in a document and return diagnostics.
     * Works with all supported languages.
     *
     * @param document VS Code document to check
     * @returns Array of type-related diagnostics
     */
    async checkTypes(document: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // Only check types for languages that support type annotations
        const treeSitter = TreeSitterService.getInstance();
        if (treeSitter.isSupported(languageId)) {
            diagnostics.push(...this.checkTypeScriptTypes(text, document));
        }

        return diagnostics;
    }

    /**
     * Check TypeScript/JavaScript specific type issues.
     * Detects assignment mismatches, missing annotations, and implicit any.
     */
    private checkTypeScriptTypes(text: string, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const lines = text.split('\n');

        lines.forEach((line, index) => {
            // Detect type mismatches: const x: string = 123
            const assignMatch = line.match(/(\w+):\s*(string|number|boolean)\s*=\s*(.+)/);
            if (assignMatch) {
                const [, varName, declaredType, value] = assignMatch;
                const actualType = this.inferType(value.trim());

                // Report error if inferred type doesn't match declared type
                if (actualType && actualType !== declaredType && actualType !== 'any') {
                    const range = new vscode.Range(index, 0, index, line.length);
                    diagnostics.push(new vscode.Diagnostic(
                        range,
                        `Type '${actualType}' is not assignable to type '${declaredType}'`,
                        vscode.DiagnosticSeverity.Error
                    ));
                }
            }

            // Detect missing return type annotations on functions
            const funcMatch = line.match(/function\s+\w+\s*\([^)]*\)\s*{/);
            if (funcMatch && !line.includes(':')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    'Missing return type annotation',
                    vscode.DiagnosticSeverity.Information
                ));
            }

            // Detect implicit 'any' type on function parameters
            const paramMatch = line.match(/function\s+\w+\s*\((\w+)\s*\)/);
            if (paramMatch && !line.includes(':')) {
                const range = new vscode.Range(index, 0, index, line.length);
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Parameter '${paramMatch[1]}' implicitly has an 'any' type`,
                    vscode.DiagnosticSeverity.Warning
                ));
            }
        });

        return diagnostics;
    }

    /**
     * Infer type from a literal value.
     * Handles strings, numbers, booleans, arrays, and objects.
     *
     * @param value Value to infer type from
     * @returns Inferred type name or null if unknown
     */
    private inferType(value: string): string | null {
        value = value.replace(/;$/, '').trim();

        // String literals
        if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
            return 'string';
        }
        // Number literals
        if (/^\d+$/.test(value) || /^\d+\.\d+$/.test(value)) {
            return 'number';
        }
        // Boolean literals
        if (value === 'true' || value === 'false') {
            return 'boolean';
        }
        // Array literals
        if (value.startsWith('[')) {
            return 'array';
        }
        if (value.startsWith('{')) {
            return 'object';
        }
        if (value === 'null' || value === 'undefined') {
            return value;
        }

        return null;
    }
}
