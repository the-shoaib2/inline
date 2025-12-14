import * as vscode from 'vscode';
import { SymbolIndex } from '../services/symbol-index';
import { SymbolExtractor } from '../services/symbol-extractor';

/**
 * Provides "Go to Definition" functionality
 */
export class InlineDefinitionProvider implements vscode.DefinitionProvider {
    constructor(
        private symbolIndex: SymbolIndex,
        private symbolExtractor: SymbolExtractor
    ) {}

    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | vscode.DefinitionLink[] | undefined> {
        // Get the word at the cursor position
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);

        // First, check if this is a local symbol in the current file
        const localSymbol = await this.findLocalDefinition(document, word, position);
        if (localSymbol) {
            return new vscode.Location(localSymbol.location.uri, localSymbol.location.range);
        }

        // Search in the symbol index
        const symbolEntries = this.symbolIndex.findSymbol(word);
        if (symbolEntries.length === 0) {
            return undefined;
        }

        // If multiple definitions found, return all of them
        if (symbolEntries.length === 1) {
            const entry = symbolEntries[0];
            return new vscode.Location(entry.symbol.location.uri, entry.symbol.location.range);
        }

        // Return as definition links for better UX
        return symbolEntries.map(entry => ({
            targetUri: entry.symbol.location.uri,
            targetRange: entry.symbol.location.range,
            targetSelectionRange: entry.symbol.location.selectionRange || entry.symbol.location.range,
            originSelectionRange: wordRange,
        }));
    }

    /**
     * Find definition in the current file
     */
    private async findLocalDefinition(
        document: vscode.TextDocument,
        symbolName: string,
        position: vscode.Position
    ): Promise<any | null> {
        const symbols = await this.symbolExtractor.extractSymbols(document);

        for (const symbol of symbols) {
            if (symbol.name === symbolName) {
                // Make sure we're not on the definition itself
                if (!symbol.location.range.contains(position)) {
                    return symbol;
                }
            }
        }

        return null;
    }
}
