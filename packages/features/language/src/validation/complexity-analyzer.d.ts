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
export declare class ComplexityAnalyzer {
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
    };
    /**
     * Count maximum nesting level of loops in code.
     * Tracks for/while/do-while patterns and braces.
     */
    private countNestedLoops;
    private hasRecursion;
    private hasMemoization;
    private hasSorting;
    private hasBinarySearch;
    private hasArrayCreation;
    /**
     * Generate complexity report
     */
    generateReport(code: string, languageId: string): string;
}
//# sourceMappingURL=complexity-analyzer.d.ts.map