import * as vscode from 'vscode';
import { LlamaInference } from '../engines/llama-engine';
export type RefactoringType = 'extract-method' | 'extract-variable' | 'rename' | 'inline' | 'convert-to-arrow' | 'add-null-checks' | 'simplify-conditional' | 'remove-dead-code' | 'optimize-imports';
export interface RefactoringResult {
    type: RefactoringType;
    originalCode: string;
    refactoredCode: string;
    description: string;
    confidence: number;
}
export interface RefactoringSuggestion {
    type: RefactoringType;
    description: string;
    range: vscode.Range;
    priority: 'high' | 'medium' | 'low';
}
export declare class RefactoringEngine {
    private inference;
    private logger;
    constructor(inference: LlamaInference);
    /**
     * Suggest refactorings for code
     */
    suggestRefactorings(document: vscode.TextDocument, range: vscode.Range): Promise<RefactoringSuggestion[]>;
    /**
     * Detect pattern-based refactoring opportunities
     */
    private detectPatternBasedRefactorings;
    /**
     * Get LLM-based refactoring suggestions
     */
    private getLLMRefactoringSuggestions;
    /**
     * Parse refactoring suggestions from LLM response
     */
    private parseRefactoringSuggestions;
    /**
     * Apply refactoring
     */
    applyRefactoring(document: vscode.TextDocument, range: vscode.Range, type: RefactoringType): Promise<RefactoringResult>;
    /**
     * Build refactoring prompt
     */
    private buildRefactoringPrompt;
    /**
     * Clean refactored code
     */
    private cleanRefactoredCode;
    /**
     * Get refactoring description
     */
    private getRefactoringDescription;
    /**
     * Extract method refactoring
     */
    extractMethod(document: vscode.TextDocument, range: vscode.Range, methodName: string): Promise<string>;
    /**
     * Simplify conditional logic
     */
    simplifyConditional(document: vscode.TextDocument, range: vscode.Range): Promise<string>;
}
//# sourceMappingURL=refactoring-engine.d.ts.map