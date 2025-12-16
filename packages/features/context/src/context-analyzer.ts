
import * as vscode from 'vscode';
import * as path from 'path';
import { ImportInfo, DependencyInfo, RelatedCodeBlock, CodingPattern, SymbolInfo } from './context-engine';
import { ContextAnalysisStrategy } from './strategies/context-analysis-strategy.interface';
import { ContextAnalysisRegistry } from './context-analysis-registry';
// Strategies imported here only to register defaults (can be moved to package activation)
import { TypeScriptAnalysisStrategy } from './strategies/typescript-analysis-strategy';
import { PythonAnalysisStrategy } from './strategies/python-analysis-strategy';

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
    
    private registry: ContextAnalysisRegistry;

    constructor() {
        this.registry = ContextAnalysisRegistry.getInstance();
        this.registerDefaultStrategies();
    }

    private registerDefaultStrategies() {
        // Register default strategies safely
        this.registry.register(new TypeScriptAnalysisStrategy());
        this.registry.register(new PythonAnalysisStrategy());
    }
    
    private getStrategy(languageId: string): ContextAnalysisStrategy {
        const strategy = this.registry.getStrategy(languageId);
        if (strategy) {
            return strategy;
        }
        // Fallback to TS or generic if possible, but better to return default
        // For now returning new instance of TS strategy as default (legacy behavior)
        // or we could assume the first registered strategy is default.
        // Let's keep it consistent:
        return this.registry.getStrategy('typescript') || new TypeScriptAnalysisStrategy();
    }

    async analyzeRelatedFiles(
        currentFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<RelatedFileContext[]> {
        const relatedFiles: RelatedFileContext[] = [];
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(currentFile);

        if (!workspaceFolder) {
            return relatedFiles;
        }

        for (const importInfo of imports.slice(0, 5)) {
            try {
                const resolvedPath = await this.resolveImportPath(
                    importInfo.module,
                    currentFile,
                    workspaceFolder,
                    undefined // Let it detect or use fallback
                );

                if (resolvedPath) {
                    const document = await vscode.workspace.openTextDocument(resolvedPath);
                    const symbols = await this.getFileSymbols(document);

                    const relevantCode = this.extractRelevantCode(
                        document,
                        importInfo.imports,
                        symbols
                    );

                    relatedFiles.push({
                        filePath: resolvedPath.fsPath,
                        symbols,
                        relevantCode,
                        similarity: 1.0 
                    });
                }
            } catch (error) {
                console.warn(`[ContextAnalyzer] Failed to analyze import ${importInfo.module}:`, error);
            }
        }

        return relatedFiles;
    }

    private async resolveImportPath(
        moduleName: string,
        currentFile: vscode.Uri,
        workspaceFolder: vscode.WorkspaceFolder,
        languageId?: string
    ): Promise<vscode.Uri | null> {
        // Use strategy extensions based on language or all extensions
        // If languageId is provided, look up that strategy.
        // If not, maybe check current file extension?
        // Legacy behavior defaulted to 'typescript'.
        
        let extensions: string[] = [];
        if (languageId) {
             const strategy = this.registry.getStrategy(languageId);
             if (strategy) extensions = strategy.getSupportedExtensions();
        } 
        
        if (extensions.length === 0) {
            // No specific language, try to infer from current file
             // Or get specific strategy for current file?
             // But for broader search, maybe use all supported extensions?
             // Legacy behavior used 'typescript' default.
             const strategy = this.getStrategy('typescript');
             extensions = strategy.getSupportedExtensions();
        }
        
        // Handle relative imports (./, ../)
        if (moduleName.startsWith('.')) {
            const currentDir = path.dirname(currentFile.fsPath);

            for (const ext of ['', ...extensions, '/index.ts', '/index.js']) { // index support?
                try {
                    const resolvedPath = path.resolve(currentDir, moduleName + ext);
                    const uri = vscode.Uri.file(resolvedPath);
                    await vscode.workspace.fs.stat(uri);
                    return uri;
                } catch {
                }
            }
        }

        // Handle workspace alias imports
        const srcPatterns = ['src/', '@/', '~/'];
        for (const pattern of srcPatterns) {
            if (moduleName.startsWith(pattern)) {
                const relativePath = moduleName.substring(pattern.length);

                for (const ext of ['', ...extensions, '/index.ts', '/index.js']) {
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
                    }
                }
            }
        }

        return null;
    }

    private async getFileSymbols(document: vscode.TextDocument): Promise<SymbolInfo[]> {
        const cacheKey = document.uri.toString();

        if (this.symbolCache.has(cacheKey)) {
            const cached = this.symbolCache.get(cacheKey)!;
            return Array.from(cached.values());
        }

        const symbols: SymbolInfo[] = [];
        try {
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (documentSymbols) {
                this.processSymbolsRecursive(documentSymbols, symbols, document);
            }

            const symbolMap = new Map<string, SymbolInfo>();
            symbols.forEach(s => symbolMap.set(s.name, s));

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
                    startLine + 20
                );

                const symbolCode = lines.slice(startLine, endLine + 1).join('\n');
                relevantCode.push(`// From ${path.basename(document.fileName)}\n${symbolCode}`);
            }
        }

        return relevantCode.join('\n\n').substring(0, 1000);
    }

    async buildProjectSymbolTable(
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<Map<string, SymbolInfo>> {
        const projectSymbols = new Map<string, SymbolInfo>();

        try {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'),
                '**/node_modules/**',
                100 
            );

            const batchSize = 10;
            for (let i = 0; i < files.length; i += batchSize) {
                const batch = files.slice(i, i + batchSize);

                await Promise.all(batch.map(async (file) => {
                    try {
                        const document = await vscode.workspace.openTextDocument(file);
                        const symbols = await this.getFileSymbols(document);

                        symbols.forEach(symbol => {
                            const qualifiedName = `${path.basename(file.fsPath)}:${symbol.name}`;
                            projectSymbols.set(qualifiedName, symbol);
                        });
                    } catch (error) {
                    }
                }));
            }
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to build project symbol table:', error);
        }

        return projectSymbols;
    }

    async findSimilarCode(
        codeSnippet: string,
        language: string,
        workspaceFolder: vscode.WorkspaceFolder
    ): Promise<RelatedCodeBlock[]> {
        const similarBlocks: RelatedCodeBlock[] = [];

        try {
            const normalizedSnippet = this.normalizeCode(codeSnippet);

            if (normalizedSnippet.length < 20) {
                return similarBlocks; 
            }
            
            const strategy = this.getStrategy(language);
            const extensions = strategy.getSupportedExtensions().map((e: string) => e.replace('.', '')).join(',');

            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, `**/*.{${extensions}}`),
                '**/node_modules/**',
                50 
            );

            for (const file of files) {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    const text = document.getText();
                    
                    // Use strategy for blocks
                    const blocks = strategy.extractCodeBlocks(text);

                    for (const block of blocks) {
                        const normalizedBlock = this.normalizeCode(block);
                        const similarity = this.calculateSimilarity(normalizedSnippet, normalizedBlock);

                        if (similarity > 0.7) {
                            similarBlocks.push({
                                code: block.substring(0, 500), 
                                filePath: file.fsPath,
                                similarity,
                                context: `Similar pattern found in ${path.basename(file.fsPath)}`
                            });
                        }
                    }
                } catch (error) {
                }
            }

            similarBlocks.sort((a, b) => b.similarity - a.similarity);
            return similarBlocks.slice(0, 3);
        } catch (error) {
            console.error('[ContextAnalyzer] Failed to find similar code:', error);
            return similarBlocks;
        }
    }

    async detectCodingPatterns(
        files: vscode.Uri[] 
    ): Promise<CodingPattern[]> {
        const patterns: Map<string, { count: number; examples: string[] }> = new Map();

        for (const file of files.slice(0, 50)) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();
                const strategy = this.getStrategy(document.languageId);

                const detected = strategy.detectPatterns(text);
                
                for (const d of detected) {
                    const existing = patterns.get(d.patternName) || { count: 0, examples: [] };
                     existing.count += d.matches.length;
                     
                     if (existing.examples.length < 3) {
                         d.matches.slice(0, 3 - existing.examples.length).forEach((m: string) => existing.examples.push(m));
                     }
                     patterns.set(d.patternName, existing);
                }
            } catch (error) {
            }
        }

        const result: CodingPattern[] = [];
        for (const [pattern, data] of patterns.entries()) {
            result.push({
                pattern,
                frequency: data.count,
                examples: data.examples.slice(0, 3) 
            });
        }

        result.sort((a, b) => b.frequency - a.frequency);
        return result.slice(0, 10);
    }

    private normalizeCode(code: string): string {
        return code
            .replace(/\/\/.*$/gm, '')           
            .replace(/\/\*[\s\S]*?\*\//g, '')   
            .replace(/\s+/g, ' ')               
            .trim()
            .toLowerCase();
    }
    
    private calculateSimilarity(code1: string, code2: string): number {
        const tokens1 = new Set(code1.split(/\s+/));
        const tokens2 = new Set(code2.split(/\s+/));

        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    async buildDependencyGraph(
        currentFile: vscode.Uri,
        imports: ImportInfo[]
    ): Promise<DependencyInfo[]> {
        const cacheKey = currentFile.toString();

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
                workspaceFolder,
                undefined // Let correct default inference happen
            );

            if (resolvedPath) {
                dependencies.push({
                    filePath: resolvedPath.fsPath,
                    symbols: importInfo.imports,
                    isExternal: false,
                    imports: []
                });
            } else {
                dependencies.push({
                    filePath: importInfo.module,
                    symbols: importInfo.imports,
                    isExternal: true,
                    imports: []
                });
            }
        }

        if (this.dependencyCache.size >= this.maxCacheSize) {
            const firstKey = this.dependencyCache.keys().next().value;
            if (firstKey) {
                this.dependencyCache.delete(firstKey);
            }
        }

        this.dependencyCache.set(cacheKey, dependencies);
        return dependencies;
    }

    clearCache(): void {
        this.symbolCache.clear();
        this.dependencyCache.clear();
    }

    getCacheStats(): { symbolCacheSize: number; dependencyCacheSize: number } {
        return {
            symbolCacheSize: this.symbolCache.size,
            dependencyCacheSize: this.dependencyCache.size
        };
    }
}

