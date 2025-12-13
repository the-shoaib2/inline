/**
 * Multi-file context analysis and dependency tracking for project-wide understanding.
 *
 * Features:
 * - Import resolution and related file analysis
 * - Symbol extraction and caching
 * - Code pattern detection
 * - Similar code finding
 * - Dependency graph construction
 */
import * as vscode from 'vscode';
import type { ImportInfo, DependencyInfo, RelatedCodeBlock, CodingPattern, SymbolInfo } from '@inline/context/context-engine';
/**
 * Related file context with similarity scoring.
 */
export interface RelatedFileContext {
    filePath: string;
    symbols: SymbolInfo[];
    relevantCode: string;
    similarity: number;
}
/**
 * Analyzes project context for intelligent code generation.
 * Provides import resolution, symbol analysis, and pattern detection.
 */
export declare class ContextAnalyzer {
    private symbolCache;
    private dependencyCache;
    private maxCacheSize;
    /**
     * Analyze related files based on import dependencies.
     * Returns context for files directly imported by current file.
     */
    analyzeRelatedFiles(currentFile: vscode.Uri, imports: ImportInfo[]): Promise<RelatedFileContext[]>;
    /**
     * Resolve import module path to actual file URI.
     * Handles relative, absolute, and workspace alias imports.
     */
    private resolveImportPath;
    /**
     * Extract file symbols with caching for performance.
     * Uses VS Code's symbol provider to get functions, classes, etc.
     */
    private getFileSymbols;
    /**
     * Recursively process symbol hierarchy from VS Code.
     * Flattens nested symbol structure into a simple list.
     */
    private processSymbolsRecursive;
    /**
     * Extract relevant code sections for imported symbols.
     * Limits output to prevent context bloat.
     */
    private extractRelevantCode;
    /**
     * Build project-wide symbol table for global context.
     * Processes files in batches to avoid blocking the UI.
     */
    buildProjectSymbolTable(workspaceFolder: vscode.WorkspaceFolder): Promise<Map<string, SymbolInfo>>;
    /**
     * Find similar code patterns using normalized text comparison.
     * Uses Jaccard similarity algorithm for pattern matching.
     */
    findSimilarCode(codeSnippet: string, language: string, workspaceFolder: vscode.WorkspaceFolder): Promise<RelatedCodeBlock[]>;
    /**
     * Detect common coding patterns across project files.
     * Identifies frequently used constructs for style analysis.
     */
    detectCodingPatterns(files: vscode.Uri[]): Promise<CodingPattern[]>;
    /**
     * Detect specific pattern occurrences in code text.
     * Tracks frequency and stores example snippets.
     */
    private detectPattern;
    /**
     * Normalize code by removing comments and standardizing whitespace.
     * Enables accurate pattern matching across different code styles.
     */
    private normalizeCode;
    /**
     * Extract logical code blocks from file text.
     * Splits by function/class boundaries for pattern analysis.
     */
    private extractCodeBlocks;
    /**
     * Calculate Jaccard similarity between two code snippets.
     * Measures token overlap for pattern matching accuracy.
     */
    private calculateSimilarity;
    /**
     * Get file extensions for supported languages.
     */
    private getExtensions;
    /**
     * Build dependency graph for import analysis.
     * Tracks both internal and external dependencies.
     */
    buildDependencyGraph(currentFile: vscode.Uri, imports: ImportInfo[]): Promise<DependencyInfo[]>;
    /**
     * Clear all analysis caches.
     */
    clearCache(): void;
    /**
     * Get cache statistics for monitoring.
     */
    getCacheStats(): {
        symbolCacheSize: number;
        dependencyCacheSize: number;
    };
}
//# sourceMappingURL=context-analyzer.d.ts.map