import * as vscode from 'vscode';
/**
 * Syntax Validator
 * Validates syntax errors in code
 */
export declare class SyntaxValidator {
    validateSyntax(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;
    private validateJavaScriptSyntax;
    private validatePythonSyntax;
}
//# sourceMappingURL=syntax-validator.d.ts.map