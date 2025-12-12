"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventStorage = void 0;
const shared_1 = require("@inline/shared");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Event storage and indexing system
 */
class EventStorage {
    constructor(storagePath, enabled = false, maxStorageSize = 10000) {
        this.eventIndex = new Map();
        this.currentSize = 0;
        this.logger = new shared_1.Logger('EventStorage');
        this.storagePath = storagePath;
        this.enabled = enabled;
        this.maxStorageSize = maxStorageSize;
        if (this.enabled) {
            this.initializeStorage();
        }
    }
    /**
     * Initialize storage directory
     */
    initializeStorage() {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }
            // Load existing index
            this.loadIndex();
        }
        catch (error) {
            this.logger.error('Failed to initialize storage:', error);
            this.enabled = false;
        }
    }
    /**
     * Store an event
     */
    async storeEvent(event) {
        if (!this.enabled) {
            return;
        }
        try {
            // Check storage size limit
            if (this.currentSize >= this.maxStorageSize) {
                this.logger.warn('Storage size limit reached, skipping event storage');
                return;
            }
            // Create event file
            const eventFile = path.join(this.storagePath, `${event.id}.json`);
            const eventData = JSON.stringify(event, null, 2);
            await fs.promises.writeFile(eventFile, eventData);
            // Update index
            this.eventIndex.set(event.id, event.timestamp);
            this.currentSize++;
            // Save index periodically
            if (this.currentSize % 100 === 0) {
                await this.saveIndex();
            }
        }
        catch (error) {
            this.logger.error('Failed to store event:', error);
        }
    }
    /**
     * Store multiple events in batch
     */
    async storeEvents(events) {
        for (const event of events) {
            await this.storeEvent(event);
        }
    }
    /**
     * Retrieve an event by ID
     */
    async getEvent(eventId) {
        if (!this.enabled) {
            return null;
        }
        try {
            const eventFile = path.join(this.storagePath, `${eventId}.json`);
            if (!fs.existsSync(eventFile)) {
                return null;
            }
            const eventData = await fs.promises.readFile(eventFile, 'utf-8');
            return JSON.parse(eventData);
        }
        catch (error) {
            this.logger.error('Failed to retrieve event:', error);
            return null;
        }
    }
    /**
     * Query events by time range
     */
    async queryEventsByTimeRange(startTime, endTime) {
        if (!this.enabled) {
            return [];
        }
        const events = [];
        for (const [eventId, timestamp] of this.eventIndex.entries()) {
            if (timestamp >= startTime && timestamp <= endTime) {
                const event = await this.getEvent(eventId);
                if (event) {
                    events.push(event);
                }
            }
        }
        return events;
    }
    /**
     * Load index from disk
     */
    loadIndex() {
        try {
            const indexFile = path.join(this.storagePath, 'index.json');
            if (fs.existsSync(indexFile)) {
                const indexData = fs.readFileSync(indexFile, 'utf-8');
                const index = JSON.parse(indexData);
                this.eventIndex = new Map(Object.entries(index));
                this.currentSize = this.eventIndex.size;
            }
        }
        catch (error) {
            this.logger.error('Failed to load index:', error);
        }
    }
    /**
     * Save index to disk
     */
    async saveIndex() {
        try {
            const indexFile = path.join(this.storagePath, 'index.json');
            const indexData = JSON.stringify(Object.fromEntries(this.eventIndex), null, 2);
            await fs.promises.writeFile(indexFile, indexData);
        }
        catch (error) {
            this.logger.error('Failed to save index:', error);
        }
    }
    /**
     * Clear all stored events
     */
    async clearStorage() {
        if (!this.enabled) {
            return;
        }
        try {
            const files = await fs.promises.readdir(this.storagePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.promises.unlink(path.join(this.storagePath, file));
                }
            }
            this.eventIndex.clear();
            this.currentSize = 0;
            await this.saveIndex();
        }
        catch (error) {
            this.logger.error('Failed to clear storage:', error);
        }
    }
    /**
     * Get storage statistics
     */
    getStorageStats() {
        return {
            enabled: this.enabled,
            currentSize: this.currentSize,
            maxSize: this.maxStorageSize,
            usagePercent: (this.currentSize / this.maxStorageSize) * 100
        };
    }
    /**
     * Dispose storage
     */
    async dispose() {
        if (this.enabled) {
            await this.saveIndex();
        }
    }
}
exports.EventStorage = EventStorage;
//# sourceMappingURL=event-storage.js.map