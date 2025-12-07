import * as vscode from 'vscode';
import { ModelManager } from '../../inference/model-manager';
import { ImportResolver } from './import-resolver';

/**
 * Provides AI-powered code actions for VS Code.
 *
 * Features:
 * - Quick fixes for errors using AI
 * - Code optimization and refactoring
 * - Import management and organization
 * - Code explanation and formatting
 *
 * Integrates with ModelManager for AI-powered suggestions.
 */
export class InlineCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.SourceOrganizeImports,
    ];

    private importResolver: ImportResolver;

    /**
     * Initialize code action provider with AI model access.
     * @param modelManager For AI model integration
     */
    constructor(private modelManager: ModelManager) {
        this.importResolver = new ImportResolver();
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        // Import Management Actions
        await this.addImportActions(document, context, actions);

        // Only provide other actions if there is a selection or diagnostics (errors)
        if (range.isEmpty && context.diagnostics.length === 0) {
            return actions;
        }

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

            const refactorAction = new vscode.CodeAction('🛠️ Refactor Block', vscode.CodeActionKind.RefactorRewrite);
            refactorAction.command = {
                command: 'inline.refactorCode',
                title: 'Refactor Block',
                arguments: [document, range]
            };
            actions.push(refactorAction);

            const formatAction = new vscode.CodeAction('📝 Format Block', vscode.CodeActionKind.QuickFix);
            formatAction.command = {
                command: 'inline.formatCode',
                title: 'Format Block',
                arguments: [document, range]
            };
            actions.push(formatAction);

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

    private async addImportActions(
        document: vscode.TextDocument,
        context: vscode.CodeActionContext,
        actions: vscode.CodeAction[]
    ): Promise<void> {
        // 1. Organize Imports
        const organizeAction = new vscode.CodeAction(
            '📦 Organize Imports',
            vscode.CodeActionKind.SourceOrganizeImports
        );
        organizeAction.command = {
            command: 'inline.organizeImports',
            title: 'Organize Imports',
            arguments: [document]
        };
        actions.push(organizeAction);

        // 2. Remove Unused Imports
        const unusedImports = await this.importResolver.findUnusedImports(document);
        if (unusedImports.length > 0) {
            const removeUnusedAction = new vscode.CodeAction(
                `🧹 Remove Unused Imports (${unusedImports.length})`,
                vscode.CodeActionKind.QuickFix
            );
            removeUnusedAction.command = {
                command: 'inline.removeUnusedImports',
                title: 'Remove Unused Imports',
                arguments: [document]
            };
            removeUnusedAction.isPreferred = true;
            actions.push(removeUnusedAction);
        }

        // 3. Add Missing Imports
        const missingImports = await this.importResolver.findMissingImports(document);
        if (missingImports.length > 0) {
            for (const suggestion of missingImports.slice(0, 3)) { // Limit to top 3
                const addImportAction = new vscode.CodeAction(
                    `➕ Add import: ${suggestion.symbol} from '${suggestion.module}'`,
                    vscode.CodeActionKind.QuickFix
                );
                addImportAction.command = {
                    command: 'inline.addImport',
                    title: 'Add Import',
                    arguments: [document, suggestion.symbol, suggestion.module, suggestion.isDefault]
                };
                actions.push(addImportAction);
            }
        }
    }

    getImportResolver(): ImportResolver {
        return this.importResolver;
    }
}
