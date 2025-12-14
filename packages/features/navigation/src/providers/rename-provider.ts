import * as vscode from 'vscode';
import { SymbolIndex } from '../services/symbol-index';
import { SymbolExtractor } from '../services/symbol-extractor';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';

/**
 * Provides "Rename Symbol" functionality
 */
export class InlineRenameProvider implements vscode.RenameProvider {
    constructor(
        private symbolIndex: SymbolIndex,
        private symbolExtractor: SymbolExtractor,
        private treeSitterService: TreeSitterService
    ) {}

    /**
     * Prepare rename - validate that rename is possible
     */
    async prepareRename(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Range | { range: vscode.Range; placeholder: string } | undefined> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            throw new Error('No symbol found at this position');
        }

        const word = document.getText(wordRange);

        // Check if this is a valid identifier
        if (!this.isValidIdentifier(word)) {
            throw new Error(`"${word}" is not a valid identifier`);
        }

        // Find the symbol
        const symbolEntries = this.symbolIndex.findSymbol(word);
        if (symbolEntries.length === 0) {
            throw new Error(`Symbol "${word}" not found`);
        }

        return {
            range: wordRange,
            placeholder: word,
        };
    }

    /**
     * Provide rename edits
     */
    async provideRenameEdits(
        document: vscode.TextDocument,
        position: vscode.Position,
        newName: string,
        token: vscode.CancellationToken
    ): Promise<vscode.WorkspaceEdit | undefined> {
        // Validate new name
        if (!this.isValidIdentifier(newName)) {
            vscode.window.showErrorMessage(`"${newName}" is not a valid identifier`);
            return undefined;
        }

        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const oldName = document.getText(wordRange);

        // Find all references to the symbol
        const references = await this.findAllReferences(oldName);

        if (references.length === 0) {
            return undefined;
        }

        // Create workspace edit
        const edit = new vscode.WorkspaceEdit();

        for (const reference of references) {
            edit.replace(reference.uri, reference.range, newName);
        }

        return edit;
    }

    /**
     * Find all references to a symbol
     */
    private async findAllReferences(symbolName: string): Promise<vscode.Location[]> {
        const references: vscode.Location[] = [];

        // Search in all indexed files
        for (const [fileUri, symbols] of (this.symbolIndex as any).index.fileIndex) {
            const uri = vscode.Uri.parse(fileUri);
            const fileReferences = await this.findReferencesInFile(uri, symbolName);
            references.push(...fileReferences);
        }

        return references;
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

            // Parse with Tree-sitter
            const tree = await this.treeSitterService.parse(text, document.languageId);
            if (!tree) {
                return references;
            }

            // Find all identifier nodes
            const identifiers = this.findIdentifierNodes(tree.rootNode, symbolName);

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

    /**
     * Find all identifier nodes with a specific name
     */
    private findIdentifierNodes(node: any, name: string): any[] {
        const identifiers: any[] = [];

        if (node.type === 'identifier' && node.text === name) {
            identifiers.push(node);
        }

        for (const child of node.children) {
            identifiers.push(...this.findIdentifierNodes(child, name));
        }

        return identifiers;
    }

    /**
     * Check if a string is a valid identifier
     */
    private isValidIdentifier(name: string): boolean {
        // Basic identifier validation (alphanumeric + underscore, not starting with digit)
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name);
    }
}
