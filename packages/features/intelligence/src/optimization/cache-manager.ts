import { Logger } from '@inline/shared';

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
    value: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
}

/**
 * Eviction strategy for cache
 */
export type EvictionStrategy = 'lru' | 'lfu' | 'fifo';

/**
 * Unified cache manager with configurable eviction strategies
 * @template T - Type of values stored in cache
 * @param name - Name of cache manager
 * @param maxSize - Maximum size of cache
 * @param maxAge - Maximum age of cache entries in milliseconds
 * @param strategy - Eviction strategy
 */
export class CacheManager<T = any> {
    private logger: Logger;
    private cache: Map<string, CacheEntry<T>> = new Map();
    private maxSize: number;
    private maxAge: number;
    private strategy: EvictionStrategy;
    private accessSequence: number = 0;
    
    // Statistics
    private hits: number = 0;
    private misses: number = 0;
    private evictions: number = 0;

    constructor(
        name: string,
        maxSize: number = 100,
        maxAge: number = 5 * 60 * 1000,
        strategy: EvictionStrategy = 'lru'
    ) {
        this.logger = new Logger(`CacheManager:${name}`);
        this.maxSize = maxSize;
        this.maxAge = maxAge;
        this.strategy = strategy;
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.misses++;
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        // Update access metadata
        entry.lastAccessed = this.accessSequence++;
        entry.accessCount++;
        this.hits++;

        return entry.value;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T): void {
        // Evict if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evict();
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            accessCount: 0,
            lastAccessed: this.accessSequence++
        });
    }

    /**
     * Check if key exists in cache
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete key from cache
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
        this.logger.info('Cache cleared');
    }

    /**
     * Evict entry based on strategy
     */
    private evict(): void {
        if (this.cache.size === 0) {
            return;
        }

        let keyToEvict: string | null = null;

        switch (this.strategy) {
            case 'lru': // Least Recently Used
                keyToEvict = this.evictLRU();
                break;
            case 'lfu': // Least Frequently Used
                keyToEvict = this.evictLFU();
                break;
            case 'fifo': // First In First Out
                keyToEvict = this.evictFIFO();
                break;
        }

        if (keyToEvict) {
            this.cache.delete(keyToEvict);
            this.evictions++;
        }
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): string | null {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    /**
     * Evict least frequently used entry
     */
    private evictLFU(): string | null {
        let leastUsedKey: string | null = null;
        let leastCount = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.accessCount < leastCount) {
                leastCount = entry.accessCount;
                leastUsedKey = key;
            }
        }

        return leastUsedKey;
    }

    /**
     * Evict first inserted entry
     */
    private evictFIFO(): string | null {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    /**
     * Clean expired entries
     */
    cleanExpired(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.maxAge) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.info(`Cleaned ${cleaned} expired entries`);
        }

        return cleaned;
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? this.hits / total : 0;

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: Math.round(hitRate * 100) / 100,
            evictions: this.evictions
        };
    }

    /**
     * Get all keys in cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Get cache size
     */
    size(): number {
        return this.cache.size;
    }
}
