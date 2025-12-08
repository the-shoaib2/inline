import * as vscode from 'vscode';

/**
 * Analyzes algorithmic complexity of code snippets.
 *
 * Uses heuristic analysis to detect:
 * - Nested loops (O(n^k) complexity)
 * - Recursion patterns (O(2^n) or O(n) with memoization)
 * - Sorting operations (O(n log n))
 * - Binary search (O(log n))
 * - Array allocations (space complexity)
 *
 * Provides optimization suggestions for detected patterns.
 */
export class ComplexityAnalyzer {

    /**
     * Analyze code for time and space complexity.
     * Uses pattern matching and heuristic analysis.
     *
     * @param code Code snippet to analyze
     * @param languageId Programming language (currently unused)
     * @returns Complexity analysis with explanations and suggestions
     */
    analyzeComplexity(code: string, languageId: string): {
        timeComplexity: string;
        spaceComplexity: string;
        explanation: string;
        suggestions: string[];
    } {
        const analysis = {
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1)',
            explanation: '',
            suggestions: [] as string[]
        };

        // Analyze loop nesting for polynomial complexity
        const nestedLoops = this.countNestedLoops(code);
        if (nestedLoops === 1) {
            analysis.timeComplexity = 'O(n)';
            analysis.explanation = 'Linear time - single loop iteration';
        } else if (nestedLoops === 2) {
            analysis.timeComplexity = 'O(n²)';
            analysis.explanation = 'Quadratic time - nested loops';
            analysis.suggestions.push('Consider using hash maps or sets to reduce to O(n)');
        } else if (nestedLoops >= 3) {
            analysis.timeComplexity = `O(n^${nestedLoops})`;
            analysis.explanation = `Polynomial time - ${nestedLoops} nested loops`;
            analysis.suggestions.push('High complexity - consider algorithmic optimization');
        }

        // Check for recursive patterns
        if (this.hasRecursion(code)) {
            if (this.hasMemoization(code)) {
                analysis.timeComplexity = 'O(n)';
                analysis.explanation += ' | Memoized recursion';
            } else {
                analysis.timeComplexity = 'O(2^n)';
                analysis.explanation += ' | Exponential - unmemoized recursion';
                analysis.suggestions.push('Add memoization to improve to O(n)');
            }
        }

        // Detect sorting algorithms
        if (this.hasSorting(code)) {
            analysis.timeComplexity = 'O(n log n)';
            analysis.explanation += ' | Sorting operation detected';
        }

        // Detect binary search patterns
        if (this.hasBinarySearch(code)) {
            analysis.timeComplexity = 'O(log n)';
            analysis.explanation = 'Logarithmic time - binary search';
        }

        // Calculate space complexity based on allocations
        if (this.hasArrayCreation(code)) {
            analysis.spaceComplexity = 'O(n)';
        }
        if (nestedLoops >= 2 && this.hasArrayCreation(code)) {
            analysis.spaceComplexity = 'O(n²)';
        }

        return analysis;
    }

    /**
     * Count maximum nesting level of loops in code.
     * Tracks for/while/do-while patterns and braces.
     */
    private countNestedLoops(code: string): number {
        let maxNesting = 0;
        let currentNesting = 0;

        const lines = code.split('\n');
        for (const line of lines) {
            if (/\b(for|while|forEach|map|filter|reduce)\b/.test(line)) {
                currentNesting++;
                maxNesting = Math.max(maxNesting, currentNesting);
            }
            if (line.includes('}')) {
                currentNesting = Math.max(0, currentNesting - 1);
            }
        }

        return maxNesting;
    }

    private hasRecursion(code: string): boolean {
        const funcMatch = code.match(/function\s+(\w+)|const\s+(\w+)\s*=.*function|def\s+(\w+)/);
        if (!funcMatch) return false;

        const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
        return new RegExp(`\\b${funcName}\\s*\\(`).test(code.substring(code.indexOf(funcName) + funcName.length));
    }

    private hasMemoization(code: string): boolean {
        return /memo|cache|dp\[/.test(code);
    }

    private hasSorting(code: string): boolean {
        return /\.sort\(|sorted\(|Arrays\.sort/.test(code);
    }

    private hasBinarySearch(code: string): boolean {
        return /binarySearch|mid\s*=.*\/\s*2|left.*right.*mid/.test(code);
    }

    private hasArrayCreation(code: string): boolean {
        return /new Array|new \w+\[|\[\]|list\(/.test(code);
    }

    /**
     * Generate complexity report
     */
    generateReport(code: string, languageId: string): string {
        const analysis = this.analyzeComplexity(code, languageId);

        let report = `# Complexity Analysis\n\n`;
        report += `**Time Complexity:** ${analysis.timeComplexity}\n\n`;
        report += `**Space Complexity:** ${analysis.spaceComplexity}\n\n`;
        report += `**Explanation:** ${analysis.explanation}\n\n`;

        if (analysis.suggestions.length > 0) {
            report += `## Optimization Suggestions\n\n`;
            analysis.suggestions.forEach((s, i) => {
                report += `${i + 1}. ${s}\n`;
            });
        }

        return report;
    }
}
