import * as vscode from 'vscode';
import { Logger } from '../../system/logger';

export interface ASTCacheEntry {
    ast: any;
    version: number;
    timestamp: number;
    size: number;
    uri: string;
}

export interface ASTCacheStats {
    totalSize: number;
    entryCount: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
}

/**
 * L1 Cache: AST In-Memory Cache
 * Target: <1ms access time
 * 
 * Features:
 * - Stores parsed AST for current and recent files
 * - Incremental updates on text changes
 * - Version tracking for invalidation
 * - Memory-limited with LRU eviction
 */
export class ASTCache {
    private cache: Map<string, ASTCacheEntry> = new Map();
    private accessOrder: string[] = []; // LRU tracking
    private maxSize: number = 100 * 1024 * 1024; // 100MB
    private currentSize: number = 0;
    private logger: Logger;
    
    // Statistics
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
     * Get AST from cache
     */
    get(uri: string, version: number): any | null {
        const entry = this.cache.get(uri);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check version match
        if (entry.version !== version) {
            this.logger.debug(`Version mismatch for ${uri}: cached=${entry.version}, requested=${version}`);
            this.stats.misses++;
            return null;
        }

        // Update access order (move to end = most recently used)
        this.updateAccessOrder(uri);
        this.stats.hits++;
        
        return entry.ast;
    }

    /**
     * Store AST in cache
     */
    set(uri: string, ast: any, version: number, size: number): void {
        // Check if we need to evict
        while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
            this.evictLRU();
        }

        // If still too large after eviction, don't cache
        if (size > this.maxSize) {
            this.logger.warn(`AST too large to cache: ${size} bytes for ${uri}`);
            return;
        }

        // Remove old entry if exists
        const existing = this.cache.get(uri);
        if (existing) {
            this.currentSize -= existing.size;
        }

        // Add new entry
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
     * Invalidate cache entry
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
     * Update region incrementally (for future incremental parsing)
     */
    updateRegion(uri: string, range: vscode.Range, newText: string): void {
        // For now, just invalidate - incremental updates will be added in Phase 2
        this.invalidate(uri);
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.currentSize = 0;
        this.logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
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
     * Evict least recently used entry
     */
    private evictLRU(): void {
        if (this.accessOrder.length === 0) {
            return;
        }

        // First item is least recently used
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
     * Update access order for LRU tracking
     */
    private updateAccessOrder(uri: string): void {
        // Remove from current position
        this.removeFromAccessOrder(uri);
        // Add to end (most recently used)
        this.accessOrder.push(uri);
    }

    /**
     * Remove from access order
     */
    private removeFromAccessOrder(uri: string): void {
        const index = this.accessOrder.indexOf(uri);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Get memory usage percentage
     */
    getMemoryUsage(): number {
        return this.currentSize / this.maxSize;
    }

    /**
     * Check if cache is near capacity
     */
    isNearCapacity(threshold: number = 0.8): boolean {
        return this.getMemoryUsage() > threshold;
    }
}
