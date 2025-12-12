import { AnyEvent } from '@inline/events';
/**
 * Event storage and indexing system
 */
export declare class EventStorage {
    private logger;
    private storagePath;
    private enabled;
    private maxStorageSize;
    private eventIndex;
    private currentSize;
    constructor(storagePath: string, enabled?: boolean, maxStorageSize?: number);
    /**
     * Initialize storage directory
     */
    private initializeStorage;
    /**
     * Store an event
     */
    storeEvent(event: AnyEvent): Promise<void>;
    /**
     * Store multiple events in batch
     */
    storeEvents(events: AnyEvent[]): Promise<void>;
    /**
     * Retrieve an event by ID
     */
    getEvent(eventId: string): Promise<AnyEvent | null>;
    /**
     * Query events by time range
     */
    queryEventsByTimeRange(startTime: number, endTime: number): Promise<AnyEvent[]>;
    /**
     * Load index from disk
     */
    private loadIndex;
    /**
     * Save index to disk
     */
    private saveIndex;
    /**
     * Clear all stored events
     */
    clearStorage(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStorageStats(): {
        enabled: boolean;
        currentSize: number;
        maxSize: number;
        usagePercent: number;
    };
    /**
     * Dispose storage
     */
    dispose(): Promise<void>;
}
//# sourceMappingURL=event-storage.d.ts.map