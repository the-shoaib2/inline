import * as vscode from 'vscode';
/**
 * Linter
 * Checks code style and best practices
 */
export declare class Linter {
    lint(document: vscode.TextDocument): Promise<vscode.Diagnostic[]>;
    private checkLineLength;
    private checkNamingConventions;
    private checkComplexity;
    private checkBestPractices;
}
//# sourceMappingURL=linter.d.ts.map