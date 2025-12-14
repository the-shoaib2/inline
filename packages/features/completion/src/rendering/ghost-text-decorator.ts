/**
 * Ghost Text Decorator for inline completions.
 * Provides Copilot-style gray, italic ghost text rendering.
 */

import * as vscode from 'vscode';

export interface GhostTextOptions {
    opacity?: number;
    color?: string;
    fontStyle?: 'italic' | 'normal';
}

export class GhostTextDecorator {
    private decorationType: vscode.TextEditorDecorationType;
    private currentDecorations: vscode.DecorationOptions[] = [];

    constructor(options: GhostTextOptions = {}) {
        this.decorationType = this.createDecorationType(options);
    }

    /**
     * Create decoration type with custom styling
     */
    private createDecorationType(options: GhostTextOptions): vscode.TextEditorDecorationType {
        const config = vscode.workspace.getConfiguration('inline');
        const fontStyle = options.fontStyle ?? config.get<string>('ghostText.fontStyle', 'italic');

        // Note: VS Code doesn't support custom opacity in decorations
        // We use the built-in editorGhostText.foreground theme color which handles opacity
        return vscode.window.createTextEditorDecorationType({
            after: {
                color: new vscode.ThemeColor('editorGhostText.foreground'),
                fontStyle: fontStyle
            },
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
        });
    }

    /**
     * Show ghost text at the specified position
     */
    public show(
        editor: vscode.TextEditor,
        position: vscode.Position,
        text: string
    ): void {
        // Clear existing decorations
        this.clear(editor);

        // Create decoration at cursor position
        const decoration: vscode.DecorationOptions = {
            range: new vscode.Range(position, position),
            renderOptions: {
                after: {
                    contentText: text,
                    color: new vscode.ThemeColor('editorGhostText.foreground'),
                    fontStyle: 'italic'
                }
            }
        };

        this.currentDecorations = [decoration];
        editor.setDecorations(this.decorationType, this.currentDecorations);
    }

    /**
     * Show multi-line ghost text
     */
    public showMultiLine(
        editor: vscode.TextEditor,
        position: vscode.Position,
        lines: string[]
    ): void {
        this.clear(editor);

        const decorations: vscode.DecorationOptions[] = [];

        lines.forEach((line, index) => {
            const linePosition = new vscode.Position(position.line + index, 
                index === 0 ? position.character : 0);

            decorations.push({
                range: new vscode.Range(linePosition, linePosition),
                renderOptions: {
                    after: {
                        contentText: line,
                        color: new vscode.ThemeColor('editorGhostText.foreground'),
                        fontStyle: 'italic'
                    }
                }
            });
        });

        this.currentDecorations = decorations;
        editor.setDecorations(this.decorationType, decorations);
    }

    /**
     * Update ghost text (for streaming)
     */
    public update(
        editor: vscode.TextEditor,
        position: vscode.Position,
        text: string
    ): void {
        this.show(editor, position, text);
    }

    /**
     * Clear all ghost text decorations
     */
    public clear(editor: vscode.TextEditor): void {
        editor.setDecorations(this.decorationType, []);
        this.currentDecorations = [];
    }

    /**
     * Refresh decoration type with new options
     */
    public refresh(options: GhostTextOptions): void {
        this.decorationType.dispose();
        this.decorationType = this.createDecorationType(options);
    }

    /**
     * Check if ghost text is currently shown
     */
    public isShowing(): boolean {
        return this.currentDecorations.length > 0;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.decorationType.dispose();
        this.currentDecorations = [];
    }
}
