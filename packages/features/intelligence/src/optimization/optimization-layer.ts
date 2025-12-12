import { AnyEvent } from '@inline/events';
import { Logger } from '@inline/shared';

/**
 * Optimization layer for event processing
 */
export class OptimizationLayer {
    private logger: Logger;
    private eventCache: Map<string, { event: AnyEvent; timestamp: number }> = new Map();
    private readonly cacheTTL: number;
    private readonly maxCacheSize: number;
    private throttleTimers: Map<string, NodeJS.Timeout> = new Map();
    private cacheHits: number = 0;
    private cacheMisses: number = 0;

    constructor(cacheTTL: number = 60000, maxCacheSize: number = 1000) {
        this.logger = new Logger('OptimizationLayer');
        this.cacheTTL = cacheTTL;
        this.maxCacheSize = maxCacheSize;
    }

    /**
     * Cache an event
     */
    public cacheEvent(key: string, event: AnyEvent): void {
        // Evict old entries if cache is full
        if (this.eventCache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        this.eventCache.set(key, {
            event,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached event
     */
    public getCachedEvent(key: string): AnyEvent | null {
        const cached = this.eventCache.get(key);

        if (!cached) {
            this.cacheMisses++;
            return null;
        }

        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.eventCache.delete(key);
            this.cacheMisses++;
            return null;
        }

        this.cacheHits++;
        return cached.event;
    }

    /**
     * Evict oldest cache entries
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, value] of this.eventCache.entries()) {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.eventCache.delete(oldestKey);
        }
    }

    /**
     * Throttle a function call
     */
    public throttle<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        return (...args: Parameters<T>) => {
            const existingTimer = this.throttleTimers.get(key);

            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                fn(...args);
                this.throttleTimers.delete(key);
            }, delay);

            this.throttleTimers.set(key, timer);
        };
    }

    /**
     * Debounce a function call
     */
    public debounce<T extends (...args: any[]) => any>(
        key: string,
        fn: T,
        delay: number
    ): (...args: Parameters<T>) => void {
        return (...args: Parameters<T>) => {
            const existingTimer = this.throttleTimers.get(key);

            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const timer = setTimeout(() => {
                fn(...args);
                this.throttleTimers.delete(key);
            }, delay);

            this.throttleTimers.set(key, timer);
        };
    }

    /**
     * Batch process events
     */
    public batchProcess<T>(
        items: T[],
        processor: (batch: T[]) => Promise<void>,
        batchSize: number = 10
    ): Promise<void> {
        const batches: T[][] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }

        return Promise.all(batches.map(batch => processor(batch))).then(() => {});
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.eventCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
    } {
        return {
            size: this.eventCache.size,
            maxSize: this.maxCacheSize,
            hitRate: this.cacheHits / Math.max(1, this.cacheHits + this.cacheMisses)
        };
    }

    /**
     * Dispose optimization layer
     */
    public dispose(): void {
        this.eventCache.clear();
        
        for (const timer of this.throttleTimers.values()) {
            clearTimeout(timer);
        }
        
        this.throttleTimers.clear();
    }
}
