/**
 * Intelligent inline completion filtering to reduce distractions.
 *
 * Features:
 * - Typing speed detection to suppress suggestions during fast typing
 * - String literal detection to avoid suggestions in inappropriate contexts
 * - Rate limiting based on user behavior patterns
 * - Context-aware trigger response
 */

import * as vscode from 'vscode';

/**
 * Smart filtering system for inline completion suggestions.
 * Prevents distractions during focused coding sessions.
 */
export class SmartFilter {
    private lastKeystrokeTime: number = 0;
    private keyPressHistory: number[] = [];
    private readonly HISTORY_SIZE = 10;
    private readonly FAST_TYPING_THRESHOLD = 8; // chars/sec threshold

    constructor() {}

    /**
     * Determines if inline suggestions should be shown based on:
     * - Trigger type (explicit vs automatic)
     * - Typing speed (rate limiting during fast typing)
     * - Syntax context (avoid suggestions in string literals)
     *
     * @param document - Current text document
     * @param position - Cursor position in document
     * @param triggerKind - How the inline completion was triggered
     * @returns true if suggestions should be shown
     */
    public shouldRespond(
        document: vscode.TextDocument,
        position: vscode.Position,
        triggerKind: vscode.InlineCompletionTriggerKind
    ): boolean {
        const now = Date.now();

        // Explicit trigger → always respond
        if (triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
            return true;
        }

        // Typing too fast → suppress suggestions to avoid distraction
        this.updateTypingSpeed(now);
        if (this.isTypingTooFast(now)) {
            console.log('[SmartFilter] ⛔ Fast typing, suppressing');
            return false;
        }

        const line = document.lineAt(position.line);
        const textBeforeCursor = line.text.substring(0, position.character);

        // Skip suggestions inside string literals (basic heuristic)
        if (this.isInsideString(textBeforeCursor)) {
            console.log('[SmartFilter] ⛔ Inside string literal');
            return false;
        }

        return true;
    }

    /**
     * Detects if cursor is inside a string literal using quote parity.
     * Fast heuristic: odd number of quotes means inside a string.
     *
     * @param textBefore - Text from line start to cursor position
     * @returns true if cursor is inside a string literal
     */
    private isInsideString(textBefore: string): boolean {
        const doubleQuotes = (textBefore.match(/"/g) || []).length;
        const singleQuotes = (textBefore.match(/'/g) || []).length;
        const backticks = (textBefore.match(/`/g) || []).length;

        // Odd number of quotes → inside a string
        return (
            doubleQuotes % 2 !== 0 ||
            singleQuotes % 2 !== 0 ||
            backticks % 2 !== 0
        );
    }

    /**
     * Records keystroke timestamps for typing speed calculation.
     * Maintains sliding window of recent keystroke events.
     *
     * @param now - Current timestamp in milliseconds
     */
    private updateTypingSpeed(now: number) {
        this.keyPressHistory.push(now);
        if (this.keyPressHistory.length > this.HISTORY_SIZE) {
            this.keyPressHistory.shift();
        }
    }

    /**
     * Determines if user is typing too fast for suggestions.
     * Prevents interruptions during focused coding sessions.
     *
     * @param now - Current timestamp in milliseconds
     * @returns true if typing speed exceeds threshold (8 chars/sec)
     */
    private isTypingTooFast(now: number): boolean {
        if (this.keyPressHistory.length < 5) return false;

        const oldest = this.keyPressHistory[0];
        const elapsed = (now - oldest) / 1000;

        if (elapsed <= 0) return true;

        const cps = this.keyPressHistory.length / elapsed;
        return cps > this.FAST_TYPING_THRESHOLD;
    }
}
