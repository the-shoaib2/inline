import * as vscode from 'vscode';
/**
 * Basic type checker for code diagnostics.
 *
 * Detects:
 * - Type mismatches in assignments
 * - Missing return type annotations
 * - Implicit 'any' type parameters
 * - Type inference from literal values
 *
 * Supports TypeScript and JavaScript.
 * Uses regex-based heuristic analysis (not full type system).
 */
export declare class TypeChecker {
    /**
     * Check types in a document and return diagnostics.
     * Currently supports TypeScript/JavaScript.
     *
     * @param document VS Code document to check
     * @returns Array of type-related diagnostics
     */
    checkTypes(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;
    /**
     * Check TypeScript/JavaScript specific type issues.
     * Detects assignment mismatches, missing annotations, and implicit any.
     */
    private checkTypeScriptTypes;
    /**
     * Infer type from a literal value.
     * Handles strings, numbers, booleans, arrays, and objects.
     *
     * @param value Value to infer type from
     * @returns Inferred type name or null if unknown
     */
    private inferType;
}
//# sourceMappingURL=type-checker.d.ts.map