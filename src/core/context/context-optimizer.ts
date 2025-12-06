import { Logger } from '../../system/logger';

/**
 * Context optimizer for reducing token overhead
 */
export class ContextOptimizer {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('ContextOptimizer');
    }

    /**
     * Optimize context to reduce token count
     */
    public optimize(context: string, maxTokens: number = 2048): string {
        let optimized = context;

        // 1. Remove excessive whitespace
        optimized = this.removeExcessiveWhitespace(optimized);

        // 2. Deduplicate imports
        optimized = this.deduplicateImports(optimized);

        // 3. Remove comments if over token limit
        const estimatedTokens = this.estimateTokens(optimized);
        if (estimatedTokens > maxTokens) {
            optimized = this.removeComments(optimized);
        }

        // 4. Truncate if still over limit
        if (this.estimateTokens(optimized) > maxTokens) {
            optimized = this.truncateToTokenLimit(optimized, maxTokens);
        }

        this.logger.info(`Optimized context: ${context.length} → ${optimized.length} chars`);
        return optimized;
    }

    /**
     * Remove excessive whitespace
     */
    private removeExcessiveWhitespace(text: string): string {
        return text
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/[ \t]{2,}/g, ' ') // Max 1 space
            .trim();
    }

    /**
     * Deduplicate import statements
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
     * Remove comments to save tokens
     */
    private removeComments(text: string): string {
        return text
            .replace(/\/\/.*$/gm, '') // Single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Multi-line comments
            .replace(/#.*$/gm, ''); // Python comments
    }

    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens(text: string): number {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
     * Truncate to token limit
     */
    private truncateToTokenLimit(text: string, maxTokens: number): string {
        const maxChars = maxTokens * 4; // Rough estimate
        if (text.length <= maxChars) {
            return text;
        }

        // Try to truncate at a line boundary
        const truncated = text.substring(0, maxChars);
        const lastNewline = truncated.lastIndexOf('\n');
        
        if (lastNewline > maxChars * 0.8) {
            return truncated.substring(0, lastNewline);
        }

        return truncated;
    }

    /**
     * Compress context by removing redundant information
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
     * Smart context selection - keep most relevant parts
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

        // Sort by relevance
        scored.sort((a, b) => b.score - a.score);

        // Take top lines until token limit
        let selected: typeof scored = [];
        let tokenCount = 0;

        for (const item of scored) {
            const lineTokens = this.estimateTokens(item.line);
            if (tokenCount + lineTokens <= maxTokens) {
                selected.push(item);
                tokenCount += lineTokens;
            } else {
                break;
            }
        }

        // Sort back to original order
        selected.sort((a, b) => a.index - b.index);

        return selected.map(s => s.line).join('\n');
    }

    /**
     * Calculate relevance score for a line
     */
    private calculateRelevance(line: string, lineIndex: number, cursorLine: number): number {
        let score = 0;

        // Proximity to cursor
        const distance = Math.abs(lineIndex - cursorLine);
        score += Math.max(0, 100 - distance);

        // Code vs whitespace
        if (line.trim().length > 0) {
            score += 50;
        }

        // Important keywords
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
