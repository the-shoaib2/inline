import * as vscode from 'vscode';
import { Logger } from '@platform/system/logger';

/**
 * Cache entry for parsed Abstract Syntax Trees with version tracking.
 * Used for incremental parsing and cache invalidation.
 */
export interface ASTCacheEntry {
    ast: any;
    version: number;
    timestamp: number;
    size: number;
    uri: string;
}

/**
 * Performance metrics for AST cache operations.
 */
export interface ASTCacheStats {
    totalSize: number;
    entryCount: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
}

/**
 * L1 in-memory cache for Abstract Syntax Trees with <1ms access time.
 *
 * Features:
 * - Stores parsed AST for current and recent files
 * - Incremental updates on text changes
 * - Version tracking for cache invalidation
 * - Memory-limited with LRU eviction policy
 */
export class ASTCache {
    private cache: Map<string, ASTCacheEntry> = new Map();
    private accessOrder: string[] = []; // LRU tracking - oldest at index 0
    private maxSize: number = 100 * 1024 * 1024; // 100MB default
    private currentSize: number = 0;
    private logger: Logger;

    // Performance tracking
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0
    };

    constructor(maxSizeMB: number = 100) {
        this.maxSize = maxSizeMB * 1024 * 1024;
        this.logger = new Logger('ASTCache');
    }

    /**
     * Retrieve cached AST if version matches.
     * Updates LRU order on successful hit.
     */
    get(uri: string, version: number): any | null {
        const entry = this.cache.get(uri);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Version mismatch indicates file was modified
        if (entry.version !== version) {
            this.logger.debug(`Version mismatch for ${uri}: cached=${entry.version}, requested=${version}`);
            this.stats.misses++;
            return null;
        }

        // Move to end of LRU order (most recently used)
        this.updateAccessOrder(uri);
        this.stats.hits++;

        return entry.ast;
    }

    /**
     * Store AST in cache with LRU eviction if needed.
     * Replaces existing entry for same URI.
     */
    set(uri: string, ast: any, version: number, size: number): void {
        // Evict entries until enough space is available
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // Reject oversized entries that exceed total cache capacity
        if (size > this.maxSize) {
            this.logger.warn(`AST too large to cache: ${size} bytes for ${uri}`);
            return;
        }

        // Remove existing entry to update size tracking
        const existing = this.cache.get(uri);
        if (existing) {
            this.currentSize -= existing.size;
        }

        const entry: ASTCacheEntry = {
            ast,
            version,
            timestamp: Date.now(),
            size,
            uri
        };

        this.cache.set(uri, entry);
        this.currentSize += size;
        this.updateAccessOrder(uri);

        this.logger.debug(`Cached AST for ${uri}: ${size} bytes, version ${version}`);
    }

    /**
     * Remove cache entry for specific URI.
     */
    invalidate(uri: string): void {
        const entry = this.cache.get(uri);
        if (entry) {
            this.currentSize -= entry.size;
            this.cache.delete(uri);
            this.removeFromAccessOrder(uri);
            this.logger.debug(`Invalidated cache for ${uri}`);
        }
    }

    /**
     * Update specific region of cached AST.
     * Currently invalidates entire entry - incremental parsing planned for Phase 2.
     */
    updateRegion(uri: string, range: vscode.Range, newText: string): void {
        this.invalidate(uri);
    }

    /**
     * Clear all cached entries and reset statistics.
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.currentSize = 0;
        this.logger.info('Cache cleared');
    }

    /**
     * Calculate cache performance metrics.
     */
    getStats(): ASTCacheStats {
        const totalRequests = this.stats.hits + this.stats.misses;
        return {
            totalSize: this.currentSize,
            entryCount: this.cache.size,
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
            missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
            evictionCount: this.stats.evictions
        };
    }

    /**
     * Remove least recently used entry to free memory.
     */
    private evictLRU(): void {
        if (this.accessOrder.length === 0) {
            return;
        }

        // Oldest entry is at index 0
        const lruUri = this.accessOrder[0];
        const entry = this.cache.get(lruUri);

        if (entry) {
            this.currentSize -= entry.size;
            this.cache.delete(lruUri);
            this.accessOrder.shift();
            this.stats.evictions++;
            this.logger.debug(`Evicted LRU entry: ${lruUri} (${entry.size} bytes)`);
        }
    }

    /**
     * Move URI to end of access order (most recently used).
     */
    private updateAccessOrder(uri: string): void {
        this.removeFromAccessOrder(uri);
        this.accessOrder.push(uri);
    }

    /**
     * Remove URI from LRU tracking array.
     */
    private removeFromAccessOrder(uri: string): void {
        const index = this.accessOrder.indexOf(uri);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Calculate memory usage as percentage of max capacity.
     */
    getMemoryUsage(): number {
        return this.currentSize / this.maxSize;
    }

    /**
     * Check if cache is approaching capacity limit.
     * Default threshold is 80% of max size.
     */
    isNearCapacity(threshold: number = 0.8): boolean {
        return this.getMemoryUsage() > threshold;
    }
}
