import * as vscode from 'vscode';
import { Logger } from '@platform/system/logger';
import { ImportInfo, FunctionInfo, SymbolInfo } from '@context/context-engine';

export interface ParsedFileContext {
    symbols: SymbolInfo[];
    imports: ImportInfo[];
    functions: FunctionInfo[];
    classes: any[];
    lastAccess: number;
    version: number;
    size: number;
}

export interface OpenFilesCacheStats {
    openFileCount: number;
    recentFileCount: number;
    totalSize: number;
    hitRate: number;
}

/**
 * L2 Cache: Open Files + Recent Files Cache
 * Target: <10ms access time
 * 
 * Features:
 * - Caches all open editor tabs
 * - Maintains last 10 accessed files
 * - Fast symbol lookup
 * - Auto-refresh on file changes
 */
export class OpenFilesCache {
    private openFiles: Map<string, ParsedFileContext> = new Map();
    private recentFiles: Map<string, ParsedFileContext> = new Map();
    private recentAccessOrder: string[] = [];
    private readonly MAX_RECENT: number;
    private logger: Logger;
    
    // Statistics
    private stats = {
        hits: 0,
        misses: 0
    };

    constructor(maxRecentFiles: number = 10) {
        this.MAX_RECENT = maxRecentFiles;
        this.logger = new Logger('OpenFilesCache');
    }

    /**
     * Get parsed context for a file
     */
    get(uri: string, version: number): ParsedFileContext | null {
        // Check open files first
        let context = this.openFiles.get(uri);
        
        // Then check recent files
        if (!context) {
            context = this.recentFiles.get(uri);
        }

        if (!context) {
            this.stats.misses++;
            return null;
        }

        // Verify version
        if (context.version !== version) {
            this.logger.debug(`Version mismatch for ${uri}`);
            this.stats.misses++;
            return null;
        }

        // Update access time
        context.lastAccess = Date.now();
        this.updateRecentAccess(uri);
        this.stats.hits++;

        return context;
    }

    /**
     * Store parsed context for an open file
     */
    setOpenFile(uri: string, context: ParsedFileContext): void {
        this.openFiles.set(uri, {
            ...context,
            lastAccess: Date.now()
        });
        this.updateRecentAccess(uri);
        this.logger.debug(`Cached open file: ${uri}`);
    }

    /**
     * Mark file as closed (move to recent files)
     */
    closeFile(uri: string): void {
        const context = this.openFiles.get(uri);
        if (context) {
            this.openFiles.delete(uri);
            this.addToRecentFiles(uri, context);
            this.logger.debug(`Moved to recent files: ${uri}`);
        }
    }

    /**
     * Mark file as opened (move from recent to open)
     */
    openFile(uri: string): void {
        const context = this.recentFiles.get(uri);
        if (context) {
            this.recentFiles.delete(uri);
            this.openFiles.set(uri, context);
            this.logger.debug(`Moved to open files: ${uri}`);
        }
    }

    /**
     * Invalidate cache for a file
     */
    invalidate(uri: string): void {
        this.openFiles.delete(uri);
        this.recentFiles.delete(uri);
        this.removeFromRecentAccess(uri);
        this.logger.debug(`Invalidated cache for ${uri}`);
    }

    /**
     * Get all open file URIs
     */
    getOpenFiles(): string[] {
        return Array.from(this.openFiles.keys());
    }

    /**
     * Get all recent file URIs
     */
    getRecentFiles(): string[] {
        return Array.from(this.recentFiles.keys());
    }

    /**
     * Clear all caches
     */
    clear(): void {
        this.openFiles.clear();
        this.recentFiles.clear();
        this.recentAccessOrder = [];
        this.logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    getStats(): OpenFilesCacheStats {
        const totalRequests = this.stats.hits + this.stats.misses;
        const totalSize = this.calculateTotalSize();

        return {
            openFileCount: this.openFiles.size,
            recentFileCount: this.recentFiles.size,
            totalSize,
            hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0
        };
    }

    /**
     * Add to recent files with LRU eviction
     */
    private addToRecentFiles(uri: string, context: ParsedFileContext): void {
        // If already in recent, update it
        if (this.recentFiles.has(uri)) {
            this.recentFiles.set(uri, context);
            this.updateRecentAccess(uri);
            return;
        }

        // Evict if at capacity
        if (this.recentFiles.size >= this.MAX_RECENT) {
            const lruUri = this.recentAccessOrder[0];
            this.recentFiles.delete(lruUri);
            this.recentAccessOrder.shift();
            this.logger.debug(`Evicted from recent files: ${lruUri}`);
        }

        this.recentFiles.set(uri, context);
        this.updateRecentAccess(uri);
    }

    /**
     * Update recent access order
     */
    private updateRecentAccess(uri: string): void {
        this.removeFromRecentAccess(uri);
        this.recentAccessOrder.push(uri);
    }

    /**
     * Remove from recent access order
     */
    private removeFromRecentAccess(uri: string): void {
        const index = this.recentAccessOrder.indexOf(uri);
        if (index !== -1) {
            this.recentAccessOrder.splice(index, 1);
        }
    }

    /**
     * Calculate total cache size
     */
    private calculateTotalSize(): number {
        let total = 0;
        
        for (const context of this.openFiles.values()) {
            total += context.size || 0;
        }
        
        for (const context of this.recentFiles.values()) {
            total += context.size || 0;
        }

        return total;
    }

    /**
     * Find symbol across all cached files
     */
    findSymbol(name: string): SymbolInfo | null {
        // Search open files first
        for (const context of this.openFiles.values()) {
            const symbol = context.symbols.find(s => s.name === name);
            if (symbol) {
                return symbol;
            }
        }

        // Then search recent files
        for (const context of this.recentFiles.values()) {
            const symbol = context.symbols.find(s => s.name === name);
            if (symbol) {
                return symbol;
            }
        }

        return null;
    }

    /**
     * Get all imports from cached files
     */
    getAllImports(): ImportInfo[] {
        const imports: ImportInfo[] = [];
        
        for (const context of this.openFiles.values()) {
            imports.push(...context.imports);
        }
        
        for (const context of this.recentFiles.values()) {
            imports.push(...context.imports);
        }

        return imports;
    }
}
