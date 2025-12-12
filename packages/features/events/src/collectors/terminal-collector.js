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
exports.TerminalCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects terminal events (execution, lifecycle) from VS Code
 */
class TerminalCollector {
    constructor(eventBus, normalizer) {
        this.disposables = [];
        this.logger = new shared_1.Logger('TerminalCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }
    /**
     * Start collecting terminal events
     */
    start() {
        this.logger.info('Starting terminal event collection');
        // Watch for terminal open
        vscode.window.onDidOpenTerminal((terminal) => {
            this.emitTerminalEvent(event_types_1.UserInteractionEventType.TERMINAL_SESSION_STARTED, terminal);
        }, null, this.disposables);
        // Watch for terminal close
        vscode.window.onDidCloseTerminal((terminal) => {
            this.emitTerminalEvent(event_types_1.UserInteractionEventType.TERMINAL_SESSION_ENDED, terminal);
        }, null, this.disposables);
        // Watch for shell execution (New API in recent VS Code versions)
        // Check if onDidStartTerminalShellExecution exists (might be proposed API or recent)
        // For standard VS Code API 1.85+, we might have limited access to command strings unless we use task API or shell integration
        // However, we can track that *something* happened.
        // If we want to capture actual commands, we might need to rely on the "shell integration" events if available, 
        // or just track active terminal title changes / generic activity.
        // Using `onDidStartTerminalShellExecution` if available (VS Code 1.93+?) - Wait, let's check basic support.
        // For now, we will simulate command tracking via generic means or available APIs.
        // Since we are targeting compatibility, we'll stick to basic lifecycle + active terminal checks.
        // Note: VS Code recently added `vscode.window.onDidStartTerminalShellExecution`. 
        // We'll check for its existence at runtime to be safe or use `any` casting.
        if (vscode.window.onDidStartTerminalShellExecution) {
            vscode.window.onDidStartTerminalShellExecution((event) => {
                this.handleShellExecution(event);
            }, null, this.disposables);
        }
    }
    emitTerminalEvent(type, terminal) {
        const event = {
            id: '',
            type: type,
            timestamp: Date.now(),
            source: 'terminal-collector',
            metadata: {
                name: terminal.name,
                processId: terminal.processId
            }
        };
        this.emitEvent(event);
    }
    handleShellExecution(event) {
        // event.commandLine contains the command
        const userEvent = {
            id: '',
            type: event_types_1.UserInteractionEventType.TERMINAL_COMMAND_EXECUTED,
            timestamp: Date.now(),
            source: 'terminal-collector',
            command: event.commandLine?.value || event.commandLine || 'unknown', // Adjust based on API structure
            metadata: {
                cwd: event.cwd,
                exitCode: event.exitCode
            }
        };
        this.emitEvent(userEvent);
    }
    /**
     * Emit event through normalizer and event bus
     */
    emitEvent(event) {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }
    /**
     * Stop collecting events and dispose resources
     */
    dispose() {
        this.logger.info('Stopping terminal event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.TerminalCollector = TerminalCollector;
//# sourceMappingURL=terminal-collector.js.map