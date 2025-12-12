"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const events_1 = require("@inline/events");
const shared_1 = require("@inline/shared");
/**
 * Maintains editor state synchronized with event stream.
 *
 * Responsibilities:
 * - Track active document and open files
 * - Record cursor position and selection history
 * - Maintain recent edits with timestamps
 * - Subscribe to editor events for state updates
 * - Provide state queries for context building
 */
class StateManager {
    /**
     * Initialize state manager with event bus.
     * @param eventBus Event bus for editor events
     * @param maxHistorySize Maximum history entries to keep (default: 100)
     */
    constructor(eventBus, maxHistorySize = 100) {
        this.subscriptionIds = [];
        this.logger = new shared_1.Logger('StateManager');
        this.eventBus = eventBus;
        this.state = {
            activeDocument: null,
            openDocuments: new Map(),
            cursorHistory: [],
            selectionHistory: [],
            recentEdits: [],
            maxHistorySize
        };
    }
    /**
     * Start state management
     */
    start() {
        this.logger.info('Starting state management');
        // Subscribe to editor events
        const editorFilter = {
            types: [
                'editor.cursor.moved',
                'editor.selection.changed',
                'editor.active.changed',
                'editor.scroll.changed'
            ]
        };
        const editorSubId = this.eventBus.subscribe((event) => this.handleEditorEvent(event), editorFilter, events_1.EventPriority.HIGH);
        // Subscribe to code modification events
        const codeFilter = {
            types: [
                'code.char.inserted',
                'code.char.deleted',
                'code.line.added',
                'code.line.removed',
                'code.paste',
                'code.undo',
                'code.redo'
            ]
        };
        const codeSubId = this.eventBus.subscribe((event) => this.handleCodeModificationEvent(event), codeFilter, events_1.EventPriority.HIGH);
        // Subscribe to file system events
        const fileFilter = {
            types: [
                'fs.file.opened',
                'fs.file.closed',
                'fs.file.saved'
            ]
        };
        const fileSubId = this.eventBus.subscribe((event) => this.handleFileSystemEvent(event), fileFilter, events_1.EventPriority.HIGH);
        this.subscriptionIds.push(editorSubId, codeSubId, fileSubId);
    }
    /**
     * Handle editor events
     */
    handleEditorEvent(event) {
        const uriString = event.document.uri.toString();
        // Get or create document state
        let docState = this.state.openDocuments.get(uriString);
        if (!docState) {
            docState = {
                uri: event.document.uri,
                languageId: event.document.languageId,
                version: event.document.version,
                lastModified: event.timestamp,
                selections: [],
                recentEdits: []
            };
            this.state.openDocuments.set(uriString, docState);
        }
        // Update based on event type
        switch (event.type) {
            case 'editor.cursor.moved':
                if (event.position) {
                    docState.cursorPosition = event.position;
                    this.addToCursorHistory(event.document.uri, event.position, event.timestamp);
                }
                break;
            case 'editor.selection.changed':
                if (event.selections) {
                    docState.selections = event.selections;
                    this.addToSelectionHistory(event.document.uri, event.selections, event.timestamp);
                }
                break;
            case 'editor.active.changed':
                this.state.activeDocument = docState;
                break;
            case 'editor.scroll.changed':
                if (event.visibleRange) {
                    docState.visibleRange = event.visibleRange;
                }
                break;
        }
        docState.lastModified = event.timestamp;
    }
    /**
     * Handle code modification events
     */
    handleCodeModificationEvent(event) {
        const uriString = event.document.uri.toString();
        const docState = this.state.openDocuments.get(uriString);
        if (docState) {
            // Create edit record
            const editRecord = {
                timestamp: event.timestamp,
                changes: event.changes.map(c => ({
                    range: c.range,
                    text: c.text
                })),
                type: event.type
            };
            // Add to document's recent edits
            docState.recentEdits.push(editRecord);
            if (docState.recentEdits.length > 50) {
                docState.recentEdits.shift();
            }
            // Add to global recent edits
            this.state.recentEdits.push(editRecord);
            if (this.state.recentEdits.length > this.state.maxHistorySize) {
                this.state.recentEdits.shift();
            }
            docState.version = event.document.version;
            docState.lastModified = event.timestamp;
        }
    }
    /**
     * Handle file system events
     */
    handleFileSystemEvent(event) {
        const uriString = event.uri.toString();
        switch (event.type) {
            case 'fs.file.opened':
                // Document state will be created when editor event arrives
                break;
            case 'fs.file.closed':
                this.state.openDocuments.delete(uriString);
                if (this.state.activeDocument?.uri.toString() === uriString) {
                    this.state.activeDocument = null;
                }
                break;
            case 'fs.file.saved':
                const docState = this.state.openDocuments.get(uriString);
                if (docState) {
                    docState.lastModified = event.timestamp;
                }
                break;
        }
    }
    /**
     * Add to cursor history
     */
    addToCursorHistory(uri, position, timestamp) {
        this.state.cursorHistory.push({ uri, position, timestamp });
        if (this.state.cursorHistory.length > this.state.maxHistorySize) {
            this.state.cursorHistory.shift();
        }
    }
    /**
     * Add to selection history
     */
    addToSelectionHistory(uri, selections, timestamp) {
        this.state.selectionHistory.push({ uri, selections, timestamp });
        if (this.state.selectionHistory.length > this.state.maxHistorySize) {
            this.state.selectionHistory.shift();
        }
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
    /**
     * Get active document state
     */
    getActiveDocumentState() {
        return this.state.activeDocument;
    }
    /**
     * Get document state by URI
     */
    getDocumentState(uri) {
        return this.state.openDocuments.get(uri.toString());
    }
    /**
     * Get recent edits for a document
     */
    getRecentEdits(uri, count = 10) {
        if (uri) {
            const docState = this.state.openDocuments.get(uri.toString());
            return docState?.recentEdits.slice(-count) || [];
        }
        return this.state.recentEdits.slice(-count);
    }
    /**
     * Get cursor history
     */
    getCursorHistory(count = 10) {
        return this.state.cursorHistory.slice(-count);
    }
    /**
     * Get selection history
     */
    getSelectionHistory(count = 10) {
        return this.state.selectionHistory.slice(-count);
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.state.cursorHistory = [];
        this.state.selectionHistory = [];
        this.state.recentEdits = [];
    }
    /**
     * Dispose state manager
     */
    dispose() {
        this.logger.info('Stopping state management');
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
        this.state.openDocuments.clear();
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=state-manager.js.map