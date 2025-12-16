
/**
 * Cross-File Context Analyzer
 * Resolves imports and includes definitions from related files in context.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ContextAnalysisStrategy, ExtractedImport } from '../strategies/context-analysis-strategy.interface';
import { TypeScriptAnalysisStrategy } from '../strategies/typescript-analysis-strategy';
import { PythonAnalysisStrategy } from '../strategies/python-analysis-strategy';

export interface ImportInfo {
    importPath: string;
    symbols: string[];
    resolvedPath?: string;
    isRelative: boolean;
}

export interface CrossFileContext {
    imports: ImportInfo[];
    recentlyEditedFiles: string[];
    relatedDefinitions: Map<string, string>; // symbol -> definition code
}

export class CrossFileContextAnalyzer {
    private recentEdits: Map<string, number> = new Map(); // filepath -> timestamp
    private readonly MAX_RECENT_FILES = 5;
    private readonly MAX_CONTEXT_SIZE = 2000; // characters
    
    private strategies: ContextAnalysisStrategy[];
    private defaultStrategy: ContextAnalysisStrategy;

    constructor() {
        this.defaultStrategy = new TypeScriptAnalysisStrategy();
        this.strategies = [
            this.defaultStrategy,
            new PythonAnalysisStrategy()
        ];
    }
    
    private getStrategy(languageId: string): ContextAnalysisStrategy {
        return this.strategies.find(s => s.supports(languageId)) || this.defaultStrategy;
    }

    /**
     * Analyze cross-file context for the current position
     */
    public async analyze(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<CrossFileContext> {
        const imports = await this.extractImports(document);
        const recentFiles = this.getRecentlyEditedFiles();
        const definitions = await this.resolveDefinitions(imports, document);

        return {
            imports,
            recentlyEditedFiles: recentFiles,
            relatedDefinitions: definitions
        };
    }

    /**
     * Extract import statements from document
     */
    private async extractImports(document: vscode.TextDocument): Promise<ImportInfo[]> {
        const strategy = this.getStrategy(document.languageId);
        const extracted = strategy.extractImports(document.getText());
        
        const imports: ImportInfo[] = extracted.map(i => ({
            importPath: i.path,
            symbols: i.symbols,
            isRelative: i.isRelative,
            resolvedPath: this.resolveImportPath(document, i.path)
        }));

        return imports;
    }

    /**
     * Resolve import path to absolute file path
     */
    private resolveImportPath(document: vscode.TextDocument, importPath: string): string | undefined {
        if (!importPath.startsWith('.')) {
            // Node module, skip
            return undefined;
        }

        const documentDir = path.dirname(document.uri.fsPath);
        // Extensions could be part of strategy, but keeping unified list is fine for now
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', ''];
        
        for (const ext of extensions) {
            const fullPath = path.resolve(documentDir, importPath + ext);
            try {
                // Check if file exists (synchronous for simplicity)
                const uri = vscode.Uri.file(fullPath);
                return fullPath;
            } catch {
                continue;
            }
        }

        return undefined;
    }

    /**
     * Resolve definitions from imported symbols
     */
    private async resolveDefinitions(
        imports: ImportInfo[],
        currentDocument: vscode.TextDocument
    ): Promise<Map<string, string>> {
        const definitions = new Map<string, string>();
        let totalSize = 0;

        for (const importInfo of imports) {
            if (!importInfo.resolvedPath) continue;
            if (totalSize >= this.MAX_CONTEXT_SIZE) break;

            try {
                const uri = vscode.Uri.file(importInfo.resolvedPath);
                const doc = await vscode.workspace.openTextDocument(uri);
                const text = doc.getText();
                const strategy = this.getStrategy(doc.languageId);

                // Extract definitions for imported symbols
                // We use regex matching on top of Strategy classes/functions?
                // The strategy returns startLine, maybe endLine.
                // Or we can just use the definition extraction from strategy?
                // The strategy interface has extractClasses/Functions.
                // We can check if any matches the symbol.
                
                const classes = strategy.extractClasses(text);
                const functions = strategy.extractFunctions(text);
                const interfaces = strategy.extractInterfaces(text);
                
                for (const symbol of importInfo.symbols) {
                    // Try to find the symbol in extracted structures
                    const match = classes.find(c => c.name === symbol) || 
                                  functions.find(f => f.name === symbol) ||
                                  interfaces.find(i => i.name === symbol);
                    
                    if (match) {
                        // Extract content roughly
                        // We need endLine. If not available, take 20 lines?
                        const startLine = match.startLine;
                        const endLine = match.endLine || (startLine + 20);
                        const lines = text.split('\n').slice(startLine, endLine);
                        const definition = lines.join('\n');
                        
                        // Limit size
                        if (definition && (totalSize + definition.length) < this.MAX_CONTEXT_SIZE) {
                            definitions.set(symbol, definition);
                            totalSize += definition.length;
                        }
                    } else {
                        // Fallback to simpler regex if not found in structure (e.g. constants, types)
                        // Or if strategy supports it
                        const definition = this.extractDefinitionFallback(text, symbol, doc.languageId);
                         if (definition && (totalSize + definition.length) < this.MAX_CONTEXT_SIZE) {
                            definitions.set(symbol, definition);
                            totalSize += definition.length;
                        }
                    }
                }
            } catch (error) {
                // File not found or can't be read, skip
                continue;
            }
        }

        return definitions;
    }

    /**
     * Extract definition of a symbol from text (fallback)
     */
    private extractDefinitionFallback(text: string, symbol: string, languageId: string): string | null {
         // TypeScript/JavaScript consts/types
        if (['typescript', 'javascript', 'typescriptreact'].includes(languageId)) {
            const patterns = [
                new RegExp(`(export\\s+)?const\\s+${symbol}\\s*=\\s*[\\s\\S]{0,500}`, 'm'),
                 new RegExp(`(export\\s+)?type\\s+${symbol}\\s*=\\s*[\\s\\S]{0,500}`, 'm')
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return match[0].substring(0, 300); // Limit size
                }
            }
        }
        return null;
    }

    /**
     * Track document edit
     */
    public trackEdit(document: vscode.TextDocument): void {
        this.recentEdits.set(document.uri.fsPath, Date.now());

        // Keep only recent files
        if (this.recentEdits.size > this.MAX_RECENT_FILES * 2) {
            const sorted = Array.from(this.recentEdits.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, this.MAX_RECENT_FILES);
            
            this.recentEdits.clear();
            sorted.forEach(([path, time]) => this.recentEdits.set(path, time));
        }
    }

    /**
     * Get recently edited files
     */
    private getRecentlyEditedFiles(): string[] {
        return Array.from(this.recentEdits.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.MAX_RECENT_FILES)
            .map(([path]) => path);
    }
    
    // ... buildEnhancedContext, clear (unchanged)

    public buildEnhancedContext(
        baseContext: string,
        crossFileContext: CrossFileContext
    ): string {
        let enhanced = baseContext;

        if (crossFileContext.relatedDefinitions.size > 0) {
            enhanced += '\n\n// Related definitions from imports:\n';
            for (const [symbol, definition] of crossFileContext.relatedDefinitions) {
                enhanced += `\n// ${symbol}:\n${definition}\n`;
            }
        }

        return enhanced;
    }

    public clear(): void {
        this.recentEdits.clear();
    }
}
