import * as vscode from 'vscode';
import { Symbol, SymbolIndexEntry, WorkspaceSymbolIndex, SymbolReference } from '../models/symbol';
import { SymbolExtractor } from './symbol-extractor';

/**
 * Manages symbol indexing for the workspace
 */
export class SymbolIndex {
    private index: WorkspaceSymbolIndex;
    private indexing: boolean = false;

    constructor(private symbolExtractor: SymbolExtractor) {
        this.index = {
            symbols: new Map(),
            fileIndex: new Map(),
            lastIndexTime: Date.now(),
        };
    }

    /**
     * Index a single file
     */
    async indexFile(document: vscode.TextDocument): Promise<void> {
        const symbols = await this.symbolExtractor.extractSymbols(document);
        const fileKey = document.uri.toString();

        // Update file index
        this.index.fileIndex.set(fileKey, symbols);

        // Update symbol index
        for (const symbol of symbols) {
            const entries = this.index.symbols.get(symbol.name) || [];
            const entry: SymbolIndexEntry = {
                symbol,
                lastModified: Date.now(),
                fileUri: document.uri,
            };
            entries.push(entry);
            this.index.symbols.set(symbol.name, entries);
        }

        this.index.lastIndexTime = Date.now();
    }

    /**
     * Remove file from index
     */
    removeFile(uri: vscode.Uri): void {
        const fileKey = uri.toString();
        const symbols = this.index.fileIndex.get(fileKey);

        if (symbols) {
            // Remove from symbol index
            for (const symbol of symbols) {
                const entries = this.index.symbols.get(symbol.name);
                if (entries) {
                    const filtered = entries.filter(e => e.fileUri.toString() !== fileKey);
                    if (filtered.length > 0) {
                        this.index.symbols.set(symbol.name, filtered);
                    } else {
                        this.index.symbols.delete(symbol.name);
                    }
                }
            }

            // Remove from file index
            this.index.fileIndex.delete(fileKey);
        }
    }

    /**
     * Find symbol by name
     */
    findSymbol(name: string): SymbolIndexEntry[] {
        return this.index.symbols.get(name) || [];
    }

    /**
     * Find symbols in file
     */
    findSymbolsInFile(uri: vscode.Uri): Symbol[] {
        return this.index.fileIndex.get(uri.toString()) || [];
    }

    /**
     * Find all references to a symbol
     */
    async findReferences(
        symbol: Symbol,
        includeDeclaration: boolean = true
    ): Promise<SymbolReference[]> {
        const references: SymbolReference[] = [];

        // Add definition if requested
        if (includeDeclaration) {
            references.push({
                location: symbol.location,
                isDefinition: true,
                isWrite: false,
                context: '',
            });
        }

        // Search all indexed files
        for (const [fileUri, symbols] of this.index.fileIndex) {
            // TODO: Implement reference finding in file content
            // This would require parsing and searching for identifier usage
        }

        return references;
    }

    /**
     * Clear the entire index
     */
    clear(): void {
        this.index.symbols.clear();
        this.index.fileIndex.clear();
        this.index.lastIndexTime = Date.now();
    }

    /**
     * Get index statistics
     */
    getStats(): { symbolCount: number; fileCount: number } {
        let symbolCount = 0;
        for (const entries of this.index.symbols.values()) {
            symbolCount += entries.length;
        }

        return {
            symbolCount,
            fileCount: this.index.fileIndex.size,
        };
    }
}
