import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    CodeModificationEvent, 
    CodeModificationEventType,
    CodeChange 
} from '../event-types';
import { Logger } from '@inline/shared';

/**
 * Collects code modification events from VS Code
 */
export class CodeModificationCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;

    constructor(eventBus: EventBus, normalizer: EventNormalizer) {
        this.logger = new Logger('CodeModificationCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }

    /**
     * Start collecting code modification events
     */
    public start(): void {
        this.logger.info('Starting code modification event collection');

        // Watch for document changes
        vscode.workspace.onDidChangeTextDocument(event => {
            this.handleDocumentChanged(event);
        }, null, this.disposables);
    }

    /**
     * Handle document changed event
     */
    private handleDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
        const document = event.document;
        const changes = event.contentChanges;

        if (changes.length === 0) {
            return;
        }

        // Detect modification type
        const modificationType = this.detectModificationType(event);
        
        // Convert VS Code changes to our format
        const codeChanges: CodeChange[] = changes.map(change => ({
            range: change.range,
            text: change.text,
            rangeLength: change.rangeLength
        }));

        // Detect multi-cursor edits
        const isMultiCursor = changes.length > 1;

        const modEvent: CodeModificationEvent = {
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
    private detectModificationType(event: vscode.TextDocumentChangeEvent): CodeModificationEventType {
        const changes = event.contentChanges;
        
        // Check for undo/redo
        if (event.reason === vscode.TextDocumentChangeReason.Undo) {
            return CodeModificationEventType.UNDO;
        }
        if (event.reason === vscode.TextDocumentChangeReason.Redo) {
            return CodeModificationEventType.REDO;
        }

        // Check for paste (large insertion)
        if (changes.length === 1 && changes[0].text.length > 50 && changes[0].rangeLength === 0) {
            return CodeModificationEventType.TEXT_PASTED;
        }

        // Check for line operations
        if (changes.some(c => c.text.includes('\n') || c.text.includes('\r'))) {
            if (changes.every(c => c.rangeLength === 0)) {
                return CodeModificationEventType.LINE_ADDED;
            } else if (changes.every(c => c.text === '')) {
                return CodeModificationEventType.LINE_REMOVED;
            }
        }

        // Check for character operations
        if (changes.every(c => c.text.length <= 1 && c.rangeLength <= 1)) {
            if (changes.every(c => c.rangeLength === 0)) {
                return CodeModificationEventType.CHARACTER_INSERTED;
            } else if (changes.every(c => c.text === '')) {
                return CodeModificationEventType.CHARACTER_DELETED;
            }
        }

        // Check for multi-cursor
        if (changes.length > 1) {
            return CodeModificationEventType.MULTI_CURSOR_EDIT;
        }

        // Default to character inserted
        return CodeModificationEventType.CHARACTER_INSERTED;
    }

    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent(event: CodeModificationEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping code modification event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
