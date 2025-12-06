import * as vscode from 'vscode';
import { Logger } from '../../system/logger';

export interface TextChange {
    range: vscode.Range;
    text: string;
    rangeLength: number;
}

export interface ChangeDelta {
    uri: string;
    version: number;
    changes: TextChange[];
    affectedLines: Set<number>;
}

/**
 * Incremental Change Tracker
 * 
 * Tracks document changes efficiently for incremental processing.
 * Batches small changes and computes affected regions.
 */
export class IncrementalChangeTracker {
    private documentVersions: Map<string, number> = new Map();
    private pendingChanges: Map<string, TextChange[]> = new Map();
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
    private logger: Logger;
    
    private readonly DEBOUNCE_DELAY = 300; // ms

    constructor() {
        this.logger = new Logger('IncrementalChangeTracker');
    }

    /**
     * Track a document change
     */
    trackChange(
        uri: string,
        version: number,
        change: vscode.TextDocumentContentChangeEvent
    ): void {
        // Update version
        this.documentVersions.set(uri, version);

        // Convert to TextChange
        const textChange: TextChange = {
            range: change.range,
            text: change.text,
            rangeLength: change.rangeLength || 0
        };

        // Add to pending changes
        const pending = this.pendingChanges.get(uri) || [];
        pending.push(textChange);
        this.pendingChanges.set(uri, pending);

        this.logger.debug(`Tracked change for ${uri}: ${change.text.length} chars`);

        // Debounce processing
        this.debounceBatchProcessing(uri);
    }

    /**
     * Get current version for a document
     */
    getVersion(uri: string): number {
        return this.documentVersions.get(uri) || 0;
    }

    /**
     * Get pending changes for a document
     */
    getPendingChanges(uri: string): TextChange[] {
        return this.pendingChanges.get(uri) || [];
    }

    /**
     * Compute change delta for a document
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
     * Clear pending changes for a document
     */
    clearPending(uri: string): void {
        this.pendingChanges.delete(uri);
        
        // Cancel debounce timer
        const timer = this.debounceTimers.get(uri);
        if (timer) {
            clearTimeout(timer);
            this.debounceTimers.delete(uri);
        }
    }

    /**
     * Clear all tracking data
     */
    clear(): void {
        this.documentVersions.clear();
        this.pendingChanges.clear();
        
        // Cancel all timers
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();
        
        this.logger.info('Change tracker cleared');
    }

    /**
     * Compute affected line numbers from changes
     */
    private computeAffectedLines(changes: TextChange[]): Set<number> {
        const affectedLines = new Set<number>();

        for (const change of changes) {
            const startLine = change.range.start.line;
            const endLine = change.range.end.line;

            // Add all lines in the range
            for (let line = startLine; line <= endLine; line++) {
                affectedLines.add(line);
            }

            // If text contains newlines, add those lines too
            const newlineCount = (change.text.match(/\n/g) || []).length;
            for (let i = 1; i <= newlineCount; i++) {
                affectedLines.add(startLine + i);
            }
        }

        return affectedLines;
    }

    /**
     * Debounce batch processing of changes
     */
    private debounceBatchProcessing(uri: string): void {
        // Cancel existing timer
        const existingTimer = this.debounceTimers.get(uri);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.processBatch(uri);
        }, this.DEBOUNCE_DELAY);

        this.debounceTimers.set(uri, timer);
    }

    /**
     * Process batched changes
     */
    private processBatch(uri: string): void {
        const delta = this.computeDelta(uri);
        if (delta) {
            this.logger.debug(
                `Processed batch for ${uri}: ${delta.changes.length} changes, ` +
                `${delta.affectedLines.size} affected lines`
            );
        }
        
        // Note: Actual processing will be triggered by cache invalidation
        // This is just for logging/monitoring
    }

    /**
     * Check if document has pending changes
     */
    hasPendingChanges(uri: string): boolean {
        const changes = this.pendingChanges.get(uri);
        return changes !== undefined && changes.length > 0;
    }

    /**
     * Get statistics
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
