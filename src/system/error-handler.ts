import * as vscode from 'vscode';

export class ErrorHandler {
    private static instance: ErrorHandler;
    private errorLog: ErrorEntry[] = [];
    private maxLogSize: number = 100;

    private constructor() {}

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    public handleError(error: Error, context: string, showUser: boolean = false): void {
        const entry: ErrorEntry = {
            error,
            context,
            timestamp: new Date(),
            stack: error.stack || ''
        };

        this.errorLog.push(entry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console
        console.error(`[${context}]`, error);

        // Show to user if requested
        if (showUser) {
            this.showErrorToUser(error, context);
        }
    }

    private showErrorToUser(error: Error, context: string): void {
        const message = `Inline Error (${context}): ${error.message}`;
        
        vscode.window.showErrorMessage(message, 'View Logs', 'Dismiss').then(selection => {
            if (selection === 'View Logs') {
                this.showErrorLog();
            }
        });
    }

    public showErrorLog(): void {
        const doc = vscode.workspace.openTextDocument({
            content: this.formatErrorLog(),
            language: 'plaintext'
        });

        doc.then(document => {
            vscode.window.showTextDocument(document);
        });
    }

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
