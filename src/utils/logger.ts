import * as vscode from 'vscode';

export class Logger {
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.Info;

    constructor(name: string = 'Inline') {
        this.outputChannel = vscode.window.createOutputChannel(name);
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
    }

    public debug(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Debug) {
            this.log('DEBUG', message, args);
        }
    }

    public info(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Info) {
            this.log('INFO', message, args);
        }
    }

    public warn(message: string, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Warn) {
            this.log('WARN', message, args);
        }
    }

    public error(message: string, error?: Error, ...args: any[]): void {
        if (this.logLevel <= LogLevel.Error) {
            const errorMsg = error ? `${message}: ${error.message}\n${error.stack}` : message;
            this.log('ERROR', errorMsg, args);
        }
    }

    private log(level: string, message: string, args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
        const logMessage = `[${timestamp}] [${level}] ${message}${formattedArgs}`;
        
        this.outputChannel.appendLine(logMessage);
        
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(logMessage);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}

export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    None = 4
}
