/**
 * Context selector for intelligent context selection and prioritization.
 *
 * Features:
 * - Adaptive context selection based on cursor position and intent
 * - Dynamic prefix/suffix ratio optimization
 * - Symbol prioritization by relevance
 * - Token-aware context optimization
 * - Multi-tier context categorization
 */
import * as vscode from 'vscode';
import type { CodeContext, CursorIntent, FunctionInfo, ImportInfo, TypeInfo, SymbolInfo } from '@context/context-engine';
/**
 * Optimized context with prioritized elements and relevance scoring.
 */
export interface OptimizedContext {
    prefix: string;
    suffix: string;
    prioritizedSymbols: SymbolInfo[];
    relevantTypes: TypeInfo[];
    relevantFunctions: FunctionInfo[];
    suggestedImports: ImportInfo[];
    contextScore: number;
}
/**
 * Prioritized context organized by importance tiers.
 */
export interface PrioritizedContext {
    essential: string[];
    important: string[];
    optional: string[];
    totalTokens: number;
}
/**
 * Intelligent context selector that optimizes context based on cursor position,
 * user intent, and token constraints.
 */
export declare class ContextSelector {
    private maxContextTokens;
    /**
     * Select optimal context based on cursor position and detected intent.
     *
     * @param document - Current document
     * @param position - Cursor position
     * @param intent - Detected user intent
     * @param availableContext - Full available context
     * @returns Optimized context with prioritized elements
     */
    selectOptimalContext(document: vscode.TextDocument, position: vscode.Position, intent: CursorIntent | null, availableContext: CodeContext): OptimizedContext;
    /**
     * Prioritize context elements into tiers based on detected user intent.
     *
     * @param context - Full available context
     * @param intent - Detected user intent
     * @returns Context organized by importance tiers
     */
    prioritizeContext(context: CodeContext, intent: CursorIntent | null): PrioritizedContext;
    /**
     * Calculate optimal prefix/suffix ratio based on cursor position in document.
     * Uses adaptive weighting to provide more relevant context.
     *
     * @param position - Current cursor position
     * @param document - Current document
     * @returns Optimal prefix and suffix ratios
     */
    calculateOptimalRatio(position: vscode.Position, document: vscode.TextDocument): {
        prefixRatio: number;
        suffixRatio: number;
    };
    /**
     * Adjust context based on ratio
     */
    private adjustContextRatio;
    /**
     * Prioritize symbols based on proximity and intent
     */
    private prioritizeSymbols;
    /**
     * Select relevant types based on intent
     */
    private selectRelevantTypes;
    /**
     * Select relevant functions based on intent and proximity
     */
    private selectRelevantFunctions;
    /**
     * Suggest imports based on intent
     */
    private suggestImports;
    /**
     * Calculate context quality score (0-1)
     */
    private calculateContextScore;
    /**
     * Estimate token count for context elements
     */
    private estimateTokenCount;
    /**
     * Filter context to fit within token limit
     */
    filterContextByTokenLimit(context: PrioritizedContext, maxTokens: number): PrioritizedContext;
    /**
     * Estimate tokens for a single item
     */
    private estimateItemTokens;
    /**
     * Rank context elements by importance
     */
    rankContextElements(context: CodeContext, intent: CursorIntent | null): Array<{
        element: string;
        type: string;
        importance: number;
    }>;
}
//# sourceMappingURL=context-selector.d.ts.map