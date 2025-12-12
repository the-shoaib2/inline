import * as vscode from 'vscode';
import { MemoryManager } from '@inline/shared/platform/resources/memory-manager';
/**
 * Persistent file-based cache with LRU eviction and memory management integration.
 *
 * Features:
 * - JSON-serialized cache entries stored on disk
 * - LRU access tracking for intelligent eviction
 * - Memory pressure response with automatic cleanup
 * - Performance metrics and statistics
 */
export declare class CacheManager {
    private cacheDir;
    private maxCacheSize;
    private cacheIndex;
    private memoryManager;
    private logger;
    private accessOrder;
    private hits;
    private misses;
    private totalRequests;
    constructor(context: vscode.ExtensionContext, memoryManager?: MemoryManager);
    /**
     * Create cache directory if it doesn't exist.
     */
    private ensureCacheDirectory;
    /**
     * Load cache index from disk and initialize LRU order.
     * Sorts entries by last access time for accurate LRU tracking.
     */
    private loadCacheIndex;
    /**
     * Persist cache index to disk.
     */
    private saveCacheIndex;
    /**
     * Store value in cache with automatic LRU eviction.
     * Serializes to JSON and updates access tracking.
     */
    set(key: string, value: unknown): Promise<void>;
    /**
     * Retrieve value from cache with access tracking.
     * Returns null if key not found or file is missing.
     */
    get(key: string): Promise<unknown | null>;
    /**
     * Remove all cache entries and reset statistics.
     */
    clear(): Promise<void>;
    /**
     * Calculate total cache size from index entries.
     */
    getSize(): number;
    /**
     * Generate comprehensive cache performance statistics.
     */
    getStats(): CacheStats;
    /**
     * Emergency cleanup triggered by memory pressure.
     * Removes 50% of least recently used entries to free memory quickly.
     */
    cleanup(): Promise<void>;
    /**
     * Enforce maximum cache size using LRU eviction.
     * Removes oldest entries until size limit is satisfied.
     */
    private enforceMaxSize;
    /**
     * Remove specific cache entry and its file.
     */
    private delete;
    /**
     * Move key to front of access order (most recently used).
     */
    private updateAccessOrder;
    /**
     * Remove key from LRU tracking array.
     */
    private removeFromAccessOrder;
    /**
     * Generate consistent hash for cache key filename.
     * Uses simple string hash algorithm for file system compatibility.
     */
    private hashKey;
    /**
     * Format byte count into human-readable string.
     */
    private formatBytes;
}
/**
 * Comprehensive cache performance statistics.
 */
export interface CacheStats {
    entries: number;
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    totalRequests: number;
}
//# sourceMappingURL=cache-manager.d.ts.map