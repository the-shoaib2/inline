import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MemoryManager } from '@inline/shared';
import { Logger } from '@inline/shared';

/**
 * Persistent file-based cache with LRU eviction and memory management integration.
 *
 * Features:
 * - JSON-serialized cache entries stored on disk
 * - LRU access tracking for intelligent eviction
 * - Memory pressure response with automatic cleanup
 * - Performance metrics and statistics
 */
export class CacheManager {
    private cacheDir: string;
    private maxCacheSize: number = 100 * 1024 * 1024; // 100MB default, adjusted by memory manager
    private cacheIndex: Map<string, CacheEntry> = new Map();
    private memoryManager: MemoryManager | null = null;
    private logger: Logger;

    // LRU tracking - most recent at index 0
    private accessOrder: string[] = [];

    // Performance metrics
    private hits: number = 0;
    private misses: number = 0;
    private totalRequests: number = 0;

    constructor(context: vscode.ExtensionContext, memoryManager?: MemoryManager) {
        this.cacheDir = path.join(context.globalStorageUri.fsPath, 'cache');
        this.logger = new Logger('CacheManager');
        this.memoryManager = memoryManager || null;

        this.ensureCacheDirectory();
        this.loadCacheIndex();

        // Adjust cache size based on available system memory
        if (this.memoryManager) {
            const allocation = this.memoryManager.getCacheAllocation();
            this.maxCacheSize = allocation.maxCacheSize;
            this.logger.info(`Cache size set to ${this.formatBytes(this.maxCacheSize)} based on available memory`);

            // Register cleanup callback for memory pressure events
            this.memoryManager.registerCleanupCallback(async () => {
                await this.cleanup();
            });
        }
    }

    /**
     * Create cache directory if it doesn't exist.
     */
    private ensureCacheDirectory(): void {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * Load cache index from disk and initialize LRU order.
     * Sorts entries by last access time for accurate LRU tracking.
     */
    private loadCacheIndex(): void {
        const indexPath = path.join(this.cacheDir, 'index.json');
        if (fs.existsSync(indexPath)) {
            try {
                const data = fs.readFileSync(indexPath, 'utf-8');
                const entries: [string, CacheEntry][] = JSON.parse(data);
                this.cacheIndex = new Map(entries);

                // Initialize LRU order - most recently accessed first
                this.accessOrder = Array.from(this.cacheIndex.entries())
                    .sort((a, b) => b[1].lastAccess - a[1].lastAccess)
                    .map(([key]) => key);

                this.logger.info(`Loaded ${this.cacheIndex.size} cache entries`);
            } catch (error) {
                this.logger.error('Failed to load cache index:', error as Error);
            }
        }
    }

    /**
     * Persist cache index to disk.
     */
    private async saveCacheIndex(): Promise<void> {
        const indexPath = path.join(this.cacheDir, 'index.json');
        try {
            const entries = Array.from(this.cacheIndex.entries());
            await fs.promises.writeFile(indexPath, JSON.stringify(entries, null, 2));
        } catch (error) {
            this.logger.error('Failed to save cache index:', error as Error);
        }
    }

    /**
     * Store value in cache with automatic LRU eviction.
     * Serializes to JSON and updates access tracking.
     */
    public async set(key: string, value: unknown): Promise<void> {
        const hash = this.hashKey(key);
        const filePath = path.join(this.cacheDir, `${hash}.json`);

        try {
            const serialized = JSON.stringify(value);
            await fs.promises.writeFile(filePath, serialized);

            const size = Buffer.byteLength(serialized);
            const now = Date.now();

            this.cacheIndex.set(key, {
                hash,
                size,
                timestamp: now,
                lastAccess: now,
                accessCount: 1
            });

            // Update LRU order - move to front (most recent)
            this.updateAccessOrder(key);

            await this.saveCacheIndex();
            await this.enforceMaxSize();
        } catch (error) {
            this.logger.error('Failed to write cache:', error as Error);
        }
    }

    /**
     * Retrieve value from cache with access tracking.
     * Returns null if key not found or file is missing.
     */
    public async get(key: string): Promise<unknown | null> {
        this.totalRequests++;

        const entry = this.cacheIndex.get(key);
        if (!entry) {
            this.misses++;
            return null;
        }

        const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
        if (!fs.existsSync(filePath)) {
            // File was deleted externally - clean up index
            this.cacheIndex.delete(key);
            this.removeFromAccessOrder(key);
            this.misses++;
            return null;
        }

        try {
            const data = await fs.promises.readFile(filePath, 'utf-8');

            // Update access statistics and LRU order
            entry.lastAccess = Date.now();
            entry.accessCount++;
            this.updateAccessOrder(key);

            this.hits++;
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('Failed to read cache:', error as Error);
            this.misses++;
            return null;
        }
    }

    /**
     * Remove all cache entries and reset statistics.
     */
    public async clear(): Promise<void> {
        try {
            const files = await fs.promises.readdir(this.cacheDir);
            for (const file of files) {
                if (file !== 'index.json') {
                    await fs.promises.unlink(path.join(this.cacheDir, file));
                }
            }
            this.cacheIndex.clear();
            this.accessOrder = [];
            this.hits = 0;
            this.misses = 0;
            this.totalRequests = 0;
            await this.saveCacheIndex();
            this.logger.info('Cache cleared');
        } catch (error) {
            this.logger.error('Failed to clear cache:', error as Error);
        }
    }

    /**
     * Calculate total cache size from index entries.
     */
    public getSize(): number {
        let total = 0;
        for (const entry of this.cacheIndex.values()) {
            total += entry.size;
        }
        return total;
    }

    /**
     * Generate comprehensive cache performance statistics.
     */
    public getStats(): CacheStats {
        const hitRate = this.totalRequests > 0 ? this.hits / this.totalRequests : 0;

        return {
            entries: this.cacheIndex.size,
            size: this.getSize(),
            maxSize: this.maxCacheSize,
            hits: this.hits,
            misses: this.misses,
            hitRate,
            totalRequests: this.totalRequests
        };
    }

    /**
     * Emergency cleanup triggered by memory pressure.
     * Removes 50% of least recently used entries to free memory quickly.
     */
    public async cleanup(): Promise<void> {
        const beforeSize = this.getSize();
        const beforeEntries = this.cacheIndex.size;

        // Remove half of the least recently used entries
        const entriesToRemove = Math.floor(this.cacheIndex.size * 0.5);

        if (entriesToRemove === 0) {
            return;
        }

        this.logger.info(`Cleaning up ${entriesToRemove} cache entries due to memory pressure`);

        // Oldest entries are at the end of accessOrder array
        const keysToRemove = this.accessOrder.slice(-entriesToRemove);

        for (const key of keysToRemove) {
            await this.delete(key);
        }

        const afterSize = this.getSize();
        const afterEntries = this.cacheIndex.size;

        this.logger.info(`Cleanup complete: ${beforeEntries - afterEntries} entries removed, ${this.formatBytes(beforeSize - afterSize)} freed`);
    }

    /**
     * Enforce maximum cache size using LRU eviction.
     * Removes oldest entries until size limit is satisfied.
     */
    private async enforceMaxSize(): Promise<void> {
        let currentSize = this.getSize();

        if (currentSize <= this.maxCacheSize) {
            return;
        }

        this.logger.warn(`Cache size (${this.formatBytes(currentSize)}) exceeds limit (${this.formatBytes(this.maxCacheSize)}), evicting entries`);

        // Remove least recently used entries (oldest at end of array)
        const keysToRemove: string[] = [];

        for (let i = this.accessOrder.length - 1; i >= 0; i--) {
            if (currentSize <= this.maxCacheSize) {
                break;
            }

            const key = this.accessOrder[i];
            const entry = this.cacheIndex.get(key);
            if (entry) {
                keysToRemove.push(key);
                currentSize -= entry.size;
            }
        }

        for (const key of keysToRemove) {
            await this.delete(key);
        }

        await this.saveCacheIndex();
        this.logger.info(`Evicted ${keysToRemove.length} entries, new size: ${this.formatBytes(this.getSize())}`);
    }

    /**
     * Remove specific cache entry and its file.
     */
    private async delete(key: string): Promise<void> {
        const entry = this.cacheIndex.get(key);
        if (!entry) {
            return;
        }

        const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
            this.cacheIndex.delete(key);
            this.removeFromAccessOrder(key);
        } catch (error) {
            this.logger.error('Failed to delete cache file:', error as Error);
        }
    }

    /**
     * Move key to front of access order (most recently used).
     */
    private updateAccessOrder(key: string): void {
        this.removeFromAccessOrder(key);
        this.accessOrder.unshift(key);
    }

    /**
     * Remove key from LRU tracking array.
     */
    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Generate consistent hash for cache key filename.
     * Uses simple string hash algorithm for file system compatibility.
     */
    private hashKey(key: string): string {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Format byte count into human-readable string.
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
}

/**
 * Metadata for cached entries including access tracking.
 */
interface CacheEntry {
    hash: string;
    size: number;
    timestamp: number;
    lastAccess: number;
    accessCount: number;
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
