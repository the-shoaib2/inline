import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    FileSystemEvent, 
    FileSystemEventType 
} from '../event-types';
import { Logger } from '@inline/shared';

/**
 * Collects file system events from VS Code
 */
export class FileSystemCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private fileWatcher: vscode.FileSystemWatcher | null = null;

    constructor(eventBus: EventBus, normalizer: EventNormalizer) {
        this.logger = new Logger('FileSystemCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }

    /**
     * Start collecting file system events
     */
    public start(): void {
        this.logger.info('Starting file system event collection');

        // Watch for file creation
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');
        
        this.fileWatcher.onDidCreate(uri => {
            this.handleFileCreated(uri);
        }, null, this.disposables);

        this.fileWatcher.onDidDelete(uri => {
            this.handleFileDeleted(uri);
        }, null, this.disposables);

        this.fileWatcher.onDidChange(uri => {
            this.handleFileModified(uri);
        }, null, this.disposables);

        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument(document => {
            this.handleFileSaved(document);
        }, null, this.disposables);

        // Watch for file opens
        vscode.workspace.onDidOpenTextDocument(document => {
            this.handleFileOpened(document);
        }, null, this.disposables);

        // Watch for file closes
        vscode.workspace.onDidCloseTextDocument(document => {
            this.handleFileClosed(document);
        }, null, this.disposables);
    }

    /**
     * Handle file created event
     */
    private handleFileCreated(uri: vscode.Uri): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_CREATED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri
        };

        this.emitEvent(event);
    }

    /**
     * Handle file deleted event
     */
    private handleFileDeleted(uri: vscode.Uri): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_DELETED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri
        };

        this.emitEvent(event);
    }

    /**
     * Handle file modified event
     */
    private handleFileModified(uri: vscode.Uri): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_MODIFIED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri,
            isExternal: true
        };

        this.emitEvent(event);
    }

    /**
     * Handle file saved event
     */
    private handleFileSaved(document: vscode.TextDocument): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_SAVED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri,
            isAutoSave: false // VS Code doesn't provide this info directly
        };

        this.emitEvent(event);
    }

    /**
     * Handle file opened event
     */
    private handleFileOpened(document: vscode.TextDocument): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_OPENED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri
        };

        this.emitEvent(event);
    }

    /**
     * Handle file closed event
     */
    private handleFileClosed(document: vscode.TextDocument): void {
        const event: FileSystemEvent = {
            id: '',
            type: FileSystemEventType.FILE_CLOSED,
            timestamp: Date.now(),
            source: 'file-system-collector',
            uri: document.uri
        };

        this.emitEvent(event);
    }

    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent(event: FileSystemEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping file system event collection');
        
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
