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

import { Logger } from '@platform/system/logger';

/**
 * Optimizes code context to minimize token usage while preserving essential information.
 * Applies multiple optimization strategies in order of increasing aggressiveness.
 */
export class ContextOptimizer {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ContextOptimizer');
    }

    /**
     * Optimize context to reduce token count using progressive strategies.
     *
     * @param context - Raw context string to optimize
     * @param maxTokens - Maximum allowed tokens (default: 2048)
     * @returns Optimized context string
     */
    public optimize(context: string, maxTokens: number = 2048): string {
        let optimized = context;

        // Apply optimizations in order of increasing aggressiveness
        optimized = this.removeExcessiveWhitespace(optimized);
        optimized = this.deduplicateImports(optimized);

        // Remove comments only if still over token limit
        const estimatedTokens = this.estimateTokens(optimized);
        if (estimatedTokens > maxTokens) {
            optimized = this.removeComments(optimized);
        }

        // Final truncation if necessary
        if (this.estimateTokens(optimized) > maxTokens) {
            optimized = this.truncateToTokenLimit(optimized, maxTokens);
        }

        this.logger.info(`Optimized context: ${context.length} → ${optimized.length} chars`);
        return optimized;
    }

    /**
     * Normalize excessive whitespace to reduce token count.
     *
     * @param text - Text to normalize
     * @returns Text with normalized whitespace
     */
    private removeExcessiveWhitespace(text: string): string {
        return text
            .replace(/\n{3,}/g, '\n\n') // Limit to 2 consecutive newlines
            .replace(/[ \t]{2,}/g, ' ') // Limit to 1 space
            .trim();
    }

    /**
     * Remove duplicate import statements to reduce redundancy.
     *
     * @param text - Text containing import statements
     * @returns Text with deduplicated imports
     */
    private deduplicateImports(text: string): string {
        const lines = text.split('\n');
        const imports = new Set<string>();
        const result: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('import ')) {
                if (!imports.has(line)) {
                    imports.add(line);
                    result.push(line);
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    /**
     * Remove comments to save tokens when context is too large.
     * Supports multiple comment styles (JS, TS, Python).
     *
     * @param text - Text to remove comments from
     * @returns Text without comments
     */
    private removeComments(text: string): string {
        return text
            .replace(/\/\/.*$/gm, '') // Single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
            .replace(/#.*$/gm, ''); // Python comments
    }

    /**
     * Estimate token count using character-based approximation.
     * Uses 1 token ≈ 4 characters as a rough estimate.
     *
     * @param text - Text to estimate tokens for
     * @returns Estimated token count
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Truncate text to fit within token limit.
     * Attempts to truncate at line boundaries for better readability.
     *
     * @param text - Text to truncate
     * @param maxTokens - Maximum allowed tokens
     * @returns Truncated text
     */
    private truncateToTokenLimit(text: string, maxTokens: number): string {
        const maxChars = maxTokens * 4; // Rough estimate
        if (text.length <= maxChars) {
            return text;
        }

        // Try to truncate at a line boundary
        const truncated = text.substring(0, maxChars);
        const lastNewline = truncated.lastIndexOf('\n');

        // Prefer truncation at line boundary if not too much loss
        if (lastNewline > maxChars * 0.8) {
            return truncated.substring(0, lastNewline);
        }

        return truncated;
    }

    /**
     * Compress context by removing redundant information.
     * Eliminates duplicate lines and empty lines.
     *
     * @param context - Context to compress
     * @returns Compressed context
     */
    public compress(context: string): string {
        let compressed = context;

        // Remove duplicate lines
        const lines = compressed.split('\n');
        const uniqueLines = [...new Set(lines)];
        compressed = uniqueLines.join('\n');

        // Remove empty lines
        compressed = compressed.replace(/^\s*\n/gm, '');

        return compressed;
    }

    /**
     * Smart context selection - keep most relevant parts based on cursor position.
     * Uses relevance scoring to prioritize important lines.
     *
     * @param context - Full context text
     * @param cursorPosition - Current cursor position in characters
     * @param maxTokens - Maximum allowed tokens
     * @returns Most relevant context within token limit
     */
    public selectRelevant(
        context: string,
        cursorPosition: number,
        maxTokens: number
    ): string {
        const lines = context.split('\n');
        const cursorLine = context.substring(0, cursorPosition).split('\n').length - 1;

        // Calculate relevance scores for each line
        const scored = lines.map((line, index) => ({
            line,
            index,
            score: this.calculateRelevance(line, index, cursorLine)
        }));

        // Sort by relevance (highest first)
        scored.sort((a, b) => b.score - a.score);

        // Take top lines until token limit
        const selected: typeof scored = [];
        let tokenCount = 0;

        // Accumulate selected lines until token limit reached
        for (const item of scored) {
            const lineTokens = this.estimateTokens(item.line);
            if (tokenCount + lineTokens <= maxTokens) {
                selected.push(item);
                tokenCount += lineTokens;
            } else {
                break;
            }
        }

        // Restore original line order for readability
        selected.sort((a, b) => a.index - b.index);

        return selected.map(s => s.line).join('\n');
    }

    /**
     * Calculate relevance score for a line based on multiple factors.
     *
     * @param line - Line content to score
     * @param lineIndex - Line index in the file
     * @param cursorLine - Current cursor line
     * @returns Relevance score (higher = more relevant)
     */
    private calculateRelevance(line: string, lineIndex: number, cursorLine: number): number {
        let score = 0;

        // Proximity to cursor (closer = higher score)
        const distance = Math.abs(lineIndex - cursorLine);
        score += Math.max(0, 100 - distance);

        // Non-empty lines get bonus
        if (line.trim().length > 0) {
            score += 50;
        }

        // Important keywords increase relevance
        const keywords = ['function', 'class', 'const', 'let', 'var', 'import', 'export', 'interface', 'type'];
        for (const keyword of keywords) {
            if (line.includes(keyword)) {
                score += 30;
                break;
            }
        }

        return score;
    }
}
