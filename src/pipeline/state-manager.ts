import * as vscode from 'vscode';
import { EventBus } from '../events/event-bus';
import { 
    AnyEvent,
    EditorEvent,
    CodeModificationEvent,
    FileSystemEvent,
    EventFilter,
    EventPriority,
    CursorPosition
} from '../events/event-types';
import { Logger } from '../utils/logger';

/**
 * Document state information
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
 * Edit record
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
 * Editor state model
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
 * State manager - maintains current editor state from events
 */
export class StateManager {
    private logger: Logger;
    private eventBus: EventBus;
    private subscriptionIds: string[] = [];
    private state: EditorStateModel;

    constructor(eventBus: EventBus, maxHistorySize: number = 100) {
        this.logger = new Logger('StateManager');
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
    public start(): void {
        this.logger.info('Starting state management');

        // Subscribe to editor events
        const editorFilter: EventFilter = {
            types: [
                'editor.cursor.moved',
                'editor.selection.changed',
                'editor.active.changed',
                'editor.scroll.changed'
            ]
        };

        const editorSubId = this.eventBus.subscribe(
            (event) => this.handleEditorEvent(event as EditorEvent),
            editorFilter,
            EventPriority.HIGH
        );

        // Subscribe to code modification events
        const codeFilter: EventFilter = {
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

        const codeSubId = this.eventBus.subscribe(
            (event) => this.handleCodeModificationEvent(event as CodeModificationEvent),
            codeFilter,
            EventPriority.HIGH
        );

        // Subscribe to file system events
        const fileFilter: EventFilter = {
            types: [
                'fs.file.opened',
                'fs.file.closed',
                'fs.file.saved'
            ]
        };

        const fileSubId = this.eventBus.subscribe(
            (event) => this.handleFileSystemEvent(event as FileSystemEvent),
            fileFilter,
            EventPriority.HIGH
        );

        this.subscriptionIds.push(editorSubId, codeSubId, fileSubId);
    }

    /**
     * Handle editor events
     */
    private handleEditorEvent(event: EditorEvent): void {
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
    private handleCodeModificationEvent(event: CodeModificationEvent): void {
        const uriString = event.document.uri.toString();
        const docState = this.state.openDocuments.get(uriString);

        if (docState) {
            // Create edit record
            const editRecord: EditRecord = {
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
    private handleFileSystemEvent(event: FileSystemEvent): void {
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
    private addToCursorHistory(uri: vscode.Uri, position: CursorPosition, timestamp: number): void {
        this.state.cursorHistory.push({ uri, position, timestamp });
        if (this.state.cursorHistory.length > this.state.maxHistorySize) {
            this.state.cursorHistory.shift();
        }
    }

    /**
     * Add to selection history
     */
    private addToSelectionHistory(uri: vscode.Uri, selections: vscode.Selection[], timestamp: number): void {
        this.state.selectionHistory.push({ uri, selections, timestamp });
        if (this.state.selectionHistory.length > this.state.maxHistorySize) {
            this.state.selectionHistory.shift();
        }
    }

    /**
     * Get current state
     */
    public getState(): EditorStateModel {
        return this.state;
    }

    /**
     * Get active document state
     */
    public getActiveDocumentState(): DocumentState | null {
        return this.state.activeDocument;
    }

    /**
     * Get document state by URI
     */
    public getDocumentState(uri: vscode.Uri): DocumentState | undefined {
        return this.state.openDocuments.get(uri.toString());
    }

    /**
     * Get recent edits for a document
     */
    public getRecentEdits(uri?: vscode.Uri, count: number = 10): EditRecord[] {
        if (uri) {
            const docState = this.state.openDocuments.get(uri.toString());
            return docState?.recentEdits.slice(-count) || [];
        }
        return this.state.recentEdits.slice(-count);
    }

    /**
     * Get cursor history
     */
    public getCursorHistory(count: number = 10): Array<{
        uri: vscode.Uri;
        position: CursorPosition;
        timestamp: number;
    }> {
        return this.state.cursorHistory.slice(-count);
    }

    /**
     * Get selection history
     */
    public getSelectionHistory(count: number = 10): Array<{
        uri: vscode.Uri;
        selections: vscode.Selection[];
        timestamp: number;
    }> {
        return this.state.selectionHistory.slice(-count);
    }

    /**
     * Clear history
     */
    public clearHistory(): void {
        this.state.cursorHistory = [];
        this.state.selectionHistory = [];
        this.state.recentEdits = [];
    }

    /**
     * Dispose state manager
     */
    public dispose(): void {
        this.logger.info('Stopping state management');
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
        this.state.openDocuments.clear();
    }
}
