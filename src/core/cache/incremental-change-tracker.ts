import * as vscode from 'vscode';
import { Logger } from '../../system/logger';

/**
 * Text change representation for incremental processing.
 */
export interface TextChange {
    range: vscode.Range;
    text: string;
    rangeLength: number;
}

/**
 * Computed change delta with affected line tracking.
 */
export interface ChangeDelta {
    uri: string;
    version: number;
    changes: TextChange[];
    affectedLines: Set<number>;
}

/**
 * Tracks document changes for incremental processing with debouncing.
 *
 * Features:
 * - Batches rapid changes to reduce processing overhead
 * - Computes affected line regions for targeted updates
 * - Version tracking for cache invalidation
 * - Debounced processing to handle typing bursts
 */
export class IncrementalChangeTracker {
    private documentVersions: Map<string, number> = new Map();
    private pendingChanges: Map<string, TextChange[]> = new Map();
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private logger: Logger;

    private readonly DEBOUNCE_DELAY = 300; // ms - balances responsiveness with performance

    constructor() {
        this.logger = new Logger('IncrementalChangeTracker');
    }

    /**
     * Track document change with debounced batch processing.
     * Updates version tracking and queues change for batch processing.
     */
    trackChange(
        uri: string,
        version: number,
        change: vscode.TextDocumentContentChangeEvent
    ): void {
        // Update document version for cache invalidation
        this.documentVersions.set(uri, version);

        const textChange: TextChange = {
            range: change.range,
            text: change.text,
            rangeLength: change.rangeLength || 0
        };

        // Queue change for batch processing
        const pending = this.pendingChanges.get(uri) || [];
        pending.push(textChange);
        this.pendingChanges.set(uri, pending);

        this.logger.debug(`Tracked change for ${uri}: ${change.text.length} chars`);

        // Debounce to batch rapid changes during typing
        this.debounceBatchProcessing(uri);
    }

    /**
     * Get current document version for cache validation.
     */
    getVersion(uri: string): number {
        return this.documentVersions.get(uri) || 0;
    }

    /**
     * Get queued changes for document processing.
     */
    getPendingChanges(uri: string): TextChange[] {
        return this.pendingChanges.get(uri) || [];
    }

    /**
     * Compute change delta with affected line analysis.
     * Used for targeted cache invalidation and incremental updates.
     */
    computeDelta(uri: string): ChangeDelta | null {
        const changes = this.pendingChanges.get(uri);
        if (!changes || changes.length === 0) {
            return null;
        }

        const version = this.documentVersions.get(uri) || 0;
        const affectedLines = this.computeAffectedLines(changes);

        return {
            uri,
            version,
            changes,
            affectedLines
        };
    }

    /**
     * Clear pending changes and cancel debounce timer.
     * Called after changes are processed or document is closed.
     */
    clearPending(uri: string): void {
        this.pendingChanges.delete(uri);

        // Cancel pending debounce timer
        const timer = this.debounceTimers.get(uri);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimers.delete(uri);
        }
    }

    /**
     * Reset all tracking data and cancel active timers.
     */
    clear(): void {
        this.documentVersions.clear();
        this.pendingChanges.clear();

        // Cancel all debounce timers to prevent memory leaks
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        this.logger.info('Change tracker cleared');
    }

    /**
     * Calculate all line numbers affected by text changes.
     * Includes both changed ranges and lines from inserted text.
     */
    private computeAffectedLines(changes: TextChange[]): Set<number> {
        const affectedLines = new Set<number>();

        for (const change of changes) {
            const startLine = change.range.start.line;
            const endLine = change.range.end.line;

            // Mark all lines in the changed range
            for (let line = startLine; line <= endLine; line++) {
                affectedLines.add(line);
            }

            // Include new lines from inserted text
            const newlineCount = (change.text.match(/\n/g) || []).length;
            for (let i = 1; i <= newlineCount; i++) {
                affectedLines.add(startLine + i);
            }
        }

        return affectedLines;
    }

    /**
     * Debounce rapid changes to batch process them efficiently.
     * Reduces processing overhead during typing bursts.
     */
    private debounceBatchProcessing(uri: string): void {
        // Cancel existing timer to extend debounce period
        const existingTimer = this.debounceTimers.get(uri);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule batch processing after debounce delay
        const timer = setTimeout(() => {
            this.processBatch(uri);
        }, this.DEBOUNCE_DELAY);

        this.debounceTimers.set(uri, timer);
    }

    /**
     * Process batched changes for monitoring and logging.
     * Actual cache invalidation is handled by the cache manager.
     */
    private processBatch(uri: string): void {
        const delta = this.computeDelta(uri);
        if (delta) {
            this.logger.debug(
                `Processed batch for ${uri}: ${delta.changes.length} changes, ` +
                `${delta.affectedLines.size} affected lines`
            );
        }

        // Cache invalidation is triggered separately - this is for monitoring only
    }

    /**
     * Check if document has unprocessed changes.
     */
    hasPendingChanges(uri: string): boolean {
        const changes = this.pendingChanges.get(uri);
        return changes !== undefined && changes.length > 0;
    }

    /**
     * Generate tracking statistics for monitoring.
     */
    getStats(): {
        trackedDocuments: number;
        totalPendingChanges: number;
        documentsWithPendingChanges: number;
    } {
        let totalPendingChanges = 0;
        let documentsWithPendingChanges = 0;

        for (const changes of this.pendingChanges.values()) {
            if (changes.length > 0) {
                totalPendingChanges += changes.length;
                documentsWithPendingChanges++;
            }
        }

        return {
            trackedDocuments: this.documentVersions.size,
            totalPendingChanges,
            documentsWithPendingChanges
        };
    }
}
