"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventNormalizer = void 0;
const shared_1 = require("@inline/shared");
/**
 * Event normalizer - converts platform-specific events to standard format
 * and performs deduplication, filtering, and batching
 */
class EventNormalizer {
    constructor(deduplicationWindow = 100, batchDelay = 50, batchSize = 10) {
        this.lastEvents = new Map();
        this.batchBuffer = [];
        this.batchTimer = null;
        this.logger = new shared_1.Logger('EventNormalizer');
        this.deduplicationWindow = deduplicationWindow;
        this.batchDelay = batchDelay;
        this.batchSize = batchSize;
    }
    /**
     * Normalize a single event
     */
    normalize(event) {
        // Ensure timestamp is set
        if (!event.timestamp) {
            event.timestamp = Date.now();
        }
        // Ensure ID is set
        if (!event.id) {
            event.id = this.generateEventId(event);
        }
        // Check for duplicates
        if (this.isDuplicate(event)) {
            this.logger.debug(`Duplicate event filtered: ${event.type}`);
            return null;
        }
        // Filter noise
        if (this.isNoise(event)) {
            this.logger.debug(`Noise event filtered: ${event.type}`);
            return null;
        }
        // Record event for deduplication
        this.recordEvent(event);
        // Enrich metadata
        this.enrichMetadata(event);
        return event;
    }
    /**
     * Normalize multiple events
     */
    normalizeMany(events) {
        const normalized = [];
        for (const event of events) {
            const normalizedEvent = this.normalize(event);
            if (normalizedEvent) {
                normalized.push(normalizedEvent);
            }
        }
        return normalized;
    }
    /**
     * Add event to batch buffer
     */
    addToBatch(event, onFlush) {
        const normalized = this.normalize(event);
        if (!normalized) {
            return;
        }
        this.batchBuffer.push(normalized);
        // Flush if batch size reached
        if (this.batchBuffer.length >= this.batchSize) {
            this.flushBatch(onFlush);
            return;
        }
        // Schedule flush if not already scheduled
        if (!this.batchTimer) {
            this.batchTimer = setTimeout(() => {
                this.flushBatch(onFlush);
            }, this.batchDelay);
        }
    }
    /**
     * Flush the batch buffer
     */
    flushBatch(onFlush) {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        if (this.batchBuffer.length > 0) {
            const events = [...this.batchBuffer];
            this.batchBuffer = [];
            onFlush(events);
        }
    }
    /**
     * Generate a unique event ID
     */
    generateEventId(event) {
        const timestamp = event.timestamp || Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `${event.type}_${timestamp}_${random}`;
    }
    /**
     * Check if event is a duplicate
     */
    isDuplicate(event) {
        const key = this.getEventKey(event);
        const lastTime = this.lastEvents.get(key);
        if (lastTime !== undefined) {
            const timeDiff = event.timestamp - lastTime;
            if (timeDiff < this.deduplicationWindow) {
                return true;
            }
        }
        return false;
    }
    /**
     * Record event for deduplication tracking
     */
    recordEvent(event) {
        const key = this.getEventKey(event);
        this.lastEvents.set(key, event.timestamp);
        // Clean up old entries periodically
        if (this.lastEvents.size > 1000) {
            this.cleanupOldEntries();
        }
    }
    /**
     * Get a unique key for event deduplication
     */
    getEventKey(event) {
        // Create a key based on event type and relevant properties
        const parts = [event.type];
        // Add document URI if available
        if ('document' in event && event.document) {
            parts.push(event.document.uri.toString());
        }
        // Add URI if available (for file system events)
        if ('uri' in event && event.uri) {
            parts.push(event.uri.toString());
        }
        // Add position if available (for editor events)
        if ('position' in event && event.position) {
            parts.push(`${event.position.line}:${event.position.character}`);
        }
        return parts.join('|');
    }
    /**
     * Check if event is noise (should be filtered out)
     */
    isNoise(event) {
        // Filter out rapid-fire cursor movements
        if (event.type === 'editor.cursor.moved') {
            // Allow cursor events but they'll be deduplicated
            return false;
        }
        // Filter out mouse move events if they're too frequent
        if (event.type === 'user.mouse.move') {
            // Mouse moves are very noisy, only keep if significant
            return true; // For now, filter all mouse moves
        }
        // Add more noise filtering rules as needed
        return false;
    }
    /**
     * Enrich event metadata
     */
    enrichMetadata(event) {
        if (!event.metadata) {
            event.metadata = {};
        }
        // Add normalization timestamp
        event.metadata.normalizedAt = Date.now();
        // Add source if not set
        if (!event.source) {
            event.source = 'vscode';
        }
        // Add platform information
        event.metadata.platform = process.platform;
    }
    /**
     * Clean up old deduplication entries
     */
    cleanupOldEntries() {
        const now = Date.now();
        const cutoff = now - this.deduplicationWindow * 10; // Keep 10x window
        for (const [key, timestamp] of this.lastEvents.entries()) {
            if (timestamp < cutoff) {
                this.lastEvents.delete(key);
            }
        }
    }
    /**
     * Dispose of the normalizer
     */
    dispose() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        this.lastEvents.clear();
        this.batchBuffer = [];
    }
}
exports.EventNormalizer = EventNormalizer;
//# sourceMappingURL=event-normalizer.js.map