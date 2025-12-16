import * as vscode from 'vscode';
import { SymbolIndex } from '../services/symbol-index';
import { SymbolExtractor } from '../services/symbol-extractor';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';

/**
 * Provides "Find All References" functionality
 */
export class InlineReferenceProvider implements vscode.ReferenceProvider {
    constructor(
        private symbolIndex: SymbolIndex,
        private symbolExtractor: SymbolExtractor,
        private treeSitterService: TreeSitterService
    ) {}

    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[] | undefined> {
        // Get the word at the cursor position
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);
        const references: vscode.Location[] = [];

        // Find the symbol definition first
        const symbolEntries = this.symbolIndex.findSymbol(word);
        if (symbolEntries.length === 0) {
            return undefined;
        }

        // Search for references in all indexed files
        for (const [fileUri, symbols] of (this.symbolIndex as any).index.fileIndex) {
            const uri = vscode.Uri.parse(fileUri);
            const fileReferences = await this.findReferencesInFile(uri, word);
            references.push(...fileReferences);
        }

        // Include declaration if requested
        if (context.includeDeclaration) {
            for (const entry of symbolEntries) {
                references.push(new vscode.Location(
                    entry.symbol.location.uri,
                    entry.symbol.location.range
                ));
            }
        }

        return references.length > 0 ? references : undefined;
    }

    /**
     * Find references in a specific file
     */
    private async findReferencesInFile(
        uri: vscode.Uri,
        symbolName: string
    ): Promise<vscode.Location[]> {
        const references: vscode.Location[] = [];

        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const text = document.getText();

            // Parse the file with Tree-sitter
            const tree = await this.treeSitterService.parse(text, document.languageId);
            if (!tree) {
                return references;
            }

            // Find all identifier nodes matching the symbol name (delegated)
            const identifiers = this.symbolExtractor.findIdentifierNodes(tree.rootNode, symbolName, document.languageId);

            for (const node of identifiers) {
                const range = new vscode.Range(
                    new vscode.Position(node.startPosition.row, node.startPosition.column),
                    new vscode.Position(node.endPosition.row, node.endPosition.column)
                );
                references.push(new vscode.Location(uri, range));
            }
        } catch (error) {
            console.error(`Error finding references in ${uri}:`, error);
        }

        return references;
    }
}
