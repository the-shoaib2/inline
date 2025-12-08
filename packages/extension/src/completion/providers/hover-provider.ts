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
        markdown.appendMarkdown('### ✨ AI Smart Actions\n\n');
        markdown.appendMarkdown('[⚡ Optimize](command:inline.optimizeCode "Optimize selected code") | ');
        markdown.appendMarkdown('[🛠️ Refactor](command:inline.refactorCode "Refactor selected code") | ');
        markdown.appendMarkdown('[📝 Format](command:inline.formatCode "Format selected code") | ');
        markdown.appendMarkdown('[💡 Explain](command:inline.explainCode "Explain selected code")');

        return new vscode.Hover(markdown);
    }
}
