/**
 * Centralized error handling and logging for the extension.
 *
 * Singleton that captures errors with context, maintains a rolling error log,
 * and optionally displays errors to the user with access to detailed logs.
 */
export declare class ErrorHandler {
    private static instance;
    private errorLog;
    private maxLogSize;
    private constructor();
    /**
     * Get or create the singleton ErrorHandler instance.
     */
    static getInstance(): ErrorHandler;
    /**
     * Record an error with context information.
     * Maintains rolling log and optionally notifies user.
     *
     * @param error The error object
     * @param context Human-readable context (e.g., 'ModelManager.loadModel')
     * @param showUser If true, display error notification to user
     */
    handleError(error: Error, context: string, showUser?: boolean): void;
    /**
     * Display error notification with option to view detailed logs.
     */
    private showErrorToUser;
    /**
     * Open error log in a new text document for user inspection.
     */
    showErrorLog(): void;
    /**
     * Format error log entries as readable text with timestamps and stack traces.
     */
    private formatErrorLog;
    getRecentErrors(count?: number): ErrorEntry[];
    clearLog(): void;
}
interface ErrorEntry {
    error: Error;
    context: string;
    timestamp: Date;
    stack: string;
}
export {};
//# sourceMappingURL=error-handler.d.ts.map