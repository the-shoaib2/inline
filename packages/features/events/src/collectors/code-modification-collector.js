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
exports.CodeModificationCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects code modification events from VS Code
 */
class CodeModificationCollector {
    constructor(eventBus, normalizer) {
        this.disposables = [];
        this.logger = new shared_1.Logger('CodeModificationCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }
    /**
     * Start collecting code modification events
     */
    start() {
        this.logger.info('Starting code modification event collection');
        // Watch for document changes
        vscode.workspace.onDidChangeTextDocument(event => {
            this.handleDocumentChanged(event);
        }, null, this.disposables);
    }
    /**
     * Handle document changed event
     */
    handleDocumentChanged(event) {
        const document = event.document;
        const changes = event.contentChanges;
        if (changes.length === 0) {
            return;
        }
        // Detect modification type
        const modificationType = this.detectModificationType(event);
        // Convert VS Code changes to our format
        const codeChanges = changes.map(change => ({
            range: change.range,
            text: change.text,
            rangeLength: change.rangeLength
        }));
        // Detect multi-cursor edits
        const isMultiCursor = changes.length > 1;
        const modEvent = {
            id: '',
            type: modificationType,
            timestamp: Date.now(),
            source: 'code-modification-collector',
            document: {
                uri: document.uri,
                languageId: document.languageId,
                version: document.version
            },
            changes: codeChanges,
            reason: event.reason,
            isMultiCursor,
            cursorCount: changes.length
        };
        this.emitEvent(modEvent);
    }
    /**
     * Detect the type of modification
     */
    detectModificationType(event) {
        const changes = event.contentChanges;
        // Check for undo/redo
        if (event.reason === vscode.TextDocumentChangeReason.Undo) {
            return event_types_1.CodeModificationEventType.UNDO;
        }
        if (event.reason === vscode.TextDocumentChangeReason.Redo) {
            return event_types_1.CodeModificationEventType.REDO;
        }
        // Check for paste (large insertion)
        if (changes.length === 1 && changes[0].text.length > 50 && changes[0].rangeLength === 0) {
            return event_types_1.CodeModificationEventType.TEXT_PASTED;
        }
        // Check for line operations
        if (changes.some(c => c.text.includes('\n') || c.text.includes('\r'))) {
            if (changes.every(c => c.rangeLength === 0)) {
                return event_types_1.CodeModificationEventType.LINE_ADDED;
            }
            else if (changes.every(c => c.text === '')) {
                return event_types_1.CodeModificationEventType.LINE_REMOVED;
            }
        }
        // Check for character operations
        if (changes.every(c => c.text.length <= 1 && c.rangeLength <= 1)) {
            if (changes.every(c => c.rangeLength === 0)) {
                return event_types_1.CodeModificationEventType.CHARACTER_INSERTED;
            }
            else if (changes.every(c => c.text === '')) {
                return event_types_1.CodeModificationEventType.CHARACTER_DELETED;
            }
        }
        // Check for multi-cursor
        if (changes.length > 1) {
            return event_types_1.CodeModificationEventType.MULTI_CURSOR_EDIT;
        }
        // Default to character inserted
        return event_types_1.CodeModificationEventType.CHARACTER_INSERTED;
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
        this.logger.info('Stopping code modification event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.CodeModificationCollector = CodeModificationCollector;
//# sourceMappingURL=code-modification-collector.js.map