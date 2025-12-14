/**
 * Cache Warmer for Predictive Prefetching
 * Warms cache on document open to achieve <20ms cache hits
 */

import * as vscode from 'vscode';

export interface CacheWarmingStrategy {
    patterns: string[];
    maxPositions: number;
    enabled: boolean;
}

export class CacheWarmer {
    private warmingInProgress = new Set<string>();
    private warmedDocuments = new WeakSet<vscode.TextDocument>();

    constructor(
        private prefetchCallback: (doc: vscode.TextDocument, pos: vscode.Position) => Promise<void>
    ) {}

    /**
     * Warm cache for a document
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
                    batch.map(pos => this.prefetchCallback(document, pos).catch(() => {}))
                );
            }

            this.warmedDocuments.add(document);
        } finally {
            this.warmingInProgress.delete(document.uri.toString());
        }
    }

    /**
     * Find positions to warm based on common patterns
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
     * Get default warming strategy
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
     * Clear warmed documents cache
     */
    public clear(): void {
        this.warmedDocuments = new WeakSet();
        this.warmingInProgress.clear();
    }
}
