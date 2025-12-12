import * as vscode from 'vscode';
import { EventBus } from '@inline/events';
import { CursorPosition } from '@inline/events';
/**
 * Snapshot of a single document's state.
 * Includes cursor position, selections, and recent edits.
 */
export interface DocumentState {
    uri: vscode.Uri;
    languageId: string;
    version: number;
    lastModified: number;
    cursorPosition?: CursorPosition;
    selections: vscode.Selection[];
    visibleRange?: vscode.Range;
    recentEdits: EditRecord[];
}
/**
 * Single edit operation with timestamp and change details.
 */
export interface EditRecord {
    timestamp: number;
    changes: Array<{
        range: vscode.Range;
        text: string;
    }>;
    type: string;
}
/**
 * Complete editor state model.
 * Maintains active document, open files, and activity history.
 */
export interface EditorStateModel {
    activeDocument: DocumentState | null;
    openDocuments: Map<string, DocumentState>;
    cursorHistory: Array<{
        uri: vscode.Uri;
        position: CursorPosition;
        timestamp: number;
    }>;
    selectionHistory: Array<{
        uri: vscode.Uri;
        selections: vscode.Selection[];
        timestamp: number;
    }>;
    recentEdits: EditRecord[];
    maxHistorySize: number;
}
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
export declare class StateManager {
    private logger;
    private eventBus;
    private subscriptionIds;
    private state;
    /**
     * Initialize state manager with event bus.
     * @param eventBus Event bus for editor events
     * @param maxHistorySize Maximum history entries to keep (default: 100)
     */
    constructor(eventBus: EventBus, maxHistorySize?: number);
    /**
     * Start state management
     */
    start(): void;
    /**
     * Handle editor events
     */
    private handleEditorEvent;
    /**
     * Handle code modification events
     */
    private handleCodeModificationEvent;
    /**
     * Handle file system events
     */
    private handleFileSystemEvent;
    /**
     * Add to cursor history
     */
    private addToCursorHistory;
    /**
     * Add to selection history
     */
    private addToSelectionHistory;
    /**
     * Get current state
     */
    getState(): EditorStateModel;
    /**
     * Get active document state
     */
    getActiveDocumentState(): DocumentState | null;
    /**
     * Get document state by URI
     */
    getDocumentState(uri: vscode.Uri): DocumentState | undefined;
    /**
     * Get recent edits for a document
     */
    getRecentEdits(uri?: vscode.Uri, count?: number): EditRecord[];
    /**
     * Get cursor history
     */
    getCursorHistory(count?: number): Array<{
        uri: vscode.Uri;
        position: CursorPosition;
        timestamp: number;
    }>;
    /**
     * Get selection history
     */
    getSelectionHistory(count?: number): Array<{
        uri: vscode.Uri;
        selections: vscode.Selection[];
        timestamp: number;
    }>;
    /**
     * Clear history
     */
    clearHistory(): void;
    /**
     * Dispose state manager
     */
    dispose(): void;
}
//# sourceMappingURL=state-manager.d.ts.map