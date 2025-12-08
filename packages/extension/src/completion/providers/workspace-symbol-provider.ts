import * as vscode from 'vscode';

/**
 * Workspace Symbol Provider
 * Provides workspace-wide symbol search
 */
export class WorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
    
    async provideWorkspaceSymbols(
        query: string,
        token: vscode.CancellationToken
    ): Promise<vscode.SymbolInformation[]> {
        const symbols: vscode.SymbolInformation[] = [];
        
        if (!query || query.length < 2) {
            return symbols;
        }

        const files = await vscode.workspace.findFiles('**/*.{ts,js,py,java}', '**/node_modules/**', 200);
        
        for (const file of files) {
            try {
                const doc = await vscode.workspace.openTextDocument(file);
                const fileSymbols = this.extractSymbolsFromDocument(doc, query);
                symbols.push(...fileSymbols);
            } catch (error) {
                // Skip files that can't be opened
            }
        }

        return symbols;
    }

    private extractSymbolsFromDocument(
        document: vscode.TextDocument,
        query: string
    ): vscode.SymbolInformation[] {
        const symbols: vscode.SymbolInformation[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        const queryLower = query.toLowerCase();

        // Extract functions, classes, interfaces
        const patterns = [
            { regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g, kind: vscode.SymbolKind.Function },
            { regex: /(?:export\s+)?class\s+(\w+)/g, kind: vscode.SymbolKind.Class },
            { regex: /(?:export\s+)?interface\s+(\w+)/g, kind: vscode.SymbolKind.Interface },
            { regex: /(?:export\s+)?type\s+(\w+)/g, kind: vscode.SymbolKind.TypeParameter },
            { regex: /(?:const|let|var)\s+(\w+)\s*=/g, kind: vscode.SymbolKind.Variable },
            { regex: /def\s+(\w+)\s*\(/g, kind: vscode.SymbolKind.Function }, // Python
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const name = match[1];
                
                // Filter by query
                if (!name.toLowerCase().includes(queryLower)) {
                    continue;
                }

                const line = text.substring(0, match.index).split('\n').length - 1;
                const position = new vscode.Position(line, 0);
                const location = new vscode.Location(document.uri, position);

                symbols.push(new vscode.SymbolInformation(
                    name,
                    pattern.kind,
                    '',
                    location
                ));
            }
        }

        return symbols;
    }
}
