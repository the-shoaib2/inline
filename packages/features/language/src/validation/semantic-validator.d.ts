import * as vscode from 'vscode';
/**
 * Semantic Validator
 * Validates semantic errors in code
 */
export declare class SemanticValidator {
    validateSemantics(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;
    private findUnreachableCode;
    private findDuplicateDeclarations;
    private findUnusedParameters;
}
//# sourceMappingURL=semantic-validator.d.ts.map