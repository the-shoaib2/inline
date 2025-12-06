import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    EditorEvent, 
    EditorEventType,
    CursorPosition 
} from '../event-types';
import { Logger } from '../../utils/logger';

/**
 * Collects editor-related events from VS Code
 */
export class EditorCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private lastCursorPosition: CursorPosition | null = null;
    private cursorDebounceTimer: NodeJS.Timeout | null = null;
    private readonly cursorDebounceMs: number;

    constructor(
        eventBus: EventBus, 
        normalizer: EventNormalizer,
        cursorDebounceMs: number = 100
    ) {
        this.logger = new Logger('EditorCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.cursorDebounceMs = cursorDebounceMs;
    }

    /**
     * Start collecting editor events
     */
    public start(): void {
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
    private handleSelectionChanged(event: vscode.TextEditorSelectionChangeEvent): void {
        const editor = event.textEditor;
        const selections = event.selections;

        // Emit selection changed event
        const selectionEvent: EditorEvent = {
            id: '',
            type: EditorEventType.SELECTION_CHANGED,
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
        const cursorPosition: CursorPosition = {
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
    private hasCursorMoved(position: CursorPosition): boolean {
        if (!this.lastCursorPosition) {
            return true;
        }

        return this.lastCursorPosition.line !== position.line ||
               this.lastCursorPosition.character !== position.character;
    }

    /**
     * Debounced cursor move event
     */
    private debouncedCursorMove(editor: vscode.TextEditor, position: CursorPosition): void {
        if (this.cursorDebounceTimer) {
            clearTimeout(this.cursorDebounceTimer);
        }

        this.cursorDebounceTimer = setTimeout(() => {
            const event: EditorEvent = {
                id: '',
                type: EditorEventType.CURSOR_MOVED,
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
    private handleVisibleRangesChanged(event: vscode.TextEditorVisibleRangesChangeEvent): void {
        const editor = event.textEditor;
        const visibleRanges = event.visibleRanges;

        if (visibleRanges.length > 0) {
            const scrollEvent: EditorEvent = {
                id: '',
                type: EditorEventType.SCROLL_CHANGED,
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
    private handleActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
        if (!editor) {
            return;
        }

        const event: EditorEvent = {
            id: '',
            type: EditorEventType.ACTIVE_EDITOR_CHANGED,
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
    private handleVisibleEditorsChanged(editors: readonly vscode.TextEditor[]): void {
        const event: EditorEvent = {
            id: '',
            type: EditorEventType.VISIBLE_EDITORS_CHANGED,
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
    private handleViewColumnChanged(event: vscode.TextEditorViewColumnChangeEvent): void {
        const editor = event.textEditor;

        const splitEvent: EditorEvent = {
            id: '',
            type: EditorEventType.SPLIT_VIEW_CHANGED,
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
    private emitEvent(event: EditorEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping editor event collection');
        
        if (this.cursorDebounceTimer) {
            clearTimeout(this.cursorDebounceTimer);
            this.cursorDebounceTimer = null;
        }

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
