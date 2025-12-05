import * as vscode from 'vscode';
import { ModelManager } from './model-manager';

export class InlineCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.RefactorRewrite,
    ];

    constructor(private modelManager: ModelManager) {}

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        // Only provide actions if there is a selection or diagnostics (errors)
        if (range.isEmpty && context.diagnostics.length === 0) {
            return [];
        }

        const actions: vscode.CodeAction[] = [];

        // 1. Fix Code Action (if there are errors)
        if (context.diagnostics.length > 0) {
            const fixAction = new vscode.CodeAction('✨ Fix with AI', vscode.CodeActionKind.QuickFix);
            fixAction.command = {
                command: 'inline.fixCode',
                title: 'Fix with AI',
                arguments: [document, range, context.diagnostics]
            };
            actions.push(fixAction);
        }

        // 2. Optimize/Refactor Action (always available on selection)
        if (!range.isEmpty) {
            const optimizeAction = new vscode.CodeAction('⚡ Optimize Selection', vscode.CodeActionKind.RefactorRewrite);
            optimizeAction.command = {
                command: 'inline.optimizeCode',
                title: 'Optimize Selection',
                arguments: [document, range]
            };
            actions.push(optimizeAction);

            const explainAction = new vscode.CodeAction('💡 Explain Code', vscode.CodeActionKind.QuickFix);
            explainAction.command = {
                command: 'inline.explainCode',
                title: 'Explain Code',
                arguments: [document, range]
            };
            actions.push(explainAction);
        }

        return actions;
    }
}
