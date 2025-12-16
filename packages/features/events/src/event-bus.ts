import { 
    BaseEvent, 
    AnyEvent, 
    EventFilter, 
    EventHandler, 
    EventSubscription,
    EventPriority 
} from './index';
import { Logger } from '@inline/shared';

/**
 * Central event bus for the event tracking system
 * Implements pub/sub pattern with filtering and priority handling
 */
export class EventBus {
    private subscriptions: Map<string, EventSubscription> = new Map();
    // Index subscriptions by event type for faster lookup: Type -> Set<SubscriptionId>
    private subscriptionsByType: Map<string, Set<string>> = new Map();
    // Subscriptions that match any type (wildcard or predicate-only)
    private globalSubscriptions: Set<string> = new Set();

    private eventBuffer: AnyEvent[] = [];
    private readonly maxBufferSize: number;
    private readonly logger: Logger;
    private subscriptionCounter = 0;
    private isProcessing = false;
    private processingQueue: AnyEvent[] = [];

    constructor(maxBufferSize: number = 1000) {
        this.maxBufferSize = maxBufferSize;
        this.logger = new Logger('EventBus');
    }

    /**
     * Subscribe to events with optional filtering
     */
    public subscribe<T extends BaseEvent = AnyEvent>(
        handler: EventHandler<T>,
        filter?: EventFilter,
        priority: EventPriority = EventPriority.NORMAL
    ): string {
        const id = `sub_${++this.subscriptionCounter}`;
        
        const subscription: EventSubscription = {
            id,
            filter: filter || {},
            handler: handler as EventHandler,
            priority
        };

        this.subscriptions.set(id, subscription);
        this.indexSubscription(subscription);

        this.logger.debug(`Subscription ${id} created with priority ${priority}`);
        
        return id;
    }

    /**
     * Unsubscribe from events
     */
    public unsubscribe(subscriptionId: string): boolean {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            this.unindexSubscription(subscription);
            this.subscriptions.delete(subscriptionId);
            this.logger.debug(`Subscription ${subscriptionId} removed`);
            return true;
        }
        return false;
    }

    private indexSubscription(sub: EventSubscription): void {
        const types = sub.filter.types;
        if (types && types.length > 0) {
            // Index by specific types
            for (const type of types) {
                if (!this.subscriptionsByType.has(type)) {
                    this.subscriptionsByType.set(type, new Set());
                }
                this.subscriptionsByType.get(type)!.add(sub.id);
            }
        } else {
            // No type filter means it listens to everything (unless source filter only? assumed global)
            this.globalSubscriptions.add(sub.id);
        }
    }

    private unindexSubscription(sub: EventSubscription): void {
        const types = sub.filter.types;
        if (types && types.length > 0) {
            for (const type of types) {
                const set = this.subscriptionsByType.get(type);
                if (set) {
                    set.delete(sub.id);
                    if (set.size === 0) {
                        this.subscriptionsByType.delete(type);
                    }
                }
            }
        } else {
            this.globalSubscriptions.delete(sub.id);
        }
    }

    /**
     * Emit an event to all matching subscribers
     */
    public async emit(event: AnyEvent): Promise<void> {
        // Add to buffer
        this.addToBuffer(event);

        // Add to processing queue
        this.processingQueue.push(event);

        // Process if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    /**
     * Emit multiple events in batch
     */
    public async emitBatch(events: AnyEvent[]): Promise<void> {
        // Add all to buffer
        events.forEach(event => this.addToBuffer(event));

        // Add to processing queue
        this.processingQueue.push(...events);

        // Process if not already processing
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    /**
     * Process the event queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.processingQueue.length > 0) {
                const event = this.processingQueue.shift()!;
                await this.dispatchEvent(event);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Dispatch a single event to matching subscribers
     */
    private async dispatchEvent(event: AnyEvent): Promise<void> {
        // Get matching subscriptions sorted by priority
        const matchingSubscriptions = this.getMatchingSubscriptions(event);

        // Execute handlers in priority order
        for (const subscription of matchingSubscriptions) {
            try {
                await subscription.handler(event);
            } catch (error) {
                this.logger.error(`Error in event handler ${subscription.id}:`, error as Error);
            }
        }
    }

    /**
     * Get subscriptions that match the event
     */
    private getMatchingSubscriptions(event: AnyEvent): EventSubscription[] {
        const matching: EventSubscription[] = [];
        const candidateIds = new Set<string>();

        // 1. Add global subscriptions
        for (const id of this.globalSubscriptions) {
            candidateIds.add(id);
        }

        // 2. Add type-specific subscriptions
        const typeSubs = this.subscriptionsByType.get(event.type);
        if (typeSubs) {
            for (const id of typeSubs) {
                candidateIds.add(id);
            }
        }

        // 3. Filter candidates
        for (const id of candidateIds) {
            const subscription = this.subscriptions.get(id);
            if (subscription && this.matchesFilter(event, subscription.filter)) {
                matching.push(subscription);
            }
        }

        // Sort by priority (highest first)
        return matching.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Check if an event matches a filter
     */
    private matchesFilter(event: AnyEvent, filter: EventFilter): boolean {
        // Check event types
        if (filter.types && filter.types.length > 0) {
            if (!filter.types.includes(event.type)) {
                return false;
            }
        }

        // Check sources
        if (filter.sources && filter.sources.length > 0) {
            if (!filter.sources.includes(event.source)) {
                return false;
            }
        }

        // Check custom predicate
        if (filter.predicate) {
            try {
                if (!filter.predicate(event)) {
                    return false;
                }
            } catch (error) {
                this.logger.error('Error in filter predicate:', error as Error);
                return false;
            }
        }

        return true;
    }

    /**
     * Add event to buffer with size management
     */
    private addToBuffer(event: AnyEvent): void {
        this.eventBuffer.push(event);

        // Trim buffer if it exceeds max size
        if (this.eventBuffer.length > this.maxBufferSize) {
            const excess = this.eventBuffer.length - this.maxBufferSize;
            this.eventBuffer.splice(0, excess);
        }
    }

    /**
     * Get recent events from buffer
     */
    public getRecentEvents(count?: number, filter?: EventFilter): AnyEvent[] {
        let events = [...this.eventBuffer];

        // Apply filter if provided
        if (filter) {
            events = events.filter(event => this.matchesFilter(event, filter));
        }

        // Limit count if specified
        if (count !== undefined) {
            events = events.slice(-count);
        }

        return events;
    }

    /**
     * Get events within a time range
     */
    public getEventsByTimeRange(startTime: number, endTime: number, filter?: EventFilter): AnyEvent[] {
        let events = this.eventBuffer.filter(
            event => event.timestamp >= startTime && event.timestamp <= endTime
        );

        // Apply filter if provided
        if (filter) {
            events = events.filter(event => this.matchesFilter(event, filter));
        }

        return events;
    }

    /**
     * Get events by type
     */
    public getEventsByType(type: string): AnyEvent[] {
        return this.eventBuffer.filter(event => event.type === type);
    }

    /**
     * Clear the event buffer
     */
    public clearBuffer(): void {
        this.eventBuffer = [];
        this.logger.debug('Event buffer cleared');
    }

    /**
     * Get buffer statistics
     */
    public getBufferStats(): {
        size: number;
        maxSize: number;
        oldestTimestamp?: number;
        newestTimestamp?: number;
    } {
        return {
            size: this.eventBuffer.length,
            maxSize: this.maxBufferSize,
            oldestTimestamp: this.eventBuffer[0]?.timestamp,
            newestTimestamp: this.eventBuffer[this.eventBuffer.length - 1]?.timestamp
        };
    }

    /**
     * Get subscription count
     */
    public getSubscriptionCount(): number {
        return this.subscriptions.size;
    }

    /**
     * Replay events to a specific handler
     * Useful for debugging or late subscribers
     */
    public async replayEvents(
        handler: EventHandler,
        filter?: EventFilter,
        startTime?: number
    ): Promise<void> {
        let events = [...this.eventBuffer];

        // Filter by time if specified
        if (startTime !== undefined) {
            events = events.filter(event => event.timestamp >= startTime);
        }

        // Apply filter if provided
        if (filter) {
            events = events.filter(event => this.matchesFilter(event, filter));
        }

        // Replay events
        for (const event of events) {
            try {
                await handler(event);
            } catch (error) {
                this.logger.error('Error replaying event:', error as Error);
            }
        }
    }

    /**
     * Dispose of the event bus
     */
    public dispose(): void {
        this.subscriptions.clear();
        this.eventBuffer = [];
        this.processingQueue = [];
        this.logger.debug('EventBus disposed');
    }
}

/**
 * Global event bus instance
 */
let globalEventBus: EventBus | null = null;

/**
 * Get or create the global event bus
 */
export function getEventBus(maxBufferSize?: number): EventBus {
    if (!globalEventBus) {
        globalEventBus = new EventBus(maxBufferSize);
    }
    return globalEventBus;
}

/**
 * Dispose the global event bus
 */
export function disposeEventBus(): void {
    if (globalEventBus) {
        globalEventBus.dispose();
        globalEventBus = null;
    }
}
