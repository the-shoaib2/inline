"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
exports.getEventBus = getEventBus;
exports.disposeEventBus = disposeEventBus;
const events_1 = require("@inline/events");
const shared_1 = require("@inline/shared");
/**
 * Central event bus for the event tracking system
 * Implements pub/sub pattern with filtering and priority handling
 */
class EventBus {
    constructor(maxBufferSize = 1000) {
        this.subscriptions = new Map();
        this.eventBuffer = [];
        this.subscriptionCounter = 0;
        this.isProcessing = false;
        this.processingQueue = [];
        this.maxBufferSize = maxBufferSize;
        this.logger = new shared_1.Logger('EventBus');
    }
    /**
     * Subscribe to events with optional filtering
     */
    subscribe(handler, filter, priority = events_1.EventPriority.NORMAL) {
        const id = `sub_${++this.subscriptionCounter}`;
        const subscription = {
            id,
            filter: filter || {},
            handler: handler,
            priority
        };
        this.subscriptions.set(id, subscription);
        this.logger.debug(`Subscription ${id} created with priority ${priority}`);
        return id;
    }
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId) {
        const result = this.subscriptions.delete(subscriptionId);
        if (result) {
            this.logger.debug(`Subscription ${subscriptionId} removed`);
        }
        return result;
    }
    /**
     * Emit an event to all matching subscribers
     */
    async emit(event) {
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
    async emitBatch(events) {
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
    async processQueue() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.processingQueue.length > 0) {
                const event = this.processingQueue.shift();
                await this.dispatchEvent(event);
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Dispatch a single event to matching subscribers
     */
    async dispatchEvent(event) {
        // Get matching subscriptions sorted by priority
        const matchingSubscriptions = this.getMatchingSubscriptions(event);
        // Execute handlers in priority order
        for (const subscription of matchingSubscriptions) {
            try {
                await subscription.handler(event);
            }
            catch (error) {
                this.logger.error(`Error in event handler ${subscription.id}:`, error);
            }
        }
    }
    /**
     * Get subscriptions that match the event
     */
    getMatchingSubscriptions(event) {
        const matching = [];
        for (const subscription of this.subscriptions.values()) {
            if (this.matchesFilter(event, subscription.filter)) {
                matching.push(subscription);
            }
        }
        // Sort by priority (highest first)
        return matching.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Check if an event matches a filter
     */
    matchesFilter(event, filter) {
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
            }
            catch (error) {
                this.logger.error('Error in filter predicate:', error);
                return false;
            }
        }
        return true;
    }
    /**
     * Add event to buffer with size management
     */
    addToBuffer(event) {
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
    getRecentEvents(count, filter) {
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
    getEventsByTimeRange(startTime, endTime, filter) {
        let events = this.eventBuffer.filter(event => event.timestamp >= startTime && event.timestamp <= endTime);
        // Apply filter if provided
        if (filter) {
            events = events.filter(event => this.matchesFilter(event, filter));
        }
        return events;
    }
    /**
     * Get events by type
     */
    getEventsByType(type) {
        return this.eventBuffer.filter(event => event.type === type);
    }
    /**
     * Clear the event buffer
     */
    clearBuffer() {
        this.eventBuffer = [];
        this.logger.debug('Event buffer cleared');
    }
    /**
     * Get buffer statistics
     */
    getBufferStats() {
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
    getSubscriptionCount() {
        return this.subscriptions.size;
    }
    /**
     * Replay events to a specific handler
     * Useful for debugging or late subscribers
     */
    async replayEvents(handler, filter, startTime) {
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
            }
            catch (error) {
                this.logger.error('Error replaying event:', error);
            }
        }
    }
    /**
     * Dispose of the event bus
     */
    dispose() {
        this.subscriptions.clear();
        this.eventBuffer = [];
        this.processingQueue = [];
        this.logger.debug('EventBus disposed');
    }
}
exports.EventBus = EventBus;
/**
 * Global event bus instance
 */
let globalEventBus = null;
/**
 * Get or create the global event bus
 */
function getEventBus(maxBufferSize) {
    if (!globalEventBus) {
        globalEventBus = new EventBus(maxBufferSize);
    }
    return globalEventBus;
}
/**
 * Dispose the global event bus
 */
function disposeEventBus() {
    if (globalEventBus) {
        globalEventBus.dispose();
        globalEventBus = null;
    }
}
//# sourceMappingURL=event-bus.js.map