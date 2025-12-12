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
exports.CacheManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const shared_1 = require("@inline/shared");
/**
 * Persistent file-based cache with LRU eviction and memory management integration.
 *
 * Features:
 * - JSON-serialized cache entries stored on disk
 * - LRU access tracking for intelligent eviction
 * - Memory pressure response with automatic cleanup
 * - Performance metrics and statistics
 */
class CacheManager {
    constructor(context, memoryManager) {
        this.maxCacheSize = 100 * 1024 * 1024; // 100MB default, adjusted by memory manager
        this.cacheIndex = new Map();
        this.memoryManager = null;
        // LRU tracking - most recent at index 0
        this.accessOrder = [];
        // Performance metrics
        this.hits = 0;
        this.misses = 0;
        this.totalRequests = 0;
        this.cacheDir = path.join(context.globalStorageUri.fsPath, 'cache');
        this.logger = new shared_1.Logger('CacheManager');
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
    ensureCacheDirectory() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }
    /**
     * Load cache index from disk and initialize LRU order.
     * Sorts entries by last access time for accurate LRU tracking.
     */
    loadCacheIndex() {
        const indexPath = path.join(this.cacheDir, 'index.json');
        if (fs.existsSync(indexPath)) {
            try {
                const data = fs.readFileSync(indexPath, 'utf-8');
                const entries = JSON.parse(data);
                this.cacheIndex = new Map(entries);
                // Initialize LRU order - most recently accessed first
                this.accessOrder = Array.from(this.cacheIndex.entries())
                    .sort((a, b) => b[1].lastAccess - a[1].lastAccess)
                    .map(([key]) => key);
                this.logger.info(`Loaded ${this.cacheIndex.size} cache entries`);
            }
            catch (error) {
                this.logger.error('Failed to load cache index:', error);
            }
        }
    }
    /**
     * Persist cache index to disk.
     */
    async saveCacheIndex() {
        const indexPath = path.join(this.cacheDir, 'index.json');
        try {
            const entries = Array.from(this.cacheIndex.entries());
            await fs.promises.writeFile(indexPath, JSON.stringify(entries, null, 2));
        }
        catch (error) {
            this.logger.error('Failed to save cache index:', error);
        }
    }
    /**
     * Store value in cache with automatic LRU eviction.
     * Serializes to JSON and updates access tracking.
     */
    async set(key, value) {
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
        }
        catch (error) {
            this.logger.error('Failed to write cache:', error);
        }
    }
    /**
     * Retrieve value from cache with access tracking.
     * Returns null if key not found or file is missing.
     */
    async get(key) {
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
        }
        catch (error) {
            this.logger.error('Failed to read cache:', error);
            this.misses++;
            return null;
        }
    }
    /**
     * Remove all cache entries and reset statistics.
     */
    async clear() {
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
        }
        catch (error) {
            this.logger.error('Failed to clear cache:', error);
        }
    }
    /**
     * Calculate total cache size from index entries.
     */
    getSize() {
        let total = 0;
        for (const entry of this.cacheIndex.values()) {
            total += entry.size;
        }
        return total;
    }
    /**
     * Generate comprehensive cache performance statistics.
     */
    getStats() {
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
    async cleanup() {
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
    async enforceMaxSize() {
        let currentSize = this.getSize();
        if (currentSize <= this.maxCacheSize) {
            return;
        }
        this.logger.warn(`Cache size (${this.formatBytes(currentSize)}) exceeds limit (${this.formatBytes(this.maxCacheSize)}), evicting entries`);
        // Remove least recently used entries (oldest at end of array)
        const keysToRemove = [];
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
    async delete(key) {
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
        }
        catch (error) {
            this.logger.error('Failed to delete cache file:', error);
        }
    }
    /**
     * Move key to front of access order (most recently used).
     */
    updateAccessOrder(key) {
        this.removeFromAccessOrder(key);
        this.accessOrder.unshift(key);
    }
    /**
     * Remove key from LRU tracking array.
     */
    removeFromAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }
    /**
     * Generate consistent hash for cache key filename.
     * Uses simple string hash algorithm for file system compatibility.
     */
    hashKey(key) {
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
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=cache-manager.js.map