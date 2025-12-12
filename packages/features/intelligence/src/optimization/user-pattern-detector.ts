import { Logger } from '@inline/shared';

/**
 * User coding pattern with usage statistics.
 */
export interface UserPattern {
    pattern: string;
    frequency: number;
    lastUsed: number;
    context: string;
}

/**
 * Detected coding style preferences.
 */
export interface CodingStyle {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quotes: 'single' | 'double';
    semicolons: boolean;
    bracketStyle: 'same-line' | 'new-line';
}

/**
 * Analyzes and learns from user coding patterns.
 *
 * Responsibilities:
 * - Track frequently used code patterns
 * - Detect coding style preferences
 * - Maintain pattern frequency statistics
 * - Provide personalized completion suggestions
 * - Evict old patterns to manage memory
 */
export class UserPatternDetector {
    private logger: Logger;
    private patterns: Map<string, UserPattern> = new Map();
    private maxPatterns: number = 1000;

    constructor() {
        this.logger = new Logger('UserPatternDetector');
    }

    /**
     * Record when user accepts a completion suggestion.
     * Updates pattern frequency and timestamp.
     *
     * @param completion The accepted completion text
     * @param context Context where completion was used
     */
    public recordAcceptance(completion: string, context: string): void {
        const pattern = this.normalizePattern(completion);

        const existing = this.patterns.get(pattern);
        if (existing) {
            existing.frequency++;
            existing.lastUsed = Date.now();
        } else {
            if (this.patterns.size >= this.maxPatterns) {
                this.evictOldestPattern();
            }

            this.patterns.set(pattern, {
                pattern,
                frequency: 1,
                lastUsed: Date.now(),
                context
            });
        }
    }

    /**
     * Get most frequently used patterns.
     * Filters by minimum frequency and sorts by usage.
     *
     * @param minFrequency Minimum times pattern must be used
     * @returns Array of frequent patterns sorted by frequency
     */
    public getFrequentPatterns(minFrequency: number = 3): UserPattern[] {
        return Array.from(this.patterns.values())
            .filter(p => p.frequency >= minFrequency)
            .sort((a, b) => b.frequency - a.frequency);
    }

    /**
     * Analyze code to detect user's coding style.
     * Examines indentation, quotes, semicolons, and brackets.
     *
     * @param code Code sample to analyze
     * @returns Detected coding style preferences
     */
    public detectCodingStyle(code: string): CodingStyle {
        const lines = code.split('\n');

        // Detect indentation preference
        const indentedLines = lines.filter(l => /^\s+/.test(l));
        const tabLines = indentedLines.filter(l => l.startsWith('\t')).length;
        const spaceLines = indentedLines.filter(l => l.startsWith(' ')).length;

        const indentation = tabLines > spaceLines ? 'tabs' : 'spaces';

        // Detect indent size for space indentation
        let indentSize = 4;
        if (indentation === 'spaces') {
            const indents = indentedLines
                .map(l => l.match(/^ +/)?.[0].length || 0)
                .filter(n => n > 0);

            if (indents.length > 0) {
                const gcd = this.findGCD(indents);
                indentSize = gcd || 4;
            }
        }

        // Detect quotes
        const singleQuotes = (code.match(/'/g) || []).length;
        const doubleQuotes = (code.match(/"/g) || []).length;
        const quotes = singleQuotes > doubleQuotes ? 'single' : 'double';

        // Detect semicolons
        const statements = code.split('\n').filter(l => l.trim().length > 0).length;
        const semicolonCount = (code.match(/;/g) || []).length;
        const semicolons = semicolonCount / statements > 0.5;

        // Detect bracket style
        const sameLine = (code.match(/\)\s*{/g) || []).length;
        const newLine = (code.match(/\)\s*\n\s*{/g) || []).length;
        const bracketStyle = sameLine > newLine ? 'same-line' : 'new-line';

        return {
            indentation,
            indentSize,
            quotes,
            semicolons,
            bracketStyle
        };
    }

    /**
     * Get pattern suggestions based on context
     */
    public getSuggestions(context: string, limit: number = 5): string[] {
        const contextLower = context.toLowerCase();

        return Array.from(this.patterns.values())
            .filter(p => {
                const patternContext = p.context.toLowerCase();
                return patternContext.includes(contextLower) ||
                       contextLower.includes(patternContext);
            })
            .sort((a, b) => {
                // Sort by frequency and recency
                const freqScore = b.frequency - a.frequency;
                const recencyScore = b.lastUsed - a.lastUsed;
                return freqScore * 0.7 + recencyScore * 0.3;
            })
            .slice(0, limit)
            .map(p => p.pattern);
    }

    /**
     * Clear old patterns
     */
    public cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): void {
        const now = Date.now();
        const toDelete: string[] = [];

        for (const [key, pattern] of this.patterns.entries()) {
            if (now - pattern.lastUsed > maxAge) {
                toDelete.push(key);
            }
        }

        toDelete.forEach(key => this.patterns.delete(key));

        if (toDelete.length > 0) {
            this.logger.info(`Cleaned up ${toDelete.length} old patterns`);
        }
    }

    private normalizePattern(code: string): string {
        // Normalize whitespace and remove comments
        return code
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private evictOldestPattern(): void {
        let oldest: string | null = null;
        let oldestTime = Date.now();

        for (const [key, pattern] of this.patterns.entries()) {
            if (pattern.lastUsed < oldestTime) {
                oldest = key;
                oldestTime = pattern.lastUsed;
            }
        }

        if (oldest) {
            this.patterns.delete(oldest);
        }
    }

    private findGCD(numbers: number[]): number {
        const gcd = (a: number, b: number): number => {
            return b === 0 ? a : gcd(b, a % b);
        };

        return numbers.reduce((acc, n) => gcd(acc, n));
    }

    /**
     * Get statistics
     */
    public getStats(): {
        totalPatterns: number;
        topPatterns: UserPattern[];
        avgFrequency: number;
    } {
        const patterns = Array.from(this.patterns.values());
        const avgFrequency = patterns.length > 0
            ? patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length
            : 0;

        return {
            totalPatterns: patterns.length,
            topPatterns: patterns
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 10),
            avgFrequency
        };
    }
}
