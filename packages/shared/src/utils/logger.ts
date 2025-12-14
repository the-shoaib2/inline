/**
 * Centralized logging utility with configurable log levels
 */

export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

export class Logger {
    private static instance: Logger;
    private logLevel: LogLevel = LogLevel.WARN; // Default to WARN
    private prefix: string;

    private constructor(prefix: string = '[INLINE]') {
        this.prefix = prefix;
    }

    public static getInstance(prefix?: string): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(prefix);
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public getLogLevel(): LogLevel {
        return this.logLevel;
    }

    public error(message: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.ERROR) {
            console.error(`${this.prefix} ❌`, message, ...args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.WARN) {
            console.warn(`${this.prefix} ⚠️`, message, ...args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.INFO) {
            console.log(`${this.prefix} ℹ️`, message, ...args);
        }
    }

    public debug(message: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.DEBUG) {
            console.log(`${this.prefix} 🔍`, message, ...args);
        }
    }

    public success(message: string, ...args: any[]): void {
        if (this.logLevel >= LogLevel.INFO) {
            console.log(`${this.prefix} ✅`, message, ...args);
        }
    }
}

// Export singleton instance
export const logger = Logger.getInstance();
