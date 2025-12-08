import * as vscode from 'vscode';

/**
 * Structured logging service for the extension.
 *
 * Provides level-based filtering (Debug, Info, Warn, Error) with timestamped
 * output to VS Code's output channel. Includes stack traces for errors and
 * optional console output in development mode.
 */
export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.Info;

    constructor(name: string = 'Inline') {
        this.outputChannel = vscode.window.createOutputChannel(name);
    }

    /**
     * Set the minimum log level to display.
     * Messages below this level are filtered out.
     */
    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    /**
     * Log a debug message (lowest priority).
     * Only shown when log level is Debug.
     */
    public debug(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Debug) {
            this.log(LogLevel.Debug, message, args);
        }
    }

    /**
     * Log an informational message (normal operation).
     */
    public info(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Info) {
            this.log(LogLevel.Info, message, args);
        }
    }

    /**
     * Log a warning message (potential issue).
     */
    public warn(message: string, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Warn) {
            this.log(LogLevel.Warn, message, args);
        }
    }

    /**
     * Log an error message with optional stack trace.
     * Includes error.stack if Error object is provided.
     */
    public error(message: string, error?: Error, ...args: unknown[]): void {
        if (this.logLevel <= LogLevel.Error) {
            const errorMsg = error ? `${message}: ${error.message}\n${error.stack}` : message;
            this.log(LogLevel.Error, errorMsg, args);
        }
    }

    /**
     * Format and output log message with timestamp and level.
     * Includes optional console output for development builds.
     */
    private log(level: LogLevel, message: string, args: unknown[]): void {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
        const levelString = LogLevel[level].toUpperCase();
        const logMessage = `[${timestamp}] [${levelString}] ${message}${formattedArgs}`;

        this.outputChannel.appendLine(logMessage);

        // Mirror to console during development for faster iteration
        if (process.env.NODE_ENV === 'development') {
            console.log(logMessage);
        }
    }

    /**
     * Display the output channel in the editor.
     */
    public show(): void {
        this.outputChannel.show();
    }

    /**
     * Clean up resources when logger is no longer needed.
     */
    public dispose(): void {
        this.outputChannel.dispose();
    }
}

/**
 * Log level hierarchy for filtering messages.
 * Lower values = more verbose output.
 */
export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    None = 4
}
