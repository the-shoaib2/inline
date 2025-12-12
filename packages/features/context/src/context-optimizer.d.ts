/**
 * Context optimizer for reducing token overhead and improving efficiency.
 *
 * Features:
 * - Whitespace normalization
 * - Import deduplication
 * - Comment removal when necessary
 * - Token-aware truncation
 * - Progressive optimization strategies
 */
/**
 * Optimizes code context to minimize token usage while preserving essential information.
 * Applies multiple optimization strategies in order of increasing aggressiveness.
 */
export declare class ContextOptimizer {
    private logger;
    constructor();
    /**
     * Optimize context to reduce token count using progressive strategies.
     *
     * @param context - Raw context string to optimize
     * @param maxTokens - Maximum allowed tokens (default: 2048)
     * @returns Optimized context string
     */
    optimize(context: string, maxTokens?: number): string;
    /**
     * Normalize excessive whitespace to reduce token count.
     *
     * @param text - Text to normalize
     * @returns Text with normalized whitespace
     */
    private removeExcessiveWhitespace;
    /**
     * Remove duplicate import statements to reduce redundancy.
     *
     * @param text - Text containing import statements
     * @returns Text with deduplicated imports
     */
    private deduplicateImports;
    /**
     * Remove comments to save tokens when context is too large.
     * Supports multiple comment styles (JS, TS, Python).
     *
     * @param text - Text to remove comments from
     * @returns Text without comments
     */
    private removeComments;
    /**
     * Estimate token count using character-based approximation.
     * Uses 1 token ≈ 4 characters as a rough estimate.
     *
     * @param text - Text to estimate tokens for
     * @returns Estimated token count
     */
    private estimateTokens;
    /**
     * Truncate text to fit within token limit.
     * Attempts to truncate at line boundaries for better readability.
     *
     * @param text - Text to truncate
     * @param maxTokens - Maximum allowed tokens
     * @returns Truncated text
     */
    private truncateToTokenLimit;
    /**
     * Compress context by removing redundant information.
     * Eliminates duplicate lines and empty lines.
     *
     * @param context - Context to compress
     * @returns Compressed context
     */
    compress(context: string): string;
    /**
     * Smart context selection - keep most relevant parts based on cursor position.
     * Uses relevance scoring to prioritize important lines.
     *
     * @param context - Full context text
     * @param cursorPosition - Current cursor position in characters
     * @param maxTokens - Maximum allowed tokens
     * @returns Most relevant context within token limit
     */
    selectRelevant(context: string, cursorPosition: number, maxTokens: number): string;
    /**
     * Calculate relevance score for a line based on multiple factors.
     *
     * @param line - Line content to score
     * @param lineIndex - Line index in the file
     * @param cursorLine - Current cursor line
     * @returns Relevance score (higher = more relevant)
     */
    private calculateRelevance;
}
//# sourceMappingURL=context-optimizer.d.ts.map