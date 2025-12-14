/**
 * Handles partial acceptance of inline completions.
 * Allows users to accept completions line-by-line or word-by-word.
 * 
 * Keybindings:
 * - Tab: Accept next line
 * - Ctrl+→ (Cmd+→ on Mac): Accept next word
 * - Enter: Accept entire completion
 */

import * as vscode from 'vscode';

export interface CompletionState {
    fullCompletion: string;
    acceptedText: string;
    remainingText: string;
    currentLineIndex: number;
    currentWordIndex: number;
    position: vscode.Position;
    document: vscode.TextDocument;
}

export class PartialAcceptanceHandler {
    private currentState: CompletionState | null = null;
    private decorationType: vscode.TextEditorDecorationType;

    constructor() {
        // Create decoration type for showing remaining completion
        this.decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                color: new vscode.ThemeColor('editorGhostText.foreground'),
                fontStyle: 'italic'
            }
        });
    }

    /**
     * Initialize a new completion for partial acceptance
     */
    public initializeCompletion(
        completion: string,
        position: vscode.Position,
        document: vscode.TextDocument
    ): void {
        this.currentState = {
            fullCompletion: completion,
            acceptedText: '',
            remainingText: completion,
            currentLineIndex: 0,
            currentWordIndex: 0,
            position,
            document
        };
    }

    /**
     * Accept the next line of the completion
     */
    public async acceptNextLine(editor: vscode.TextEditor): Promise<boolean> {
        if (!this.currentState) return false;

        const lines = this.currentState.remainingText.split('\n');
        if (lines.length === 0) return false;

        const nextLine = lines[0];
        const isLastLine = lines.length === 1;

        // Insert the line
        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, nextLine + (isLastLine ? '' : '\n'));
        });

        // Update state
        this.currentState.acceptedText += nextLine + (isLastLine ? '' : '\n');
        this.currentState.remainingText = lines.slice(1).join('\n');
        this.currentState.currentLineIndex++;

        // If no more lines, clear state
        if (this.currentState.remainingText.length === 0) {
            this.clearState();
            return false;
        }

        return true;
    }

    /**
     * Accept the next word of the completion
     */
    public async acceptNextWord(editor: vscode.TextEditor): Promise<boolean> {
        if (!this.currentState) return false;

        // Split remaining text into words (including whitespace)
        const match = this.currentState.remainingText.match(/^(\s*\S+)/);
        if (!match) return false;

        const nextWord = match[1];

        // Insert the word
        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, nextWord);
        });

        // Update state
        this.currentState.acceptedText += nextWord;
        this.currentState.remainingText = this.currentState.remainingText.substring(nextWord.length);
        this.currentState.currentWordIndex++;

        // If no more text, clear state
        if (this.currentState.remainingText.length === 0) {
            this.clearState();
            return false;
        }

        return true;
    }

    /**
     * Accept the entire remaining completion
     */
    public async acceptAll(editor: vscode.TextEditor): Promise<void> {
        if (!this.currentState) return;

        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, this.currentState!.remainingText);
        });

        this.clearState();
    }

    /**
     * Reject the completion
     */
    public reject(): void {
        this.clearState();
    }

    /**
     * Get the current completion state
     */
    public getState(): CompletionState | null {
        return this.currentState;
    }

    /**
     * Check if there's an active completion
     */
    public hasActiveCompletion(): boolean {
        return this.currentState !== null;
    }

    /**
     * Get the remaining text to be accepted
     */
    public getRemainingText(): string {
        return this.currentState?.remainingText || '';
    }

    /**
     * Clear the current state
     */
    private clearState(): void {
        this.currentState = null;
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.decorationType.dispose();
        this.clearState();
    }
}
