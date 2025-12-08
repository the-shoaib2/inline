import * as vscode from 'vscode';
import { Logger } from '@platform/system/logger';

/**
 * Detailed memory usage breakdown.
 * Includes heap, external, and RSS metrics.
 */
export interface MemoryStats {
    heap: {
        used: number;
        total: number;
        limit: number;
        usagePercent: number;
    };
    external: number;
    arrayBuffers: number;
    rss: number;
    total: number;
}

/**
 * Memory pressure level with cleanup recommendation.
 * Levels increase from none to critical.
 */
export interface MemoryPressure {
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    shouldCleanup: boolean;
    message?: string;
}

/**
 * Cache size allocation based on available heap.
 * Ensures caches don't exceed memory budget.
 */
export interface CacheAllocation {
    maxCacheSize: number;
    maxContextSize: number;
    maxHistorySize: number;
}

/**
 * Monitors extension memory usage and triggers cleanup.
 *
 * Responsibilities:
 * - Track heap, external, and RSS memory
 * - Detect memory pressure levels
 * - Trigger cleanup callbacks when thresholds exceeded
 * - Allocate cache budgets based on available memory
 * - Provide memory statistics for monitoring
 */
export class MemoryManager {
    private logger: Logger;
    private memoryCheckInterval: NodeJS.Timeout | null = null;
    private cleanupCallbacks: Array<() => Promise<void>> = [];

    // Memory pressure thresholds (percentage of V8 heap limit)
    private readonly PRESSURE_LOW = 0.6;
    private readonly PRESSURE_MEDIUM = 0.75;
    private readonly PRESSURE_HIGH = 0.85;
    private readonly PRESSURE_CRITICAL = 0.95;

    // Cache allocation: 20% of heap for all caches combined
    private readonly CACHE_ALLOCATION = 0.2;

    private isDevMode: boolean = false;

    constructor() {
        this.logger = new Logger('MemoryManager');
        this.startMonitoring();
    }

    /**
     * Set development mode status.
     * When enabled, memory pressure simulation is bypassed.
     */
    public setDevMode(isDev: boolean): void {
        this.isDevMode = isDev;
        if (isDev) {
            this.logger.info('Development mode enabled: Memory pressure checks bypassed');
        }
    }

    /**
     * Get current memory usage across all categories.
     * Includes heap, external, and RSS metrics.
     */
    public getMemoryStats(): MemoryStats {
        const usage = process.memoryUsage();

        // Get V8 heap limit for accurate percentage calculation
        const heapLimit = this.getHeapLimit();

        return {
            heap: {
                used: usage.heapUsed,
                total: usage.heapTotal,
                limit: heapLimit,
                usagePercent: (usage.heapUsed / heapLimit) * 100
            },
            external: usage.external,
            arrayBuffers: (usage as any).arrayBuffers || 0,
            rss: usage.rss,
            total: usage.rss
        };
    }

    /**
     * Get V8 JavaScript engine heap limit.
     * Attempts to read from v8 module, falls back to estimate.
     */
    private getHeapLimit(): number {
        // Try to get from v8 if available
        try {
            const v8 = require('v8');
            const heapStats = v8.getHeapStatistics();
            return heapStats.heap_size_limit;
        } catch {
            // Fallback: estimate based on Node.js defaults
            // Node.js typically uses ~1.4GB for 64-bit systems
            return 1.4 * 1024 * 1024 * 1024;
        }
    }

    /**
     * Check current memory pressure level
     */
    public getMemoryPressure(): MemoryPressure {
        // System memory usage checks removed completely as requested
        return {
            level: 'none',
            shouldCleanup: false
        };
    }

    /**
     * Calculate safe cache sizes based on available memory
     */
    public getCacheAllocation(): CacheAllocation {
        const stats = this.getMemoryStats();
        const availableForCaches = stats.heap.limit * this.CACHE_ALLOCATION;

        // Distribute cache allocation
        // 50% for completion cache, 30% for context cache, 20% for history
        return {
            maxCacheSize: Math.floor(availableForCaches * 0.5),
            maxContextSize: Math.floor(availableForCaches * 0.3),
            maxHistorySize: Math.floor(availableForCaches * 0.2)
        };
    }

    /**
     * Register a cleanup callback to be called on memory pressure
     */
    public registerCleanupCallback(callback: () => Promise<void>): void {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Trigger cleanup on all registered components
     */
    public async triggerCleanup(): Promise<void> {
        const pressure = this.getMemoryPressure();

        if (!pressure.shouldCleanup) {
            this.logger.info('No cleanup needed, memory pressure is low');
            return;
        }

        this.logger.warn(`Triggering memory cleanup: ${pressure.message}`);

        const startMem = this.getMemoryStats().heap.used;

        // Execute all cleanup callbacks
        const results = await Promise.allSettled(
            this.cleanupCallbacks.map(cb => cb())
        );

        // Log any failures
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                this.logger.error(`Cleanup callback ${index} failed:`, result.reason);
            }
        });

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const endMem = this.getMemoryStats().heap.used;
        const freed = startMem - endMem;

        this.logger.info(`Memory cleanup completed. Freed: ${this.formatBytes(freed)}`);
    }

    /**
     * Start periodic memory monitoring
     */
    private startMonitoring(): void {
        // Check memory every 30 seconds
        this.memoryCheckInterval = setInterval(() => {
            const pressure = this.getMemoryPressure();

            if (pressure.level === 'critical' || pressure.level === 'high') {
                this.logger.warn(pressure.message!);
                this.triggerCleanup().catch(err => {
                    this.logger.error('Auto cleanup failed:', err);
                });
            } else if (pressure.level === 'medium') {
                this.logger.info(pressure.message!);
            }
        }, 30000);
    }

    /**
     * Stop memory monitoring
     */
    public stopMonitoring(): void {
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
            this.memoryCheckInterval = null;
        }
    }

    /**
     * Format bytes to human-readable string
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Get formatted memory report
     */
    public getMemoryReport(): string {
        const stats = this.getMemoryStats();
        const pressure = this.getMemoryPressure();
        const allocation = this.getCacheAllocation();

        return `
Memory Report (Extension Process):
  Heap: ${this.formatBytes(stats.heap.used)} / ${this.formatBytes(stats.heap.limit)} (${stats.heap.usagePercent.toFixed(1)}%)
  External: ${this.formatBytes(stats.external)}
  RSS: ${this.formatBytes(stats.rss)}
  Pressure: ${pressure.level}${pressure.message ? ' - ' + pressure.message : ''}

Cache Allocation:
  Max Completion Cache: ${this.formatBytes(allocation.maxCacheSize)}
  Max Context Cache: ${this.formatBytes(allocation.maxContextSize)}
  Max History Cache: ${this.formatBytes(allocation.maxHistorySize)}
        `.trim();
    }

    /**
     * Cleanup resources
     */
    public dispose(): void {
        this.stopMonitoring();
        this.cleanupCallbacks = [];
    }
}
