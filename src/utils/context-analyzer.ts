// Context Analyzer - Multi-file context analysis and dependency tracking
// Provides project-wide understanding for accurate code generation

import * as vscode from 'vscode';
import * as path from 'path';
import type {
    ImportInfo, DependencyInfo, RelatedCodeBlock, CodingPattern,
    SymbolInfo, FunctionInfo, ClassInfo
} from '../core/context-engine';

export interface RelatedFileContext {
    filePath: string;
    symbols: SymbolInfo[];
    relevantCode: string;
    similarity: number;
}

export class ContextAnalyzer {
    private symbolCache: Map<string, Map<string, SymbolInfo>> = new Map();
    private dependencyCache: Map<string, DependencyInfo[]> = new Map();
    private maxCacheSize: number = 500;

    /**
     * Analyze related files based on imports
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

        for (const importInfo of imports.slice(0, 5)) { // Limit to 5 most important imports
            try {
                const resolvedPath = await this.resolveImportPath(
                    importInfo.module,
                    currentFile,
                    workspaceFolder
                );

                if (resolvedPath) {
                    const document = await vscode.workspace.openTextDocument(resolvedPath);
                    const symbols = await this.getFileSymbols(document);
                    
                    // Extract relevant code (exported symbols that match imports)
                    const relevantCode = this.extractRelevantCode(
                        document,
                        importInfo.imports,
                        symbols
                    );

                    relatedFiles.push({
                        filePath: resolvedPath.fsPath,
                        symbols,
                        relevantCode,
                        similarity: 1.0 // Direct import = high relevance
                    });
                }
            } catch (error) {
                console.warn(`[ContextAnalyzer] Failed to analyze import ${importInfo.module}:`, error);
            }
        }

        return relatedFiles;
    }

    /**
     * Resolve import path to actual file URI
     */
    private async resolveImportPath(
        moduleName: string,
        currentFile: vscode.Uri,
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<vscode.Uri | null> {
        // Handle relative imports
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

        // Handle absolute imports (from src/, @/, etc.)
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

        // Handle node_modules (skip for now - too many files)
        return null;
    }

    /**
     * Get symbols from a file (with caching)
     */
    private async getFileSymbols(document: vscode.TextDocument): Promise<SymbolInfo[]> {
        const cacheKey = document.uri.toString();
        
        // Check cache
        if (this.symbolCache.has(cacheKey)) {
            const cached = this.symbolCache.get(cacheKey)!;
            return Array.from(cached.values());
        }

        // Get symbols from VS Code
        const symbols: SymbolInfo[] = [];
        try {
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (documentSymbols) {
                this.processSymbolsRecursive(documentSymbols, symbols, document);
            }

            // Cache symbols
            const symbolMap = new Map<string, SymbolInfo>();
            symbols.forEach(s => symbolMap.set(s.name, s));
            
            // Manage cache size
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
     * Process symbols recursively
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

            if (symbol.children && symbol.children.length > 0) {
                this.processSymbolsRecursive(symbol.children, result, document);
            }
        }
    }

    /**
     * Extract relevant code from a file based on imported symbols
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
                const endLine = Math.min(
                    symbol.location.range.end.line,
                    startLine + 20 // Limit to 20 lines per symbol
                );

                const symbolCode = lines.slice(startLine, endLine + 1).join('\n');
                relevantCode.push(`// From ${path.basename(document.fileName)}\n${symbolCode}`);
            }
        }

        return relevantCode.join('\n\n').substring(0, 1000); // Limit total size
    }

    /**
     * Build project-wide symbol table
     */
    async buildProjectSymbolTable(
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<Map<string, SymbolInfo>> {
        const projectSymbols = new Map<string, SymbolInfo>();

        try {
            // Find all TypeScript/JavaScript files
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'),
                '**/node_modules/**',
                100 // Limit to 100 files for performance
            );

            // Process files in batches
            const batchSize = 10;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);
                
                await Promise.all(batch.map(async (file) => {
                    try {
                        const document = await vscode.workspace.openTextDocument(file);
                        const symbols = await this.getFileSymbols(document);
                        
                        symbols.forEach(symbol => {
                            // Use fully qualified name (file:symbol)
                            const qualifiedName = `${path.basename(file.fsPath)}:${symbol.name}`;
                            projectSymbols.set(qualifiedName, symbol);
                        });
                    } catch (error) {
                        // Skip files that can't be opened
                    }
                }));
            }
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to build project symbol table:', error);
        }

        return projectSymbols;
    }

    /**
     * Find similar code patterns in the project
     */
    async findSimilarCode(
        codeSnippet: string,
        language: string,
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<RelatedCodeBlock[]> {
        const similarBlocks: RelatedCodeBlock[] = [];

        try {
            // Normalize the code snippet for comparison
            const normalizedSnippet = this.normalizeCode(codeSnippet);
            
            if (normalizedSnippet.length < 20) {
                return similarBlocks; // Too short to find meaningful matches
            }

            // Search for similar code in workspace
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, `**/*.{${this.getExtensions(language)}}`),
                '**/node_modules/**',
                50 // Limit search
            );

            for (const file of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();
                    const blocks = this.extractCodeBlocks(text, language);

                    for (const block of blocks) {
                        const normalizedBlock = this.normalizeCode(block);
                        const similarity = this.calculateSimilarity(normalizedSnippet, normalizedBlock);

                        if (similarity > 0.7) { // 70% similarity threshold
                            similarBlocks.push({
                                code: block.substring(0, 500), // Limit size
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

            // Sort by similarity (highest first)
            similarBlocks.sort((a, b) => b.similarity - a.similarity);
            
            // Return top 3 matches
            return similarBlocks.slice(0, 3);
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to find similar code:', error);
            return similarBlocks;
        }
    }

    /**
     * Detect coding patterns in the project
     */
    async detectCodingPatterns(
        files: vscode.Uri[]
    ): Promise<CodingPattern[]> {
        const patterns: Map<string, { count: number; examples: string[] }> = new Map();

        for (const file of files.slice(0, 50)) { // Limit to 50 files
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();

                // Detect common patterns
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

        // Convert to CodingPattern array
        const result: CodingPattern[] = [];
        for (const [pattern, data] of patterns.entries()) {
            result.push({
                pattern,
                frequency: data.count,
                examples: data.examples.slice(0, 3) // Top 3 examples
            });
        }

        // Sort by frequency
        result.sort((a, b) => b.frequency - a.frequency);
        
        return result.slice(0, 10); // Top 10 patterns
    }

    /**
     * Detect a specific pattern in code
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
            
            // Add examples (limit to prevent memory issues)
            if (existing.examples.length < 3) {
                matches.slice(0, 3 - existing.examples.length).forEach(match => {
                    existing.examples.push(match);
                });
            }
            
            patterns.set(patternName, existing);
        }
    }

    /**
     * Normalize code for comparison
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
     * Extract code blocks from text
     */
    private extractCodeBlocks(text: string, language: string): string[] {
        const blocks: string[] = [];
        
        // Split by function/class definitions
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
     * Calculate similarity between two code snippets
     */
    private calculateSimilarity(code1: string, code2: string): number {
        // Simple Jaccard similarity
        const tokens1 = new Set(code1.split(/\s+/));
        const tokens2 = new Set(code2.split(/\s+/));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Get file extensions for a language
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
     * Build dependency graph for a file
     */
    async buildDependencyGraph(
        currentFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<DependencyInfo[]> {
        const cacheKey = currentFile.toString();
        
        // Check cache
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
                dependencies.push({
                    filePath: resolvedPath.fsPath,
                    symbols: importInfo.imports,
                    isExternal: false
                });
            } else {
                // External dependency (node_modules)
                dependencies.push({
                    filePath: importInfo.module,
                    symbols: importInfo.imports,
                    isExternal: true
                });
            }
        }

        // Cache dependencies
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
     * Clear all caches
     */
    clearCache(): void {
        this.symbolCache.clear();
        this.dependencyCache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { symbolCacheSize: number; dependencyCacheSize: number } {
        return {
            symbolCacheSize: this.symbolCache.size,
            dependencyCacheSize: this.dependencyCache.size
        };
    }
}
