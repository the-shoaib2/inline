import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../utils/logger';

export interface KVCacheEntry {
    key: string;
    value: any;
    timestamp: number;
    hitCount: number;
    size: number;
}

export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictions: number;
    averageHitCount: number;
}

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

        // Load persisted cache on initialization
        if (this.persistEnabled) {
            this.loadFromDisk();
        }
    }

    /**
     * Store a value in the cache with automatic eviction if needed
     */
    public set(key: string, value: any): void {
        const size = this.estimateSize(value);
        
        // Check if we need to evict entries
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

        // Persist if enabled
        if (this.persistEnabled) {
            this.schedulePersist();
        }
    }

    /**
     * Retrieve a value from the cache
     */
    public get(key: string): any | null {
        const entry = this.cache.get(key);
        
        if (entry) {
            // Update hit count and timestamp
            entry.hitCount++;
            entry.timestamp = Date.now();
            this.hits++;
            return entry.value;
        }

        this.misses++;
        return null;
    }

    /**
     * Check if a key exists in the cache
     */
    public has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Remove a specific entry from the cache
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
     * Clear all entries from the cache
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
     * Get cache statistics
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
     * Evict the least recently used entry
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
     * Estimate the size of a value in bytes
     */
    private estimateSize(value: any): number {
        try {
            const str = JSON.stringify(value);
            return str.length * 2; // UTF-16 encoding
        } catch {
            return 1024; // Default estimate if serialization fails
        }
    }

    /**
     * Load cache from disk
     */
    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.persistPath)) {
                const data = fs.readFileSync(this.persistPath, 'utf-8');
                const entries: KVCacheEntry[] = JSON.parse(data);

                for (const entry of entries) {
                    // Only load recent entries (less than 24 hours old)
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
     * Persist cache to disk (debounced)
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
     * Clear persisted cache file
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
     * Warm up the cache with common patterns
     */
    public async warmup(patterns: Array<{ key: string; value: any }>): Promise<void> {
        this.logger.info(`Warming up cache with ${patterns.length} patterns`);
        
        for (const pattern of patterns) {
            this.set(pattern.key, pattern.value);
        }
    }

    /**
     * Get entries matching a prefix
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
     * Cleanup and persist before shutdown
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
