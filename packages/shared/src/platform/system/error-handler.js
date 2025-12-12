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
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Centralized error handling and logging for the extension.
 *
 * Singleton that captures errors with context, maintains a rolling error log,
 * and optionally displays errors to the user with access to detailed logs.
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }
    /**
     * Get or create the singleton ErrorHandler instance.
     */
    static getInstance() {
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
    handleError(error, context, showUser = false) {
        const entry = {
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
    showErrorToUser(error, context) {
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
    showErrorLog() {
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
    formatErrorLog() {
        const lines = [
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
    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    }
    clearLog() {
        this.errorLog = [];
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=error-handler.js.map