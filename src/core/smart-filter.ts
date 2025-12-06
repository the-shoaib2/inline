import * as vscode from 'vscode';

export class SmartFilter {
    private lastKeystrokeTime: number = 0;
    private keyPressHistory: number[] = [];
    private readonly HISTORY_SIZE = 10;
    private readonly FAST_TYPING_THRESHOLD = 8; // chars per second

    constructor() {}

    /**
     * Master decision matrix: Should we respond to this event?
     */
    public shouldRespond(
        document: vscode.TextDocument,
        position: vscode.Position,
        triggerKind: vscode.InlineCompletionTriggerKind
    ): boolean {
        const now = Date.now();
        
        // 1. Explicit trigger always wins
        if (triggerKind === vscode.InlineCompletionTriggerKind.Invoke) {
            return true;
        }

        // 2. Rate Limiting / Fast Typing Detection
        this.updateTypingSpeed(now);
        if (this.isTypingTooFast(now)) {
            console.log('[SmartFilter] ⛔ Typing too fast, suppressing suggestion');
            return false;
        }

        // 3. Document/Context Checks
        const line = document.lineAt(position.line);
        const lineText = line.text;
        const textBefore = lineText.substring(0, position.character);

        // 4. Inside String Literal Check (Basic Heuristic)
        if (this.isInsideString(textBefore)) {
             console.log('[SmartFilter] ⛔ inside string, suppressing');
             return false;
        }

        // 5. Semantic/Syntactic Checks
        // Don't suggest if user is deleting (backspace detection harder here without event, 
        // but typically 'onDidChangeTextDocument' handles that layer. 
        // Here we just check static context.)
        
        return true;
    }

    /**
     * Check if cursor is likely inside a string
     */
    private isInsideString(textBefore: string): boolean {
        // Simple parity check for quotes
        // This is naive but fast. For robust check we need a parser or tokenizer.
        const doubleQuotes = (textBefore.match(/"/g) || []).length;
        const singleQuotes = (textBefore.match(/'/g) || []).length;
        const backticks = (textBefore.match(/`/g) || []).length;
        
        // If odd number of quotes, we are likely inside one
        return (doubleQuotes % 2 !== 0) || (singleQuotes % 2 !== 0) || (backticks % 2 !== 0);
    }

    /**
     * Track typing speed to detect "in the zone" rapid typing
     */
    private updateTypingSpeed(now: number) {
        this.keyPressHistory.push(now);
        if (this.keyPressHistory.length > this.HISTORY_SIZE) {
            this.keyPressHistory.shift();
        }
    }

    private isTypingTooFast(now: number): boolean {
        if (this.keyPressHistory.length < 5) return false;
        
        const oldest = this.keyPressHistory[0];
        const durationSeconds = (now - oldest) / 1000;
        if (durationSeconds <= 0) return true; // 0 seconds for >5 chars is infinitely fast

        const charsPerSecond = this.keyPressHistory.length / durationSeconds;
        return charsPerSecond > this.FAST_TYPING_THRESHOLD;
    }
}
