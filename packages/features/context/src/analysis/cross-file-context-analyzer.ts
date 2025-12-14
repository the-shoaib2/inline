/**
 * Cross-File Context Analyzer
 * Resolves imports and includes definitions from related files in context.
 */

import * as vscode from 'vscode';
import * as path from 'path';

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
        const imports: ImportInfo[] = [];
        const text = document.getText();
        const languageId = document.languageId;

        // TypeScript/JavaScript imports
        if (languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact' || languageId === 'javascriptreact') {
            // import { foo, bar } from './module'
            const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
            let match;

            while ((match = importRegex.exec(text)) !== null) {
                const symbols = match[1] 
                    ? match[1].split(',').map(s => s.trim())
                    : [match[2]];
                const importPath = match[3];

                imports.push({
                    importPath,
                    symbols,
                    isRelative: importPath.startsWith('.'),
                    resolvedPath: this.resolveImportPath(document, importPath)
                });
            }
        }

        // Python imports
        if (languageId === 'python') {
            // from module import foo, bar
            const fromImportRegex = /from\s+([\w.]+)\s+import\s+([^#\n]+)/g;
            let match;

            while ((match = fromImportRegex.exec(text)) !== null) {
                const importPath = match[1];
                const symbols = match[2].split(',').map(s => s.trim());

                imports.push({
                    importPath,
                    symbols,
                    isRelative: importPath.startsWith('.'),
                    resolvedPath: this.resolveImportPath(document, importPath)
                });
            }
        }

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

                // Extract definitions for imported symbols
                for (const symbol of importInfo.symbols) {
                    const definition = this.extractDefinition(text, symbol, doc.languageId);
                    if (definition && (totalSize + definition.length) < this.MAX_CONTEXT_SIZE) {
                        definitions.set(symbol, definition);
                        totalSize += definition.length;
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
     * Extract definition of a symbol from text
     */
    private extractDefinition(text: string, symbol: string, languageId: string): string | null {
        // TypeScript/JavaScript
        if (languageId === 'typescript' || languageId === 'javascript') {
            // Function/class/interface/type definition
            const patterns = [
                new RegExp(`(export\\s+)?(function|class|interface|type|const|let|var)\\s+${symbol}[\\s\\S]{0,500}`, 'm'),
                new RegExp(`(export\\s+)?const\\s+${symbol}\\s*=\\s*[\\s\\S]{0,500}`, 'm')
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return match[0].substring(0, 300); // Limit size
                }
            }
        }

        // Python
        if (languageId === 'python') {
            const patterns = [
                new RegExp(`(def|class)\\s+${symbol}[\\s\\S]{0,500}`, 'm')
            ];

            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    return match[0].substring(0, 300);
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

    /**
     * Build enhanced context string with cross-file information
     */
    public buildEnhancedContext(
        baseContext: string,
        crossFileContext: CrossFileContext
    ): string {
        let enhanced = baseContext;

        // Add imported definitions
        if (crossFileContext.relatedDefinitions.size > 0) {
            enhanced += '\n\n// Related definitions from imports:\n';
            for (const [symbol, definition] of crossFileContext.relatedDefinitions) {
                enhanced += `\n// ${symbol}:\n${definition}\n`;
            }
        }

        return enhanced;
    }

    /**
     * Clear tracking data
     */
    public clear(): void {
        this.recentEdits.clear();
    }
}
