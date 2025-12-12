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
exports.EditorCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects editor-related events from VS Code
 */
class EditorCollector {
    constructor(eventBus, normalizer, cursorDebounceMs = 100) {
        this.disposables = [];
        this.lastCursorPosition = null;
        this.cursorDebounceTimer = null;
        this.logger = new shared_1.Logger('EditorCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.cursorDebounceMs = cursorDebounceMs;
    }
    /**
     * Start collecting editor events
     */
    start() {
        this.logger.info('Starting editor event collection');
        // Watch for cursor/selection changes
        vscode.window.onDidChangeTextEditorSelection(event => {
            this.handleSelectionChanged(event);
        }, null, this.disposables);
        // Watch for visible range changes (scrolling)
        vscode.window.onDidChangeTextEditorVisibleRanges(event => {
            this.handleVisibleRangesChanged(event);
        }, null, this.disposables);
        // Watch for active editor changes
        vscode.window.onDidChangeActiveTextEditor(editor => {
            this.handleActiveEditorChanged(editor);
        }, null, this.disposables);
        // Watch for visible editors changes
        vscode.window.onDidChangeVisibleTextEditors(editors => {
            this.handleVisibleEditorsChanged(editors);
        }, null, this.disposables);
        // Watch for viewport changes (view column changes)
        vscode.window.onDidChangeTextEditorViewColumn(event => {
            this.handleViewColumnChanged(event);
        }, null, this.disposables);
    }
    /**
     * Handle selection changed event
     */
    handleSelectionChanged(event) {
        const editor = event.textEditor;
        const selections = event.selections;
        // Emit selection changed event
        const selectionEvent = {
            id: '',
            type: event_types_1.EditorEventType.SELECTION_CHANGED,
            timestamp: Date.now(),
            source: 'editor-collector',
            document: {
                uri: editor.document.uri,
                languageId: editor.document.languageId,
                version: editor.document.version
            },
            selections: [...selections]
        };
        this.emitEvent(selectionEvent);
        // Debounced cursor position event
        const cursorPosition = {
            line: selections[0].active.line,
            character: selections[0].active.character
        };
        // Only emit if position actually changed
        if (this.hasCursorMoved(cursorPosition)) {
            this.debouncedCursorMove(editor, cursorPosition);
        }
    }
    /**
     * Check if cursor has moved
     */
    hasCursorMoved(position) {
        if (!this.lastCursorPosition) {
            return true;
        }
        return this.lastCursorPosition.line !== position.line ||
            this.lastCursorPosition.character !== position.character;
    }
    /**
     * Debounced cursor move event
     */
    debouncedCursorMove(editor, position) {
        if (this.cursorDebounceTimer) {
            clearTimeout(this.cursorDebounceTimer);
        }
        this.cursorDebounceTimer = setTimeout(() => {
            const event = {
                id: '',
                type: event_types_1.EditorEventType.CURSOR_MOVED,
                timestamp: Date.now(),
                source: 'editor-collector',
                document: {
                    uri: editor.document.uri,
                    languageId: editor.document.languageId,
                    version: editor.document.version
                },
                position: position
            };
            this.emitEvent(event);
            this.lastCursorPosition = position;
        }, this.cursorDebounceMs);
    }
    /**
     * Handle visible ranges changed (scroll)
     */
    handleVisibleRangesChanged(event) {
        const editor = event.textEditor;
        const visibleRanges = event.visibleRanges;
        if (visibleRanges.length > 0) {
            const scrollEvent = {
                id: '',
                type: event_types_1.EditorEventType.SCROLL_CHANGED,
                timestamp: Date.now(),
                source: 'editor-collector',
                document: {
                    uri: editor.document.uri,
                    languageId: editor.document.languageId,
                    version: editor.document.version
                },
                visibleRange: visibleRanges[0]
            };
            this.emitEvent(scrollEvent);
        }
    }
    /**
     * Handle active editor changed
     */
    handleActiveEditorChanged(editor) {
        if (!editor) {
            return;
        }
        const event = {
            id: '',
            type: event_types_1.EditorEventType.ACTIVE_EDITOR_CHANGED,
            timestamp: Date.now(),
            source: 'editor-collector',
            document: {
                uri: editor.document.uri,
                languageId: editor.document.languageId,
                version: editor.document.version
            },
            position: {
                line: editor.selection.active.line,
                character: editor.selection.active.character
            }
        };
        this.emitEvent(event);
    }
    /**
     * Handle visible editors changed
     */
    handleVisibleEditorsChanged(editors) {
        const event = {
            id: '',
            type: event_types_1.EditorEventType.VISIBLE_EDITORS_CHANGED,
            timestamp: Date.now(),
            source: 'editor-collector',
            document: {
                uri: editors[0]?.document.uri || vscode.Uri.parse(''),
                languageId: editors[0]?.document.languageId || '',
                version: editors[0]?.document.version || 0
            },
            metadata: {
                editorCount: editors.length
            }
        };
        this.emitEvent(event);
    }
    /**
     * Handle view column changed (split view)
     */
    handleViewColumnChanged(event) {
        const editor = event.textEditor;
        const splitEvent = {
            id: '',
            type: event_types_1.EditorEventType.SPLIT_VIEW_CHANGED,
            timestamp: Date.now(),
            source: 'editor-collector',
            document: {
                uri: editor.document.uri,
                languageId: editor.document.languageId,
                version: editor.document.version
            },
            metadata: {
                viewColumn: event.viewColumn
            }
        };
        this.emitEvent(splitEvent);
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
        this.logger.info('Stopping editor event collection');
        if (this.cursorDebounceTimer) {
            clearTimeout(this.cursorDebounceTimer);
            this.cursorDebounceTimer = null;
        }
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
exports.EditorCollector = EditorCollector;
//# sourceMappingURL=editor-collector.js.map