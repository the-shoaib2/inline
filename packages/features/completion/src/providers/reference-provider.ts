import * as vscode from 'vscode';

/**
 * Reference Provider
 * Finds all references to a symbol
 */
export class ReferenceProvider implements vscode.ReferenceProvider {
    
    async provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return [];
        }

        const word = document.getText(wordRange);
        const locations: vscode.Location[] = [];

        // Find references in current file
        const currentFileRefs = this.findReferencesInDocument(word, document, context.includeDeclaration);
        locations.push(...currentFileRefs);

        // Find references in workspace
        const workspaceRefs = await this.findReferencesInWorkspace(word, document, context.includeDeclaration);
        locations.push(...workspaceRefs);

        return locations;
    }

    private findReferencesInDocument(
        symbol: string,
        document: vscode.TextDocument,
        includeDeclaration: boolean
    ): vscode.Location[] {
        const text = document.getText();
        const locations: vscode.Location[] = [];
        const regex = new RegExp(`\\b${symbol}\\b`, 'g');
        
        let match;
        while ((match = regex.exec(text)) !== null) {
            const pos = document.positionAt(match.index);
            
            // Skip declarations if not requested
            if (!includeDeclaration && this.isDeclaration(text, match.index)) {
                continue;
            }
            
            locations.push(new vscode.Location(document.uri, pos));
        }

        return locations;
    }

    private async findReferencesInWorkspace(
        symbol: string,
        currentDocument: vscode.TextDocument,
        includeDeclaration: boolean
    ): Promise<vscode.Location[]> {
        const locations: vscode.Location[] = [];
        const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java}', '**/node_modules/**', 100);
        
        for (const file of files) {
            if (file.toString() === currentDocument.uri.toString()) {
                continue;
            }

            try {
                const doc = await vscode.workspace.openTextDocument(file);
                const refs = this.findReferencesInDocument(symbol, doc, includeDeclaration);
                locations.push(...refs);
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        return locations;
    }

    private isDeclaration(text: string, index: number): boolean {
        const before = text.substring(Math.max(0, index - 50), index);
        return /(?:function|class|const|let|var|interface|type|def)\s+$/.test(before);
    }
}
