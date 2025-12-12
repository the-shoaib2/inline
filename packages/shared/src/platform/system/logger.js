"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.Logger = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Structured logging service for the extension.
 *
 * Provides level-based filtering (Debug, Info, Warn, Error) with timestamped
 * output to VS Code's output channel. Includes stack traces for errors and
 * optional console output in development mode.
 */
class Logger {
    constructor(name = 'Inline') {
        this.logLevel = LogLevel.Info;
        this.outputChannel = vscode.window.createOutputChannel(name);
    }
    /**
     * Set the minimum log level to display.
     * Messages below this level are filtered out.
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Log a debug message (lowest priority).
     * Only shown when log level is Debug.
     */
    debug(message, ...args) {
        if (this.logLevel <= LogLevel.Debug) {
            this.log(LogLevel.Debug, message, args);
        }
    }
    /**
     * Log an informational message (normal operation).
     */
    info(message, ...args) {
        if (this.logLevel <= LogLevel.Info) {
            this.log(LogLevel.Info, message, args);
        }
    }
    /**
     * Log a warning message (potential issue).
     */
    warn(message, ...args) {
        if (this.logLevel <= LogLevel.Warn) {
            this.log(LogLevel.Warn, message, args);
        }
    }
    /**
     * Log an error message with optional stack trace.
     * Includes error.stack if Error object is provided.
     */
    error(message, error, ...args) {
        if (this.logLevel <= LogLevel.Error) {
            const errorMsg = error ? `${message}: ${error.message}\n${error.stack}` : message;
            this.log(LogLevel.Error, errorMsg, args);
        }
    }
    /**
     * Format and output log message with timestamp and level.
     * Includes optional console output for development builds.
     */
    log(level, message, args) {
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
    show() {
        this.outputChannel.show();
    }
    /**
     * Clean up resources when logger is no longer needed.
     */
    dispose() {
        this.outputChannel.dispose();
    }
}
exports.Logger = Logger;
/**
 * Log level hierarchy for filtering messages.
 * Lower values = more verbose output.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
    LogLevel[LogLevel["None"] = 4] = "None";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
//# sourceMappingURL=logger.js.map