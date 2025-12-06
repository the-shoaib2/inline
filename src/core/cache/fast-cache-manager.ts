import * as vscode from 'vscode';
import { Logger } from '../../system/logger';
import { ASTCache } from './ast-cache';
import { OpenFilesCache } from './open-files-cache';
import { IncrementalChangeTracker } from './incremental-change-tracker';

/**
 * Fast Cache Manager
 * 
 * Coordinates L1 (AST) and L2 (Open Files) caches with incremental change tracking.
 * Provides unified interface for fast context retrieval.
 */
export class FastCacheManager {
    private astCache: ASTCache;
    private openFilesCache: OpenFilesCache;
    private changeTracker: IncrementalChangeTracker;
    private logger: Logger;

    // Document change listener
    private changeListener: vscode.Disposable | null = null;
    private closeListener: vscode.Disposable | null = null;

    constructor() {
        this.astCache = new ASTCache(100); // 100MB
        this.openFilesCache = new OpenFilesCache(10); // 10 recent files
        this.changeTracker = new IncrementalChangeTracker();
        this.logger = new Logger('FastCacheManager');

        this.setupListeners();
    }

    /**
     * Setup document change listeners
     */
    private setupListeners(): void {
        // Listen for document changes
        this.changeListener = vscode.workspace.onDidChangeTextDocument(event => {
            const uri = event.document.uri.toString();
            const version = event.document.version;

            // Track changes
            for (const change of event.contentChanges) {
                this.changeTracker.trackChange(uri, version, change);
            }

            // Invalidate caches
            this.astCache.invalidate(uri);
            this.openFilesCache.invalidate(uri);

            this.logger.debug(`Document changed: ${uri}, version ${version}`);
        });

        // Listen for document close
        this.closeListener = vscode.workspace.onDidCloseTextDocument(document => {
            const uri = document.uri.toString();
            this.openFilesCache.closeFile(uri);
            this.logger.debug(`Document closed: ${uri}`);
        });
    }

    /**
     * Get AST from L1 cache
     */
    getAST(uri: string, version: number): any | null {
        return this.astCache.get(uri, version);
    }

    /**
     * Store AST in L1 cache
     */
    setAST(uri: string, ast: any, version: number, size: number): void {
        this.astCache.set(uri, ast, version, size);
    }

    /**
     * Get parsed file context from L2 cache
     */
    getFileContext(uri: string, version: number): any | null {
        return this.openFilesCache.get(uri, version);
    }

    /**
     * Store parsed file context in L2 cache
     */
    setFileContext(uri: string, context: any): void {
        this.openFilesCache.setOpenFile(uri, context);
    }

    /**
     * Mark file as opened
     */
    openFile(uri: string): void {
        this.openFilesCache.openFile(uri);
    }

    /**
     * Mark file as closed
     */
    closeFile(uri: string): void {
        this.openFilesCache.closeFile(uri);
    }

    /**
     * Get change delta for incremental processing
     */
    getChangeDelta(uri: string): any {
        return this.changeTracker.computeDelta(uri);
    }

    /**
     * Clear pending changes
     */
    clearPendingChanges(uri: string): void {
        this.changeTracker.clearPending(uri);
    }

    /**
     * Get all open file URIs
     */
    getOpenFiles(): string[] {
        return this.openFilesCache.getOpenFiles();
    }

    /**
     * Get combined cache statistics
     */
    getStats(): {
        l1: any;
        l2: any;
        changeTracker: any;
    } {
        return {
            l1: this.astCache.getStats(),
            l2: this.openFilesCache.getStats(),
            changeTracker: this.changeTracker.getStats()
        };
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.astCache.clear();
        this.openFilesCache.clear();
        this.changeTracker.clear();
        this.logger.info('All caches cleared');
    }

    /**
     * Dispose resources
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
     * Get memory usage summary
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
