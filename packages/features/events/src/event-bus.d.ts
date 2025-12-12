import { BaseEvent, AnyEvent, EventFilter, EventHandler, EventPriority } from './event-types';
/**
 * Central event bus for the event tracking system
 * Implements pub/sub pattern with filtering and priority handling
 */
export declare class EventBus {
    private subscriptions;
    private eventBuffer;
    private readonly maxBufferSize;
    private readonly logger;
    private subscriptionCounter;
    private isProcessing;
    private processingQueue;
    constructor(maxBufferSize?: number);
    /**
     * Subscribe to events with optional filtering
     */
    subscribe<T extends BaseEvent = AnyEvent>(handler: EventHandler<T>, filter?: EventFilter, priority?: EventPriority): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Emit an event to all matching subscribers
     */
    emit(event: AnyEvent): Promise<void>;
    /**
     * Emit multiple events in batch
     */
    emitBatch(events: AnyEvent[]): Promise<void>;
    /**
     * Process the event queue
     */
    private processQueue;
    /**
     * Dispatch a single event to matching subscribers
     */
    private dispatchEvent;
    /**
     * Get subscriptions that match the event
     */
    private getMatchingSubscriptions;
    /**
     * Check if an event matches a filter
     */
    private matchesFilter;
    /**
     * Add event to buffer with size management
     */
    private addToBuffer;
    /**
     * Get recent events from buffer
     */
    getRecentEvents(count?: number, filter?: EventFilter): AnyEvent[];
    /**
     * Get events within a time range
     */
    getEventsByTimeRange(startTime: number, endTime: number, filter?: EventFilter): AnyEvent[];
    /**
     * Get events by type
     */
    getEventsByType(type: string): AnyEvent[];
    /**
     * Clear the event buffer
     */
    clearBuffer(): void;
    /**
     * Get buffer statistics
     */
    getBufferStats(): {
        size: number;
        maxSize: number;
        oldestTimestamp?: number;
        newestTimestamp?: number;
    };
    /**
     * Get subscription count
     */
    getSubscriptionCount(): number;
    /**
     * Replay events to a specific handler
     * Useful for debugging or late subscribers
     */
    replayEvents(handler: EventHandler, filter?: EventFilter, startTime?: number): Promise<void>;
    /**
     * Dispose of the event bus
     */
    dispose(): void;
}
/**
 * Get or create the global event bus
 */
export declare function getEventBus(maxBufferSize?: number): EventBus;
/**
 * Dispose the global event bus
 */
export declare function disposeEventBus(): void;
//# sourceMappingURL=event-bus.d.ts.map