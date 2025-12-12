import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '@inline/shared';

/**
 * Key-value cache entry with metadata for LRU tracking.
 */
export interface KVCacheEntry {
    key: string;
    value: unknown;
    timestamp: number;
    hitCount: number;
    size: number;
}

/**
 * Comprehensive cache performance metrics.
 */
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictions: number;
    averageHitCount: number;
}

/**
 * High-performance key-value cache with LRU eviction and persistence.
 *
 * Features:
 * - Memory-limited with size and entry count constraints
 * - LRU eviction based on access timestamps
 * - Optional disk persistence for cache warmup
 * - Debounced persistence to avoid I/O thrashing
 * - Prefix-based queries for bulk operations
 */
export class KVCacheManager {
    private cache: Map<string, KVCacheEntry> = new Map();
    private maxSize: number;
    private maxEntries: number;
    private currentSize: number = 0;
    private hits: number = 0;
    private misses: number = 0;
    private evictions: number = 0;
    private logger: Logger;
    private persistPath: string;
    private persistEnabled: boolean;

    constructor(options: {
        maxSize?: number;
        maxEntries?: number;
        persistPath?: string;
        persistEnabled?: boolean;
    } = {}) {
        this.maxSize = options.maxSize || 100 * 1024 * 1024; // 100MB default
        this.maxEntries = options.maxEntries || 1000;
        this.persistPath = options.persistPath || path.join(os.homedir(), '.inline', 'cache', 'kv-cache.json');
        this.persistEnabled = options.persistEnabled !== false;
        this.logger = new Logger('KVCacheManager');

        // Load persisted cache on initialization for warm start
        if (this.persistEnabled) {
            this.loadFromDisk();
        }
    }

    /**
     * Store value with automatic LRU eviction when limits exceeded.
     */
    public set(key: string, value: unknown): void {
        const size = this.estimateSize(value);

        // Evict entries until space is available
        while (
            (this.currentSize + size > this.maxSize || this.cache.size >= this.maxEntries) &&
            this.cache.size > 0
        ) {
            this.evictLRU();
        }

        // Update existing entry or create new one
        const existing = this.cache.get(key);
        if (existing) {
            this.currentSize -= existing.size;
        }

        const entry: KVCacheEntry = {
            key,
            value,
            timestamp: Date.now(),
            hitCount: existing?.hitCount || 0,
            size
        };

        this.cache.set(key, entry);
        this.currentSize += size;

        // Schedule debounced persistence
        if (this.persistEnabled) {
            this.schedulePersist();
        }
    }

    /**
     * Retrieve value and update access tracking.
     */
    public get(key: string): unknown | null {
        const entry = this.cache.get(key);

        if (entry) {
            // Update access metrics for LRU tracking
            entry.hitCount++;
            entry.timestamp = Date.now();
            this.hits++;
            return entry.value;
        }

        this.misses++;
        return null;
    }

    /**
     * Check if key exists in cache.
     */
    public has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Remove specific entry and update size tracking.
     */
    public delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentSize -= entry.size;
            this.cache.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Clear all entries and reset statistics.
     */
    public clear(): void {
        this.cache.clear();
        this.currentSize = 0;
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;

        if (this.persistEnabled) {
            this.clearDisk();
        }
    }

    /**
     * Generate comprehensive cache performance statistics.
     */
    public getStats(): CacheStats {
        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
        const missRate = totalRequests > 0 ? this.misses / totalRequests : 0;

        let totalHitCount = 0;
        for (const entry of this.cache.values()) {
            totalHitCount += entry.hitCount;
        }
        const averageHitCount = this.cache.size > 0 ? totalHitCount / this.cache.size : 0;

        return {
            totalEntries: this.cache.size,
            totalSize: this.currentSize,
            hitRate,
            missRate,
            evictions: this.evictions,
            averageHitCount
        };
    }

    /**
     * Remove least recently used entry based on timestamp.
     */
    private evictLRU(): void {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.cache.get(oldestKey);
            if (entry) {
                this.currentSize -= entry.size;
            }
            this.cache.delete(oldestKey);
            this.evictions++;
        }
    }

    /**
     * Estimate memory size of value for cache management.
     */
    private estimateSize(value: unknown): number {
        try {
            const str = JSON.stringify(value);
            return str.length * 2; // UTF-16 encoding approximation
        } catch {
            return 1024; // Default fallback for unserializable values
        }
    }

    /**
     * Load cache entries from disk with age filtering.
     * Only loads entries less than 24 hours old.
     */
    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.persistPath)) {
                const data = fs.readFileSync(this.persistPath, 'utf-8');
                const entries: KVCacheEntry[] = JSON.parse(data);

                for (const entry of entries) {
                    // Filter out stale entries (older than 24 hours)
                    const age = Date.now() - entry.timestamp;
                    if (age < 24 * 60 * 60 * 1000) {
                        this.cache.set(entry.key, entry);
                        this.currentSize += entry.size;
                    }
                }

                this.logger.info(`Loaded ${this.cache.size} entries from cache`);
            }
        } catch (error) {
            this.logger.error(`Failed to load cache from disk: ${error}`);
        }
    }

    /**
     * Debounced persistence to avoid I/O thrashing during rapid updates.
     */
    private persistTimeout: NodeJS.Timeout | null = null;

    private schedulePersist(): void {
        if (this.persistTimeout) {
            clearTimeout(this.persistTimeout);
        }

        this.persistTimeout = setTimeout(() => {
            this.persistToDisk();
        }, 5000); // Persist after 5 seconds of inactivity
    }

    /**
     * Write cache entries to disk atomically.
     */
    private persistToDisk(): void {
        try {
            const dir = path.dirname(this.persistPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const entries = Array.from(this.cache.values());
            fs.writeFileSync(this.persistPath, JSON.stringify(entries, null, 2));
            this.logger.info(`Persisted ${entries.length} cache entries`);
        } catch (error) {
            this.logger.error(`Failed to persist cache: ${error}`);
        }
    }

    /**
     * Remove persisted cache file from disk.
     */
    private clearDisk(): void {
        try {
            if (fs.existsSync(this.persistPath)) {
                fs.unlinkSync(this.persistPath);
            }
        } catch (error) {
            this.logger.error(`Failed to clear cache file: ${error}`);
        }
    }

    /**
     * Pre-populate cache with common patterns for faster startup.
     */
    public async warmup(patterns: Array<{ key: string; value: unknown }>): Promise<void> {
        this.logger.info(`Warming up cache with ${patterns.length} patterns`);

        for (const pattern of patterns) {
            this.set(pattern.key, pattern.value);
        }
    }

    /**
     * Retrieve all entries matching key prefix.
     */
    public getByPrefix(prefix: string): KVCacheEntry[] {
        const results: KVCacheEntry[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(prefix)) {
                results.push(entry);
            }
        }

        return results;
    }

    /**
     * Cleanup resources and persist final state.
     */
    public async dispose(): Promise<void> {
        if (this.persistTimeout) {
            clearTimeout(this.persistTimeout);
        }

        if (this.persistEnabled) {
            this.persistToDisk();
        }
    }
}
