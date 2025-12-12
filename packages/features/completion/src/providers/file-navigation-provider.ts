import * as vscode from 'vscode';
import * as path from 'path';

/**
 * File Navigation Provider
 * Quick file finder and navigation
 */
export class FileNavigationProvider {
    
    /**
     * Show quick pick for file navigation
     */
    async showFilePicker(): Promise<void> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**', 500);
        
        const items = files.map(file => {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(file);
            const relativePath = workspaceFolder 
                ? path.relative(workspaceFolder.uri.fsPath, file.fsPath)
                : file.fsPath;

            return {
                label: path.basename(file.fsPath),
                description: relativePath,
                uri: file
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Type to search files...',
            matchOnDescription: true
        });

        if (selected) {
            const document = await vscode.workspace.openTextDocument(selected.uri);
            await vscode.window.showTextDocument(document);
        }
    }

    /**
     * Navigate to file by path
     */
    async navigateToFile(filePath: string): Promise<void> {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
        }
    }

    /**
     * Find files by pattern
     */
    async findFilesByPattern(pattern: string): Promise<vscode.Uri[]> {
        return await vscode.workspace.findFiles(pattern, '**/node_modules/**');
    }
}
