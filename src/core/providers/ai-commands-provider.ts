import * as vscode from 'vscode';
import { TestGenerator } from '../../features/code-generation/test-generator';
import { DocGenerator } from '../../features/code-generation/doc-generator';
import { ErrorExplainer } from '../../features/code-analysis/error-explainer';
import { SecurityScanner } from '../../features/code-analysis/security-scanner';
import { PRGenerator } from '../../features/code-generation/pr-generator';
import { ModelManager } from '../../inference/model-manager';
import { Logger } from '../../system/logger';
import { TerminalAssistant } from '../../features/terminal/terminal-assistant';
import { RefactoringEngine } from '../../features/code-analysis/refactoring-engine';
import { ContextEngine } from '../context/context-engine';

/**
 * Provides AI-powered VS Code commands for code assistance.
 *
 * Features:
 * - Test generation from code
 * - Documentation generation
 * - Error explanation and fixing
 * - Security scanning
 * - PR description generation
 * - Terminal assistance
 * - Code refactoring
 *
 * Integrates with ModelManager for AI inference.
 */
export class AICommandsProvider {
    private testGenerator: TestGenerator;
    private docGenerator: DocGenerator;
    private errorExplainer: ErrorExplainer;
    private securityScanner: SecurityScanner;
    private prGenerator: PRGenerator;
    private terminalAssistant: TerminalAssistant;
    private refactoringEngine: RefactoringEngine;
    private logger: Logger;
    private modelManager: ModelManager;
    private contextEngine?: ContextEngine;

    /**
     * Initialize AI commands provider with inference engines.
     * @param modelManager For model access and status checking
     * @param contextEngine Optional context engine for code analysis
     */
    constructor(modelManager: ModelManager, contextEngine?: ContextEngine) {
        const inference = modelManager.getInferenceEngine();

        this.modelManager = modelManager;
        this.contextEngine = contextEngine;
        this.testGenerator = new TestGenerator(inference);
        this.docGenerator = new DocGenerator(inference);
        this.errorExplainer = new ErrorExplainer(inference);
        this.securityScanner = new SecurityScanner(inference);
        this.prGenerator = new PRGenerator(inference);
        this.terminalAssistant = new TerminalAssistant(inference);
        this.refactoringEngine = new RefactoringEngine(inference);
        this.logger = new Logger('AICommandsProvider');
    }

    /**
     * Verify AI model is loaded before executing commands.
     * Shows warning with option to load model if not available.
     *
     * @returns true if model is loaded, false otherwise
     */
    private checkModelStatus(): boolean {
        const inference = this.modelManager.getInferenceEngine();
        const status = inference.getModelStatus();

        if (!status.loaded) {
            vscode.window.showWarningMessage(
                'No AI model loaded. Using offline mode with placeholder responses. Load a model for AI-powered features.',
                'Load Model'
            ).then(action => {
                if (action === 'Load Model') {
                    vscode.commands.executeCommand('inline.modelManager');
                }
            });
            return false;
        }

        return true;
    }

    /**
     * Set context engine for enhanced code analysis.
     * @param contextEngine Context engine instance
     */
    public setContextEngine(contextEngine: ContextEngine): void {
        this.contextEngine = contextEngine;
    }

    /**
     * Register all AI-powered commands with VS Code.
     * Includes test generation, documentation, error fixing, and more.
     *
     * @param context Extension context for command registration
     */
    public registerCommands(context: vscode.ExtensionContext): void {
        // Test Generation Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.generateTests', async () => {
                await this.handleGenerateTests();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('inline.generateTestFile', async () => {
                await this.handleGenerateTestFile();
            })
        );

        // Documentation Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.generateDocstring', async () => {
                await this.handleGenerateDocstring();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('inline.documentFile', async () => {
                await this.handleDocumentFile();
            })
        );

        // Error Explanation Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.explainError', async () => {
                await this.handleExplainError();
            })
        );

        // Security Scanning Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.scanSecurity', async () => {
                await this.handleSecurityScan();
            })
        );

        // PR/Commit Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.generatePRDescription', async () => {
                await this.handleGeneratePR();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('inline.generateCommitMessage', async () => {
                await this.handleGenerateCommit();
            })
        );

        // Terminal Assistant Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.suggestCommand', async () => {
                await this.handleSuggestCommand();
            })
        );

        context.subscriptions.push(
            vscode.commands.registerCommand('inline.explainCommand', async () => {
                await this.handleExplainCommand();
            })
        );

        // Refactoring Commands
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.suggestRefactorings', async () => {
                await this.handleSuggestRefactorings();
            })
        );

        // NEW: Smart Code Actions (Fixing, Optimizing, Refactoring, Formatting, Explaining)
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.fixCode', async (document, range, diagnostics) => {
                await this.handleSmartAction(document, range, 'fix', diagnostics);
            }),
            vscode.commands.registerCommand('inline.optimizeCode', async (document, range) => {
                await this.handleSmartAction(document, range, 'optimize');
            }),
            vscode.commands.registerCommand('inline.refactorCode', async (document, range) => {
                await this.handleSmartAction(document, range, 'refactor');
            }),
             vscode.commands.registerCommand('inline.formatCode', async (document, range) => {
                await this.handleSmartAction(document, range, 'format');
            }),
             vscode.commands.registerCommand('inline.explainCode', async (document, range) => {
                await this.handleExplainCode(document, range);
            })
        );
    }

    /**
     * Handle Smart Actions (Fix, Optimize, Refactor, Format)
     */
    private async handleSmartAction(
        document: vscode.TextDocument,
        range: vscode.Range,
        type: 'fix' | 'optimize' | 'refactor' | 'format',
        diagnostics?: vscode.Diagnostic[]
    ): Promise<void> {
        if (!this.checkModelStatus()) return;

        try {
            const selectedCode = document.getText(range);
            let instruction = '';
            let title = '';

            // Build Context Actions
            let contextContext = '';
            if (this.contextEngine) {
                const context = await this.contextEngine.buildContext(document, range.start);
                // We create a lightweight context summary
                 contextContext = `
Context:
- Language: ${context.language}
- Project: ${context.project}
${context.imports.length > 0 ? '- Imports: ' + context.imports.slice(0, 5).map(i => i.module).join(', ') : ''}
`;
            }

            switch (type) {
                case 'fix':
                    const errorMessages = diagnostics?.map(d => d.message).join('\n') || 'Unknown error';
                    instruction = `Fix the following code which has these errors:\n${errorMessages}\n\n${contextContext}\nProvide only the fixed code, no explanation.`;
                    title = 'Fixing code...';
                    break;
                case 'optimize':
                    instruction = `Optimize this code for performance and readability.\n${contextContext}\nProvide only the optimized code, no explanation.`;
                    title = 'Optimizing code...';
                    break;
                case 'refactor':
                    instruction = `Refactor this code to improve structure and maintainability without changing behavior.\n${contextContext}\nProvide only the refactored code, no explanation.`;
                    title = 'Refactoring code...';
                    break;
                case 'format':
                    instruction = `Format this code to follow standard coding conventions (indentation, spacing, etc.).\n${contextContext}\nProvide only the formatted code, no explanation.`;
                    title = 'Formatting code...';
                    break;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: title,
                cancellable: false
            }, async () => {
                const inference = this.modelManager.getInferenceEngine();
                const result = await inference.generateImprovement(selectedCode, instruction);

                // Clean result
                let cleanResult = result.replace(/```[\w]*\n?|```$/g, '').trim();

                if (cleanResult) {
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(document.uri, range, cleanResult);
                    await vscode.workspace.applyEdit(edit);
                }
            });
        } catch (error: any) {
             vscode.window.showErrorMessage(`Failed to ${type} code: ${error.message}`);
             this.logger.error(`Smart action ${type} failed: ${error}`);
        }
    }

      /**
     * Explain Code
     */
    private async handleExplainCode(document: vscode.TextDocument, range: vscode.Range): Promise<void> {
         if (!this.checkModelStatus()) return;

         try {
            const selectedCode = document.getText(range);
            let contextContext = '';

            if (this.contextEngine) {
                 const context = await this.contextEngine.buildContext(document, range.start);
                 contextContext = `\nContext:\n- Variables in scope: ${context.variables.map(v => v.name).join(', ')}`;
            }

            const instruction = `Explain what this code does in simple terms.${contextContext}`;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Explaining code...',
                cancellable: false
            }, async () => {
                const inference = this.modelManager.getInferenceEngine();
                const result = await inference.generateImprovement(selectedCode, instruction, { maxTokens: 512 });

                const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
                await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to explain code: ${error.message}`);
        }
    }

    /**
     * Generate tests for selected code
     */
    private async handleGenerateTests(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select code to generate tests for');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating tests...',
                cancellable: false
            }, async () => {
                const result = await this.testGenerator.generateTests(
                    editor.document,
                    selection,
                    { includeEdgeCases: true }
                );

                // Create new test file
                const testFileName = this.getTestFileName(editor.document.fileName);
                const testUri = vscode.Uri.file(testFileName);

                const edit = new vscode.WorkspaceEdit();
                edit.createFile(testUri, { ignoreIfExists: true });
                edit.insert(testUri, new vscode.Position(0, 0), result.code);

                await vscode.workspace.applyEdit(edit);
                const doc = await vscode.workspace.openTextDocument(testUri);
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage(
                    `Generated ${result.testCount} tests using ${result.framework}`
                );
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Test generation failed: ${error.message}`);
            this.logger.error(`Test generation error: ${error}`);
        }
    }

    /**
     * Generate test file for entire source file
     */
    private async handleGenerateTestFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating test file...',
                cancellable: false
            }, async () => {
                const testCode = await this.testGenerator.generateTestFile(editor.document);

                const testFileName = this.getTestFileName(editor.document.fileName);
                const testUri = vscode.Uri.file(testFileName);

                const edit = new vscode.WorkspaceEdit();
                edit.createFile(testUri, { overwrite: true });
                edit.insert(testUri, new vscode.Position(0, 0), testCode);

                await vscode.workspace.applyEdit(edit);
                const doc = await vscode.workspace.openTextDocument(testUri);
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage('Test file generated successfully');
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Test file generation failed: ${error.message}`);
        }
    }

    /**
     * Generate documentation for selected code
     */
    private async handleGenerateDocstring(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select a function or class');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating documentation...',
                cancellable: false
            }, async () => {
                const result = await this.docGenerator.generateDocstring(
                    editor.document,
                    selection,
                    { includeExamples: true }
                );

                // Insert documentation above the selection
                const insertPosition = new vscode.Position(selection.start.line, 0);
                const edit = new vscode.WorkspaceEdit();
                edit.insert(editor.document.uri, insertPosition, result.documentation + '\n');

                await vscode.workspace.applyEdit(edit);

                vscode.window.showInformationMessage(
                    `Documentation generated (${result.style})`
                );
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Documentation generation failed: ${error.message}`);
        }
    }

    /**
     * Document entire file
     */
    private async handleDocumentFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Documenting file...',
                cancellable: false
            }, async () => {
                const docs = await this.docGenerator.documentFile(editor.document);

                vscode.window.showInformationMessage(
                    `Generated documentation for ${docs.length} functions/classes`
                );
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`File documentation failed: ${error.message}`);
        }
    }

    /**
     * Explain error at cursor
     */
    private async handleExplainError(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        const position = editor.selection.active;

        // Find diagnostic at cursor position
        const diagnostic = diagnostics.find(d => d.range.contains(position));

        if (!diagnostic) {
            vscode.window.showInformationMessage('No error found at cursor position');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Explaining error...',
                cancellable: false
            }, async () => {
                const explanation = await this.errorExplainer.explainError(
                    diagnostic,
                    editor.document
                );

                // Show explanation in a new document
                const content = this.formatErrorExplanation(explanation);
                const doc = await vscode.workspace.openTextDocument({
                    content,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Error explanation failed: ${error.message}`);
        }
    }

    /**
     * Scan file for security vulnerabilities
     */
    private async handleSecurityScan(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Scanning for security issues...',
                cancellable: false
            }, async () => {
                const result = await this.securityScanner.scanDocument(editor.document);
                const report = this.securityScanner.generateReport(result);

                // Show report in new document
                const doc = await vscode.workspace.openTextDocument({
                    content: report,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);

                const severity = result.vulnerabilities.length > 0 ? 'warning' : 'info';
                const message = result.vulnerabilities.length > 0
                    ? `Found ${result.vulnerabilities.length} security issues`
                    : 'No security issues found';

                if (severity === 'warning') {
                    vscode.window.showWarningMessage(message);
                } else {
                    vscode.window.showInformationMessage(message);
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Security scan failed: ${error.message}`);
        }
    }

    /**
     * Generate PR description
     */
    private async handleGeneratePR(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating PR description...',
                cancellable: false
            }, async () => {
                const pr = await this.prGenerator.generatePRDescription(true);
                const formatted = this.prGenerator.formatPRDescription(pr);

                // Show in new document
                const doc = await vscode.workspace.openTextDocument({
                    content: formatted,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc);

                vscode.window.showInformationMessage('PR description generated');
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`PR generation failed: ${error.message}`);
        }
    }

    /**
     * Generate commit message
     */
    private async handleGenerateCommit(): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating commit message...',
                cancellable: false
            }, async () => {
                const commit = await this.prGenerator.generateCommitMessage(true);
                const formatted = this.prGenerator.formatCommitMessage(commit);

                // Copy to clipboard
                await vscode.env.clipboard.writeText(formatted);

                vscode.window.showInformationMessage(
                    'Commit message copied to clipboard',
                    'Show'
                ).then(action => {
                    if (action === 'Show') {
                        vscode.window.showInformationMessage(formatted);
                    }
                });
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Commit message generation failed: ${error.message}`);
        }
    }

    /**
     * Helper: Get test file name from source file name
     */
    private getTestFileName(sourceFile: string): string {
        const ext = sourceFile.substring(sourceFile.lastIndexOf('.'));
        const base = sourceFile.substring(0, sourceFile.lastIndexOf('.'));

        // Common test file patterns
        if (ext === '.ts' || ext === '.js') {
            return `${base}.test${ext}`;
        } else if (ext === '.py') {
            return `test_${sourceFile.substring(sourceFile.lastIndexOf('/') + 1)}`;
        }

        return `${base}.test${ext}`;
    }

    /**
     * Helper: Format error explanation for display
     */
    private formatErrorExplanation(explanation: any): string {
        let content = `# Error Explanation\n\n`;
        content += `## Error\n\n\`\`\`\n${explanation.error}\n\`\`\`\n\n`;
        content += `## Explanation\n\n${explanation.explanation}\n\n`;
        content += `## Suggested Fixes\n\n`;

        for (let i = 0; i < explanation.suggestedFixes.length; i++) {
            content += `${i + 1}. ${explanation.suggestedFixes[i]}\n`;
        }

        return content;
    }

    /**
     * Suggest terminal command
     */
    private async handleSuggestCommand(): Promise<void> {
        const query = await vscode.window.showInputBox({
            prompt: 'What do you want to do?',
            placeHolder: 'e.g., "commit all changes", "install dependencies"'
        });

        if (!query) return;

        try {
            const suggestions = await this.terminalAssistant.suggestCommand(query);

            if (suggestions.length === 0) {
                vscode.window.showInformationMessage('No command suggestions found');
                return;
            }

            const items = suggestions.map(s => ({
                label: s.command,
                description: s.description,
                detail: s.dangerous ? '⚠️ Dangerous command' : undefined,
                command: s.command
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a command'
            });

            if (selected) {
                await vscode.env.clipboard.writeText(selected.command);
                vscode.window.showInformationMessage('Command copied to clipboard');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Command suggestion failed: ${error.message}`);
        }
    }

    /**
     * Explain terminal command
     */
    private async handleExplainCommand(): Promise<void> {
        const command = await vscode.window.showInputBox({
            prompt: 'Enter command to explain',
            placeHolder: 'e.g., "git rebase -i HEAD~3"'
        });

        if (!command) return;

        try {
            const explanation = await this.terminalAssistant.explainCommand(command);

            const doc = await vscode.workspace.openTextDocument({
                content: `# Command Explanation\n\n\`\`\`bash\n${command}\n\`\`\`\n\n${explanation}`,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Command explanation failed: ${error.message}`);
        }
    }

    /**
     * Refactor selected code
     */
    private async handleRefactorCode(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select code to refactor');
            return;
        }

        const refactoringTypes = [
            { label: 'Extract Method', value: 'extract-method' },
            { label: 'Simplify Conditional', value: 'simplify-conditional' },
            { label: 'Convert to Arrow Function', value: 'convert-to-arrow' },
            { label: 'Add Null Checks', value: 'add-null-checks' },
            { label: 'Remove Dead Code', value: 'remove-dead-code' }
        ];

        const selected = await vscode.window.showQuickPick(refactoringTypes, {
            placeHolder: 'Select refactoring type'
        });

        if (!selected) return;

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Refactoring code...',
                cancellable: false
            }, async () => {
                const result = await this.refactoringEngine.applyRefactoring(
                    editor.document,
                    selection,
                    selected.value as any
                );

                const edit = new vscode.WorkspaceEdit();
                edit.replace(editor.document.uri, selection, result.refactoredCode);
                await vscode.workspace.applyEdit(edit);

                vscode.window.showInformationMessage(result.description);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`Refactoring failed: ${error.message}`);
        }
    }

    /**
     * Suggest refactorings for selected code
     */
    private async handleSuggestRefactorings(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showWarningMessage('Please select code');
            return;
        }

        try {
            const suggestions = await this.refactoringEngine.suggestRefactorings(
                editor.document,
                selection
            );

            if (suggestions.length === 0) {
                vscode.window.showInformationMessage('No refactoring suggestions');
                return;
            }

            const items = suggestions.map(s => ({
                label: s.type,
                description: s.description,
                detail: `Priority: ${s.priority}`,
                suggestion: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select refactoring to apply'
            });

            if (selected) {
                await this.handleRefactorCode();
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Refactoring suggestions failed: ${error.message}`);
        }
    }
}
