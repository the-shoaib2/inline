import * as vscode from 'vscode';

/**
 * Centralized error handling and logging for the extension.
 *
 * Singleton that captures errors with context, maintains a rolling error log,
 * and optionally displays errors to the user with access to detailed logs.
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: ErrorEntry[] = [];
    private maxLogSize: number = 100;

    private constructor() {}

    /**
     * Get or create the singleton ErrorHandler instance.
     */
    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    /**
     * Record an error with context information.
     * Maintains rolling log and optionally notifies user.
     *
     * @param error The error object
     * @param context Human-readable context (e.g., 'ModelManager.loadModel')
     * @param showUser If true, display error notification to user
     */
    public handleError(error: Error, context: string, showUser: boolean = false): void {
        const entry: ErrorEntry = {
            error,
            context,
            timestamp: new Date(),
            stack: error.stack || ''
        };

        this.errorLog.push(entry);

        // Maintain bounded log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        console.error(`[${context}]`, error);

        if (showUser) {
            this.showErrorToUser(error, context);
        }
    }

    /**
     * Display error notification with option to view detailed logs.
     */
    private showErrorToUser(error: Error, context: string): void {
        const message = `Inline Error (${context}): ${error.message}`;

        vscode.window.showErrorMessage(message, 'View Logs', 'Dismiss').then(selection => {
            if (selection === 'View Logs') {
                this.showErrorLog();
            }
        });
    }

    /**
     * Open error log in a new text document for user inspection.
     */
    public showErrorLog(): void {
        const doc = vscode.workspace.openTextDocument({
            content: this.formatErrorLog(),
            language: 'plaintext'
        });

        doc.then(document => {
            vscode.window.showTextDocument(document);
        });
    }

    /**
     * Format error log entries as readable text with timestamps and stack traces.
     */
    private formatErrorLog(): string {
        const lines: string[] = [
            'Inline Extension Error Log',
            '='.repeat(50),
            ''
        ];

        for (const entry of this.errorLog.reverse()) {
            lines.push(`[${entry.timestamp.toISOString()}] ${entry.context}`);
            lines.push(`Error: ${entry.error.message}`);
            if (entry.stack) {
                lines.push(`Stack: ${entry.stack}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }

    public getRecentErrors(count: number = 10): ErrorEntry[] {
        return this.errorLog.slice(-count);
    }

    public clearLog(): void {
        this.errorLog = [];
    }
}

interface ErrorEntry {
    error: Error;
    context: string;
    timestamp: Date;
    stack: string;
}
