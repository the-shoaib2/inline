import * as vscode from 'vscode';

export class InlineHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        // Only show hover if there is a selection that contains the position
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== document) {
            return null;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            return null;
        }

        // Check if cursor/position is inside the selection
        if (!selection.contains(position)) {
            return null;
        }

        // Create markdown content
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        
        // Command link
        markdown.appendMarkdown('[✨ AI Options...](command:inline.showOptions "Fix, Optimize, or Explain")');

        return new vscode.Hover(markdown);
    }
}
