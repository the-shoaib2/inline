import { AnyEvent } from '@inline/events';
import { Logger } from '@inline/shared';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Event storage and indexing system
 */
export class EventStorage {
    private logger: Logger;
    private storagePath: string;
    private enabled: boolean;
    private maxStorageSize: number;
    private eventIndex: Map<string, number> = new Map();
    private currentSize: number = 0;

    constructor(storagePath: string, enabled: boolean = false, maxStorageSize: number = 10000) {
        this.logger = new Logger('EventStorage');
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
    private initializeStorage(): void {
        try {
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }

            // Load existing index
            this.loadIndex();
        } catch (error) {
            this.logger.error('Failed to initialize storage:', error as Error);
            this.enabled = false;
        }
    }

    /**
     * Store an event
     */
    public async storeEvent(event: AnyEvent): Promise<void> {
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

        } catch (error) {
            this.logger.error('Failed to store event:', error as Error);
        }
    }

    /**
     * Store multiple events in batch
     */
    public async storeEvents(events: AnyEvent[]): Promise<void> {
        for (const event of events) {
            await this.storeEvent(event);
        }
    }

    /**
     * Retrieve an event by ID
     */
    public async getEvent(eventId: string): Promise<AnyEvent | null> {
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

        } catch (error) {
            this.logger.error('Failed to retrieve event:', error as Error);
            return null;
        }
    }

    /**
     * Query events by time range
     */
    public async queryEventsByTimeRange(startTime: number, endTime: number): Promise<AnyEvent[]> {
        if (!this.enabled) {
            return [];
        }

        const events: AnyEvent[] = [];

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
    private loadIndex(): void {
        try {
            const indexFile = path.join(this.storagePath, 'index.json');
            
            if (fs.existsSync(indexFile)) {
                const indexData = fs.readFileSync(indexFile, 'utf-8');
                const index = JSON.parse(indexData);
                
                this.eventIndex = new Map(Object.entries(index));
                this.currentSize = this.eventIndex.size;
            }

        } catch (error) {
            this.logger.error('Failed to load index:', error as Error);
        }
    }

    /**
     * Save index to disk
     */
    private async saveIndex(): Promise<void> {
        try {
            const indexFile = path.join(this.storagePath, 'index.json');
            const indexData = JSON.stringify(Object.fromEntries(this.eventIndex), null, 2);
            
            await fs.promises.writeFile(indexFile, indexData);

        } catch (error) {
            this.logger.error('Failed to save index:', error as Error);
        }
    }

    /**
     * Clear all stored events
     */
    public async clearStorage(): Promise<void> {
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

        } catch (error) {
            this.logger.error('Failed to clear storage:', error as Error);
        }
    }

    /**
     * Get storage statistics
     */
    public getStorageStats(): {
        enabled: boolean;
        currentSize: number;
        maxSize: number;
        usagePercent: number;
    } {
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
    public async dispose(): Promise<void> {
        if (this.enabled) {
            await this.saveIndex();
        }
    }
}
