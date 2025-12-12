import * as vscode from 'vscode';
import { LlamaInference } from '@intelligence/engines/llama-engine';
export interface ErrorExplanation {
    error: string;
    explanation: string;
    suggestedFixes: string[];
    severity: vscode.DiagnosticSeverity;
    resources?: string[];
}
export declare class ErrorExplainer {
    private inference;
    private logger;
    private explanationCache;
    constructor(inference: LlamaInference);
    /**
     * Explain a compiler/interpreter error
     */
    explainError(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): Promise<ErrorExplanation>;
    /**
     * Build prompt for error explanation
     */
    private buildExplanationPrompt;
    /**
     * Get surrounding context for an error
     */
    private getErrorContext;
    /**
     * Parse explanation from LLM response
     */
    private parseExplanation;
    /**
     * Generate fix code for an error
     */
    generateFix(diagnostic: vscode.Diagnostic, document: vscode.TextDocument): Promise<string>;
    /**
     * Clean generated fix code
     */
    private cleanFixCode;
    /**
     * Explain multiple errors in a file
     */
    explainDiagnostics(diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): Promise<ErrorExplanation[]>;
    /**
     * Get common error patterns for a language
     */
    private getCommonErrorPatterns;
    /**
     * Quick explanation for common errors
     */
    getQuickExplanation(errorMessage: string, languageId: string): string | null;
    /**
     * Clear explanation cache
     */
    clearCache(): void;
}
//# sourceMappingURL=error-explainer.d.ts.map