import { AnyEvent } from '@inline/events';
/**
 * Event normalizer - converts platform-specific events to standard format
 * and performs deduplication, filtering, and batching
 */
export declare class EventNormalizer {
    private logger;
    private lastEvents;
    private readonly deduplicationWindow;
    private batchBuffer;
    private batchTimer;
    private readonly batchDelay;
    private readonly batchSize;
    constructor(deduplicationWindow?: number, batchDelay?: number, batchSize?: number);
    /**
     * Normalize a single event
     */
    normalize(event: AnyEvent): AnyEvent | null;
    /**
     * Normalize multiple events
     */
    normalizeMany(events: AnyEvent[]): AnyEvent[];
    /**
     * Add event to batch buffer
     */
    addToBatch(event: AnyEvent, onFlush: (events: AnyEvent[]) => void): void;
    /**
     * Flush the batch buffer
     */
    private flushBatch;
    /**
     * Generate a unique event ID
     */
    private generateEventId;
    /**
     * Check if event is a duplicate
     */
    private isDuplicate;
    /**
     * Record event for deduplication tracking
     */
    private recordEvent;
    /**
     * Get a unique key for event deduplication
     */
    private getEventKey;
    /**
     * Check if event is noise (should be filtered out)
     */
    private isNoise;
    /**
     * Enrich event metadata
     */
    private enrichMetadata;
    /**
     * Clean up old deduplication entries
     */
    private cleanupOldEntries;
    /**
     * Dispose of the normalizer
     */
    dispose(): void;
}
//# sourceMappingURL=event-normalizer.d.ts.map