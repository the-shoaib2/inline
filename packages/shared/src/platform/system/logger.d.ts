/**
 * Structured logging service for the extension.
 *
 * Provides level-based filtering (Debug, Info, Warn, Error) with timestamped
 * output to VS Code's output channel. Includes stack traces for errors and
 * optional console output in development mode.
 */
export declare class Logger {
    private outputChannel;
    private logLevel;
    constructor(name?: string);
    /**
     * Set the minimum log level to display.
     * Messages below this level are filtered out.
     */
    setLogLevel(level: LogLevel): void;
    /**
     * Log a debug message (lowest priority).
     * Only shown when log level is Debug.
     */
    debug(message: string, ...args: unknown[]): void;
    /**
     * Log an informational message (normal operation).
     */
    info(message: string, ...args: unknown[]): void;
    /**
     * Log a warning message (potential issue).
     */
    warn(message: string, ...args: unknown[]): void;
    /**
     * Log an error message with optional stack trace.
     * Includes error.stack if Error object is provided.
     */
    error(message: string, error?: Error, ...args: unknown[]): void;
    /**
     * Format and output log message with timestamp and level.
     * Includes optional console output for development builds.
     */
    private log;
    /**
     * Display the output channel in the editor.
     */
    show(): void;
    /**
     * Clean up resources when logger is no longer needed.
     */
    dispose(): void;
}
/**
 * Log level hierarchy for filtering messages.
 * Lower values = more verbose output.
 */
export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    None = 4
}
//# sourceMappingURL=logger.d.ts.map