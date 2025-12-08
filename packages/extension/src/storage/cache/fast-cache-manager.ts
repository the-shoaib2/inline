import * as vscode from 'vscode';
import { Logger } from '@platform/system/logger';
import { ASTCache } from './ast-cache';
import { OpenFilesCache, ParsedFileContext } from './open-files-cache';
import { IncrementalChangeTracker } from './incremental-change-tracker';

/**
 * Coordinates multi-tier caching system with incremental change tracking.
 *
 * Features:
 * - L1 cache: AST storage for parsed syntax trees
 * - L2 cache: Open files context for active documents
 * - Incremental change tracking for targeted updates
 * - Automatic cache invalidation on document changes
 */
export class FastCacheManager {
    private astCache: ASTCache;
    private openFilesCache: OpenFilesCache;
    private changeTracker: IncrementalChangeTracker;
    private logger: Logger;

    // Event listeners for document lifecycle
    private changeListener: vscode.Disposable | null = null;
    private closeListener: vscode.Disposable | null = null;

    constructor() {
        this.astCache = new ASTCache(100); // 100MB for AST cache
        this.openFilesCache = new OpenFilesCache(10); // Track 10 recent files
        this.changeTracker = new IncrementalChangeTracker();
        this.logger = new Logger('FastCacheManager');

        this.setupListeners();
    }

    /**
     * Setup document event listeners for automatic cache management.
     */
    private setupListeners(): void {
        // Track document changes for cache invalidation
        this.changeListener = vscode.workspace.onDidChangeTextDocument(event => {
            const uri = event.document.uri.toString();
            const version = event.document.version;

            // Queue changes for incremental processing
            for (const change of event.contentChanges) {
                this.changeTracker.trackChange(uri, version, change);
            }

            // Invalidate affected caches
            this.astCache.invalidate(uri);
            this.openFilesCache.invalidate(uri);

            this.logger.debug(`Document changed: ${uri}, version ${version}`);
        });

        // Clean up cache when documents are closed
        this.closeListener = vscode.workspace.onDidCloseTextDocument(document => {
            const uri = document.uri.toString();
            this.openFilesCache.closeFile(uri);
            this.logger.debug(`Document closed: ${uri}`);
        });
    }

    /**
     * Retrieve cached AST if version matches.
     */
    getAST(uri: string, version: number): unknown | null {
        return this.astCache.get(uri, version);
    }

    /**
     * Store AST in L1 cache with version tracking.
     */
    setAST(uri: string, ast: unknown, version: number, size: number): void {
        this.astCache.set(uri, ast, version, size);
    }

    /**
     * Retrieve parsed file context from L2 cache.
     */
    getFileContext(uri: string, version: number): unknown | null {
        return this.openFilesCache.get(uri, version);
    }

    /**
     * Store parsed file context in L2 cache.
     */
    setFileContext(uri: string, context: ParsedFileContext): void {
        this.openFilesCache.setOpenFile(uri, context);
    }

    /**
     * Mark file as opened in L2 cache tracking.
     */
    openFile(uri: string): void {
        this.openFilesCache.openFile(uri);
    }

    /**
     * Mark file as closed and clean up L2 cache entry.
     */
    closeFile(uri: string): void {
        this.openFilesCache.closeFile(uri);
    }

    /**
     * Get computed change delta for incremental processing.
     */
    getChangeDelta(uri: string): unknown {
        return this.changeTracker.computeDelta(uri);
    }

    /**
     * Clear processed changes from tracking queue.
     */
    clearPendingChanges(uri: string): void {
        this.changeTracker.clearPending(uri);
    }

    /**
     * Get list of currently tracked open files.
     */
    getOpenFiles(): string[] {
        return this.openFilesCache.getOpenFiles();
    }

    /**
     * Generate comprehensive cache statistics across all tiers.
     */
    getStats(): {
        l1: unknown;
        l2: unknown;
        changeTracker: unknown;
    } {
        return {
            l1: this.astCache.getStats(),
            l2: this.openFilesCache.getStats(),
            changeTracker: this.changeTracker.getStats()
        };
    }

    /**
     * Reset all cache tiers and tracking data.
     */
    clear(): void {
        this.astCache.clear();
        this.openFilesCache.clear();
        this.changeTracker.clear();
        this.logger.info('All caches cleared');
    }

    /**
     * Clean up event listeners and cache data.
     */
    dispose(): void {
        if (this.changeListener) {
            this.changeListener.dispose();
        }
        if (this.closeListener) {
            this.closeListener.dispose();
        }
        this.clear();
    }

    /**
     * Generate memory usage summary across cache tiers.
     */
    getMemoryUsage(): {
        l1Usage: number;
        l1Percentage: number;
        l2Size: number;
        isNearCapacity: boolean;
    } {
        const l1Stats = this.astCache.getStats();
        const l2Stats = this.openFilesCache.getStats();

        return {
            l1Usage: l1Stats.totalSize,
            l1Percentage: this.astCache.getMemoryUsage(),
            l2Size: l2Stats.totalSize,
            isNearCapacity: this.astCache.isNearCapacity(0.8)
        };
    }
}
