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
import * as path from 'path';
import type {
    ImportInfo, DependencyInfo, RelatedCodeBlock, CodingPattern,
    SymbolInfo
} from './context-engine';

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
export class ContextAnalyzer {
    private symbolCache: Map<string, Map<string, SymbolInfo>> = new Map();
    private dependencyCache: Map<string, DependencyInfo[]> = new Map();
    private maxCacheSize: number = 500;

    /**
     * Analyze related files based on import dependencies.
     * Returns context for files directly imported by current file.
     */
    async analyzeRelatedFiles(
        currentFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<RelatedFileContext[]> {
        const relatedFiles: RelatedFileContext[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);

        if (!workspaceFolder) {
            return relatedFiles;
        }

        // Limit analysis to 5 most important imports for performance
        for (const importInfo of imports.slice(0, 5)) {
            try {
                const resolvedPath = await this.resolveImportPath(
                    importInfo.module,
                    currentFile,
                    workspaceFolder
                );

                if (resolvedPath) {
                    const document = await vscode.workspace.openTextDocument(resolvedPath);
                    const symbols = await this.getFileSymbols(document);

                    // Extract only code relevant to imported symbols
                    const relevantCode = this.extractRelevantCode(
                        document,
                        importInfo.imports,
                        symbols
                    );

                    relatedFiles.push({
                        filePath: resolvedPath.fsPath,
                        symbols,
                        relevantCode,
                        similarity: 1.0 // Direct import = maximum relevance
                    });
                }
            } catch (error) {
                console.warn(`[ContextAnalyzer] Failed to analyze import ${importInfo.module}:`, error);
            }
        }

        return relatedFiles;
    }

    /**
     * Resolve import module path to actual file URI.
     * Handles relative, absolute, and workspace alias imports.
     */
    private async resolveImportPath(
        moduleName: string,
        currentFile: vscode.Uri,
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<vscode.Uri | null> {
        // Handle relative imports (./, ../)
        if (moduleName.startsWith('.')) {
            const currentDir = path.dirname(currentFile.fsPath);
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];

            for (const ext of extensions) {
                try {
                    const resolvedPath = path.resolve(currentDir, moduleName + ext);
                    const uri = vscode.Uri.file(resolvedPath);
                    await vscode.workspace.fs.stat(uri);
                    return uri;
                } catch {
                    // Try next extension
                }
            }
        }

        // Handle workspace alias imports (src/, @/, ~/)
        const srcPatterns = ['src/', '@/', '~/'];
        for (const pattern of srcPatterns) {
            if (moduleName.startsWith(pattern)) {
                const relativePath = moduleName.substring(pattern.length);
                const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];

                for (const ext of extensions) {
                    try {
                        const resolvedPath = path.join(
                            workspaceFolder.uri.fsPath,
                            'src',
                            relativePath + ext
                        );
                        const uri = vscode.Uri.file(resolvedPath);
                        await vscode.workspace.fs.stat(uri);
                        return uri;
                    } catch {
                        // Try next extension
                    }
                }
            }
        }

        // Skip node_modules for now - too many files to analyze efficiently
        return null;
    }

    /**
     * Extract file symbols with caching for performance.
     * Uses VS Code's symbol provider to get functions, classes, etc.
     */
    private async getFileSymbols(document: vscode.TextDocument): Promise<SymbolInfo[]> {
        const cacheKey = document.uri.toString();

        // Return cached symbols if available
        if (this.symbolCache.has(cacheKey)) {
            const cached = this.symbolCache.get(cacheKey)!;
            return Array.from(cached.values());
        }

        // Extract symbols using VS Code's language services
        const symbols: SymbolInfo[] = [];
        try {
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (documentSymbols) {
                this.processSymbolsRecursive(documentSymbols, symbols, document);
            }

            // Cache symbols with size management
            const symbolMap = new Map<string, SymbolInfo>();
            symbols.forEach(s => symbolMap.set(s.name, s));

            // Evict oldest cache entry if size limit reached
            if (this.symbolCache.size >= this.maxCacheSize) {
                const firstKey = this.symbolCache.keys().next().value;
                if (firstKey) {
                    this.symbolCache.delete(firstKey);
                }
            }

            this.symbolCache.set(cacheKey, symbolMap);
        } catch (error) {
            console.warn('[ContextAnalyzer] Failed to get symbols:', error);
        }

        return symbols;
    }

    /**
     * Recursively process symbol hierarchy from VS Code.
     * Flattens nested symbol structure into a simple list.
     */
    private processSymbolsRecursive(
        symbols: vscode.DocumentSymbol[],
        result: SymbolInfo[],
        document: vscode.TextDocument
    ): void {
        for (const symbol of symbols) {
            result.push({
                name: symbol.name,
                kind: symbol.kind,
                location: new vscode.Location(document.uri, symbol.range),
                documentation: symbol.detail
            });

            // Process child symbols (methods, properties, etc.)
            if (symbol.children && symbol.children.length > 0) {
                this.processSymbolsRecursive(symbol.children, result, document);
            }
        }
    }

    /**
     * Extract relevant code sections for imported symbols.
     * Limits output to prevent context bloat.
     */
    private extractRelevantCode(
        document: vscode.TextDocument,
        importedSymbols: string[],
        allSymbols: SymbolInfo[]
    ): string {
        const relevantCode: string[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        for (const symbolName of importedSymbols) {
            const symbol = allSymbols.find(s => s.name === symbolName);
            if (symbol) {
                const startLine = symbol.location.range.start.line;
                // Limit to 20 lines per symbol to prevent large context
                const endLine = Math.min(
                    symbol.location.range.end.line,
                    startLine + 20
                );

                const symbolCode = lines.slice(startLine, endLine + 1).join('\n');
                relevantCode.push(`// From ${path.basename(document.fileName)}\n${symbolCode}`);
            }
        }

        // Limit total context size to 1000 characters
        return relevantCode.join('\n\n').substring(0, 1000);
    }

    /**
     * Build project-wide symbol table for global context.
     * Processes files in batches to avoid blocking the UI.
     */
    async buildProjectSymbolTable(
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<Map<string, SymbolInfo>> {
        const projectSymbols = new Map<string, SymbolInfo>();

        try {
            // Find all TypeScript/JavaScript files, excluding node_modules
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'),
                '**/node_modules/**',
                100 // Limit to 100 files for performance
            );

            // Process files in batches of 10 to prevent UI blocking
            const batchSize = 10;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);

                await Promise.all(batch.map(async (file) => {
                    try {
                        const document = await vscode.workspace.openTextDocument(file);
                        const symbols = await this.getFileSymbols(document);

                        symbols.forEach(symbol => {
                            // Use fully qualified name format: filename:symbol
                            const qualifiedName = `${path.basename(file.fsPath)}:${symbol.name}`;
                            projectSymbols.set(qualifiedName, symbol);
                        });
                    } catch (error) {
                        // Skip files that can't be opened (binary files, etc.)
                    }
                }));
            }
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to build project symbol table:', error);
        }

        return projectSymbols;
    }

    /**
     * Find similar code patterns using normalized text comparison.
     * Uses Jaccard similarity algorithm for pattern matching.
     */
    async findSimilarCode(
        codeSnippet: string,
        language: string,
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<RelatedCodeBlock[]> {
        const similarBlocks: RelatedCodeBlock[] = [];

        try {
            // Normalize code for accurate comparison
            const normalizedSnippet = this.normalizeCode(codeSnippet);

            if (normalizedSnippet.length < 20) {
                return similarBlocks; // Too short for meaningful matches
            }

            // Search in relevant files only
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, `**/*.{${this.getExtensions(language)}}`),
                '**/node_modules/**',
                50 // Limit search scope
            );

            for (const file of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();
                    const blocks = this.extractCodeBlocks(text, language);

                    for (const block of blocks) {
                        const normalizedBlock = this.normalizeCode(block);
                        const similarity = this.calculateSimilarity(normalizedSnippet, normalizedBlock);

                        // Only include high-quality matches (70%+ similarity)
                        if (similarity > 0.7) {
                            similarBlocks.push({
                                code: block.substring(0, 500), // Limit output size
                                filePath: file.fsPath,
                                similarity,
                                context: `Similar pattern found in ${path.basename(file.fsPath)}`
                            });
                        }
                    }
                } catch (error) {
                    // Skip files that can't be opened
                }
            }

            // Return top 3 most similar matches
            similarBlocks.sort((a, b) => b.similarity - a.similarity);
            return similarBlocks.slice(0, 3);
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to find similar code:', error);
            return similarBlocks;
        }
    }

    /**
     * Detect common coding patterns across project files.
     * Identifies frequently used constructs for style analysis.
     */
    async detectCodingPatterns(
        files: vscode.Uri[]
    ): Promise<CodingPattern[]> {
        const patterns: Map<string, { count: number; examples: string[] }> = new Map();

        // Analyze up to 50 files for performance
        for (const file of files.slice(0, 50)) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();

                // Detect common JavaScript/TypeScript patterns
                this.detectPattern(text, /async\s+function/g, 'async-functions', patterns);
                this.detectPattern(text, /\.map\(/g, 'array-map', patterns);
                this.detectPattern(text, /\.filter\(/g, 'array-filter', patterns);
                this.detectPattern(text, /\.reduce\(/g, 'array-reduce', patterns);
                this.detectPattern(text, /try\s*{[\s\S]*?}\s*catch/g, 'try-catch', patterns);
                this.detectPattern(text, /Promise\.all/g, 'promise-all', patterns);
                this.detectPattern(text, /await\s+/g, 'await-usage', patterns);
                this.detectPattern(text, /export\s+(?:default\s+)?(?:class|function|const)/g, 'exports', patterns);
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        // Convert pattern data to structured format
        const result: CodingPattern[] = [];
        for (const [pattern, data] of patterns.entries()) {
            result.push({
                pattern,
                frequency: data.count,
                examples: data.examples.slice(0, 3) // Keep top 3 examples
            });
        }

        // Return top 10 most frequent patterns
        result.sort((a, b) => b.frequency - a.frequency);
        return result.slice(0, 10);
    }

    /**
     * Detect specific pattern occurrences in code text.
     * Tracks frequency and stores example snippets.
     */
    private detectPattern(
        text: string,
        regex: RegExp,
        patternName: string,
        patterns: Map<string, { count: number; examples: string[] }>
    ): void {
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
            const existing = patterns.get(patternName) || { count: 0, examples: [] };
            existing.count += matches.length;

            // Store up to 3 examples per pattern to avoid memory bloat
            if (existing.examples.length < 3) {
                matches.slice(0, 3 - existing.examples.length).forEach(match => {
                    existing.examples.push(match);
                });
            }

            patterns.set(patternName, existing);
        }
    }

    /**
     * Normalize code by removing comments and standardizing whitespace.
     * Enables accurate pattern matching across different code styles.
     */
    private normalizeCode(code: string): string {
        return code
            .replace(/\/\/.*$/gm, '')           // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove multi-line comments
            .replace(/\s+/g, ' ')               // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    /**
     * Extract logical code blocks from file text.
     * Splits by function/class boundaries for pattern analysis.
     */
    private extractCodeBlocks(text: string, language: string): string[] {
        const blocks: string[] = [];

        // JavaScript/TypeScript: split by major declarations
        if (language === 'typescript' || language === 'javascript') {
            const functionRegex = /(?:export\s+)?(?:async\s+)?(?:function|const|let|var)\s+\w+[\s\S]*?(?=\n(?:export\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type)\s+|\n*$)/g;
            const matches = text.match(functionRegex);
            if (matches) {
                blocks.push(...matches);
            }
        }

        return blocks;
    }

    /**
     * Calculate Jaccard similarity between two code snippets.
     * Measures token overlap for pattern matching accuracy.
     */
    private calculateSimilarity(code1: string, code2: string): number {
        // Split into tokens for comparison
        const tokens1 = new Set(code1.split(/\s+/));
        const tokens2 = new Set(code2.split(/\s+/));

        // Calculate intersection and union
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        // Jaccard similarity: |intersection| / |union|
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Get file extensions for supported languages.
     */
    private getExtensions(language: string): string {
        const extensionMap: Record<string, string> = {
            'typescript': 'ts,tsx',
            'javascript': 'js,jsx',
            'python': 'py',
            'java': 'java',
            'go': 'go',
            'rust': 'rs'
        };

        return extensionMap[language] || 'ts,js';
    }

    /**
     * Build dependency graph for import analysis.
     * Tracks both internal and external dependencies.
     */
    async buildDependencyGraph(
        currentFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<DependencyInfo[]> {
        const cacheKey = currentFile.toString();

        // Return cached dependencies if available
        if (this.dependencyCache.has(cacheKey)) {
            return this.dependencyCache.get(cacheKey)!;
        }

        const dependencies: DependencyInfo[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);

        if (!workspaceFolder) {
            return dependencies;
        }

        for (const importInfo of imports) {
            const resolvedPath = await this.resolveImportPath(
                importInfo.module,
                currentFile,
                workspaceFolder
            );

            if (resolvedPath) {
                // Internal dependency (workspace file)
                dependencies.push({
                    filePath: resolvedPath.fsPath,
                    symbols: importInfo.imports,
                    isExternal: false,
                    imports: []
                });
            } else {
                // External dependency (node_modules or package)
                dependencies.push({
                    filePath: importInfo.module,
                    symbols: importInfo.imports,
                    isExternal: true,
                    imports: []
                });
            }
        }

        // Cache with size management
        if (this.dependencyCache.size >= this.maxCacheSize) {
            const firstKey = this.dependencyCache.keys().next().value;
            if (firstKey) {
                this.dependencyCache.delete(firstKey);
            }
        }

        this.dependencyCache.set(cacheKey, dependencies);
        return dependencies;
    }

    /**
     * Clear all analysis caches.
     */
    clearCache(): void {
        this.symbolCache.clear();
        this.dependencyCache.clear();
    }

    /**
     * Get cache statistics for monitoring.
     */
    getCacheStats(): { symbolCacheSize: number; dependencyCacheSize: number } {
        return {
            symbolCacheSize: this.symbolCache.size,
            dependencyCacheSize: this.dependencyCache.size
        };
    }
}
