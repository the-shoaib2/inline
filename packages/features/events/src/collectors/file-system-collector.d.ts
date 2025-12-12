import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects file system events from VS Code
 */
export declare class FileSystemCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    private fileWatcher;
    constructor(eventBus: EventBus, normalizer: EventNormalizer);
    /**
     * Start collecting file system events
     */
    start(): void;
    /**
     * Handle file created event
     */
    private handleFileCreated;
    /**
     * Handle file deleted event
     */
    private handleFileDeleted;
    /**
     * Handle file modified event
     */
    private handleFileModified;
    /**
     * Handle file saved event
     */
    private handleFileSaved;
    /**
     * Handle file opened event
     */
    private handleFileOpened;
    /**
     * Handle file closed event
     */
    private handleFileClosed;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=file-system-collector.d.ts.map