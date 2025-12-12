import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Path Completion Provider
 * Provides intelligent file path completions
 */
export class PathCompletionProvider implements vscode.CompletionItemProvider {
    
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const lineText = document.lineAt(position.line).text;
        const textBefore = lineText.substring(0, position.character);
        
        // Detect path context (strings with ./ or ../ or /)
        const pathMatch = textBefore.match(/['"]([\.\/][\w\/\-\.]*)$/);
        if (!pathMatch) {
            return [];
        }

        const partialPath = pathMatch[1];
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const currentDir = path.dirname(document.uri.fsPath);
        const searchPath = path.resolve(currentDir, partialPath);
        const searchDir = fs.existsSync(searchPath) && fs.statSync(searchPath).isDirectory() 
            ? searchPath 
            : path.dirname(searchPath);

        if (!fs.existsSync(searchDir)) {
            return [];
        }

        const items: vscode.CompletionItem[] = [];
        const files = fs.readdirSync(searchDir);

        for (const file of files) {
            const filePath = path.join(searchDir, file);
            const stat = fs.statSync(filePath);
            const isDirectory = stat.isDirectory();

            const item = new vscode.CompletionItem(
                file,
                isDirectory ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File
            );

            item.detail = isDirectory ? 'Directory' : 'File';
            item.insertText = isDirectory ? file + '/' : file;
            
            items.push(item);
        }

        return items;
    }
}
