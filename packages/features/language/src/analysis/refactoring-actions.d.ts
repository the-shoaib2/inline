import * as vscode from 'vscode';
interface RefactoringResult {
    success: boolean;
    edits: vscode.TextEdit[];
    description: string;
}
export declare class RefactoringActions {
    private semanticAnalyzer;
    constructor();
    /**
     * Rename symbol across all references
     */
    renameSymbol(document: vscode.TextDocument, position: vscode.Position, newName: string): Promise<RefactoringResult>;
    /**
     * Extract variable from selected expression
     */
    extractVariable(document: vscode.TextDocument, range: vscode.Range, variableName?: string): Promise<RefactoringResult>;
    /**
     * Extract function/method from selected code
     */
    extractFunction(document: vscode.TextDocument, range: vscode.Range, functionName?: string): Promise<RefactoringResult>;
    /**
     * Inline variable - replace all usages with the variable's value
     */
    inlineVariable(document: vscode.TextDocument, position: vscode.Position): Promise<RefactoringResult>;
    /**
     * Generate a variable name from an expression
     */
    private generateVariableName;
    /**
     * Find variables used in selected code
     */
    private findUsedVariables;
    /**
     * Find position to insert extracted function
     */
    private findInsertPositionForFunction;
}
export {};
//# sourceMappingURL=refactoring-actions.d.ts.map