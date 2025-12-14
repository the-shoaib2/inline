/**
 * Cache Warmer for Predictive Prefetching.
 * 
 * Warms cache on document open to achieve <20ms cache hits by pre-fetching
 * completions for likely cursor positions based on common code patterns.
 * 
 * @example
 * ```typescript
 * const warmer = new CacheWarmer(async (doc, pos) => {
 *   await provider.prefetch(doc, pos);
 * });
 * 
 * await warmer.warmCache(document, {
 *   patterns: ['function ', 'class '],
 *   maxPositions: 5,
 *   enabled: true
 * });
 * ```
 */

import * as vscode from 'vscode';
import { Logger } from '@inline/shared';

/**
 * Strategy configuration for cache warming.
 * 
 * Defines which code patterns to search for and how many positions
 * to warm per pattern.
 */
export interface CacheWarmingStrategy {
    /** Code patterns to search for (e.g., 'function ', 'class ', 'const ') */
    patterns: string[];
    
    /** Maximum number of positions to warm per pattern (default: 5) */
    maxPositions: number;
    
    /** Whether cache warming is enabled (default: true) */
    enabled: boolean;
}

export class CacheWarmer {
    private warmingInProgress = new Set<string>();
    private warmedDocuments = new WeakSet<vscode.TextDocument>();
    private logger: Logger;

    /**
     * Creates a new CacheWarmer instance.
     * 
     * @param prefetchCallback - Async function to call for prefetching completions
     *                           at a given document position
     */
    constructor(
        private prefetchCallback: (doc: vscode.TextDocument, pos: vscode.Position) => Promise<void>
    ) {
        this.logger = new Logger('CacheWarmer');
    }

    /**
     * Warm cache for a document by prefetching completions at likely positions.
     * 
     * Searches for common code patterns and prefetches completions in batches
     * to avoid overwhelming the system. Skips warming if:
     * - Strategy is disabled
     * - Document was already warmed
     * - Warming is already in progress for this document
     * 
     * @param document - The text document to warm cache for
     * @param strategy - Optional warming strategy (uses default if not provided)
     * @returns Promise that resolves when warming is complete
     * 
     * @example
     * ```typescript
     * await warmer.warmCache(document, {
     *   patterns: ['function ', 'class ', 'const '],
     *   maxPositions: 10,
     *   enabled: true
     * });
     * ```
     */
    public async warmCache(
        document: vscode.TextDocument,
        strategy: CacheWarmingStrategy = this.getDefaultStrategy()
    ): Promise<void> {
        if (!strategy.enabled) return;
        if (this.warmedDocuments.has(document)) return;
        if (this.warmingInProgress.has(document.uri.toString())) return;

        this.warmingInProgress.add(document.uri.toString());

        try {
            const positions = this.findWarmingPositions(document, strategy);
            
            // Prefetch in parallel (limited concurrency)
            const batchSize = 3;
            for (let i = 0; i < positions.length; i += batchSize) {
                const batch = positions.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(pos => this.prefetchCallback(document, pos).catch((error) => {
                        // Log prefetch failures for debugging, but don't fail the entire warming process
                        this.logger.warn(`Failed to prefetch at position ${pos.line}:${pos.character}`, error as Error);
                    }))
                );
            }

            this.warmedDocuments.add(document);
        } finally {
            this.warmingInProgress.delete(document.uri.toString());
        }
    }

    /**
     * Find positions to warm based on common code patterns.
     * 
     * Searches the document for specified patterns and returns positions
     * immediately after each pattern occurrence, up to maxPositions per pattern.
     * 
     * @param document - The document to search
     * @param strategy - Strategy defining patterns and limits
     * @returns Array of positions to warm
     * @private
     */
    private findWarmingPositions(
        document: vscode.TextDocument,
        strategy: CacheWarmingStrategy
    ): vscode.Position[] {
        const positions: vscode.Position[] = [];
        const text = document.getText();

        for (const pattern of strategy.patterns) {
            let index = 0;
            let count = 0;

            while (count < strategy.maxPositions) {
                index = text.indexOf(pattern, index);
                if (index === -1) break;

                const position = document.positionAt(index + pattern.length);
                positions.push(position);
                
                index += pattern.length;
                count++;
            }
        }

        return positions;
    }

    /**
     * Get default warming strategy from VS Code configuration.
     * 
     * Reads configuration values from 'inline.cacheWarming' settings.
     * Falls back to sensible defaults if configuration is not set.
     * 
     * @returns Default cache warming strategy
     * @private
     */
    private getDefaultStrategy(): CacheWarmingStrategy {
        const config = vscode.workspace.getConfiguration('inline');
        
        return {
            patterns: [
                'function ',
                'const ',
                'let ',
                'var ',
                'class ',
                'interface ',
                'type ',
                'import ',
                'export ',
                'async ',
                'await ',
                'return ',
                'if (',
                'for (',
                'while ('
            ],
            maxPositions: config.get<number>('cacheWarming.maxPositions', 5),
            enabled: config.get<boolean>('cacheWarming.enabled', true)
        };
    }

    /**
     * Clear all warmed documents from cache.
     * 
     * Forces re-warming on next access. Useful when document content
     * has changed significantly or when resetting the extension state.
     * 
     * @example
     * ```typescript
     * warmer.clear(); // Clear all warmed documents
     * ```
     */
    public clear(): void {
        this.warmedDocuments = new WeakSet();
        this.warmingInProgress.clear();
    }
}
