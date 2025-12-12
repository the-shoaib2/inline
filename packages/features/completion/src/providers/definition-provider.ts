import * as vscode from 'vscode';

/**
 * Definition Provider
 * Provides go-to-definition functionality
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
    
    async provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Definition | undefined> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = document.getText(wordRange);
        const text = document.getText();
        
        // Find definition in current file
        const definition = this.findDefinitionInText(word, text, document);
        if (definition) {
            return definition;
        }

        // Search in workspace files
        return await this.findDefinitionInWorkspace(word, document);
    }

    private findDefinitionInText(
        symbol: string,
        text: string,
        document: vscode.TextDocument
    ): vscode.Location | undefined {
        // Match function/class/variable declarations
        const patterns = [
            new RegExp(`(?:function|class|const|let|var|interface|type)\\s+${symbol}\\b`, 'g'),
            new RegExp(`${symbol}\\s*[:=]\\s*(?:function|class|\\{)`, 'g'),
            new RegExp(`def\\s+${symbol}\\s*\\(`, 'g'), // Python
        ];

        for (const pattern of patterns) {
            const match = pattern.exec(text);
            if (match) {
                const pos = document.positionAt(match.index);
                return new vscode.Location(document.uri, pos);
            }
        }

        return undefined;
    }

    private async findDefinitionInWorkspace(
        symbol: string,
        currentDocument: vscode.TextDocument
    ): Promise<vscode.Location | undefined> {
        const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java}', '**/node_modules/**', 50);
        
        for (const file of files) {
            if (file.toString() === currentDocument.uri.toString()) {
                continue;
            }

            try {
                const doc = await vscode.workspace.openTextDocument(file);
                const location = this.findDefinitionInText(symbol, doc.getText(), doc);
                if (location) {
                    return location;
                }
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        return undefined;
    }
}
