/**
 * Priority-based request queue for context processing.
 *
 * Manages context requests with different priority levels to ensure
 * responsive UI performance while processing background tasks.
 */

import * as vscode from 'vscode';
import { Logger } from '@inline/shared';

/**
 * Priority levels for context processing requests.
 * Lower numbers indicate higher priority and faster response requirements.
 */
export enum Priority {
    P0_IMMEDIATE = 0,    // Current line, syntax highlighting (0-5ms response)
    P1_FAST = 1,         // Function scope, imports, local variables (5-20ms)
    P2_MEDIUM = 2,       // File-level symbols, related files (20-50ms)
    P3_BACKGROUND = 3    // Project-wide search, duplicate detection (50-200ms)
}

/**
 * Context processing request with priority and cancellation support.
 */
export interface ContextRequest {
    id: string;
    document: vscode.TextDocument;
    position: vscode.Position;
    priority: Priority;
    timestamp: number;
    cancellationToken: vscode.CancellationToken;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}

/**
 * Queue performance statistics for monitoring and optimization.
 */
export interface PriorityQueueStats {
    queueSizes: Map<Priority, number>;
    totalProcessed: number;
    totalCancelled: number;
    averageWaitTime: number;
}

/**
 * Priority queue implementation for context processing requests.
 *
 * Features:
 * - Multi-level priority system (P0-P3) with response time targets
 * - Automatic cancellation of lower-priority requests
 * - Document-specific request cancellation
 * - Performance statistics and monitoring
 * - Thread-safe request processing
 */
export class PriorityQueue {
    private queues: Map<Priority, ContextRequest[]> = new Map();
    private processing: boolean = false;
    private logger: Logger;

    // Performance tracking
    private stats = {
        processed: 0,
        cancelled: 0,
        totalWaitTime: 0
    };

    constructor() {
        this.logger = new Logger('PriorityQueue');

        // Initialize separate queues for each priority level
        for (const priority of Object.values(Priority)) {
            if (typeof priority === 'number') {
                this.queues.set(priority, []);
            }
        }
    }

    /**
     * Add a context request to the appropriate priority queue.
     *
     * @param request - Context request with priority level
     */
    enqueue(request: ContextRequest): void {
        const queue = this.queues.get(request.priority);
        if (!queue) {
            this.logger.error(`Invalid priority: ${request.priority}`);
            return;
        }

        queue.push(request);
        this.logger.debug(`Enqueued request ${request.id} with priority ${Priority[request.priority]}`);
    }

    /**
     * Retrieve and remove the highest priority request.
     * Processes queues in order: P0 → P1 → P2 → P3.
     *
     * @returns Highest priority request or null if queue is empty
     */
    dequeue(): ContextRequest | null {
        // Check queues in priority order (highest to lowest)
        for (let priority = Priority.P0_IMMEDIATE; priority <= Priority.P3_BACKGROUND; priority++) {
            const queue = this.queues.get(priority);
            if (queue && queue.length > 0) {
                const request = queue.shift()!;

                // Track performance metrics
                const waitTime = Date.now() - request.timestamp;
                this.stats.totalWaitTime += waitTime;
                this.stats.processed++;

                this.logger.debug(`Dequeued request ${request.id} (waited ${waitTime}ms)`);
                return request;
            }
        }

        return null;
    }

    /**
     * Cancel all requests below specified priority level.
     * Used when high-priority work needs immediate processing.
     *
     * @param priority - Priority threshold (requests below this will be cancelled)
     */
    cancelBelow(priority: Priority): void {
        let cancelledCount = 0;

        // Cancel all lower priority queues
        for (let p = priority + 1; p <= Priority.P3_BACKGROUND; p++) {
            const queue = this.queues.get(p);
            if (queue) {
                cancelledCount += queue.length;

                // Reject all pending requests with appropriate error
                queue.forEach(request => {
                    request.reject(new Error('Cancelled due to higher priority request'));
                });

                queue.length = 0; // Clear queue efficiently
            }
        }

        if (cancelledCount > 0) {
            this.stats.cancelled += cancelledCount;
            this.logger.debug(`Cancelled ${cancelledCount} requests below priority ${Priority[priority]}`);
        }
    }

    /**
     * Cancel all pending requests for a specific document.
     * Typically called when document is modified or closed.
     *
     * @param uri - Document URI to cancel requests for
     */
    cancelForDocument(uri: string): void {
        let cancelledCount = 0;

        for (const queue of this.queues.values()) {
            const toRemove: number[] = [];

            queue.forEach((request, index) => {
                if (request.document.uri.toString() === uri) {
                    request.reject(new Error('Cancelled due to document change'));
                    toRemove.push(index);
                }
            });

            // Remove in reverse order to maintain valid indices
            toRemove.reverse().forEach(index => {
                queue.splice(index, 1);
                cancelledCount++;
            });
        }

        if (cancelledCount > 0) {
            this.stats.cancelled += cancelledCount;
            this.logger.debug(`Cancelled ${cancelledCount} requests for document ${uri}`);
        }
    }

    /**
     * Cancel all pending requests across all priority levels.
     * Used during shutdown or queue reset.
     */
    cancelAll(): void {
        let cancelledCount = 0;

        for (const queue of this.queues.values()) {
            cancelledCount += queue.length;

            queue.forEach(request => {
                request.reject(new Error('Queue cleared'));
            });

            queue.length = 0;
        }

        if (cancelledCount > 0) {
            this.stats.cancelled += cancelledCount;
            this.logger.debug(`Cancelled all ${cancelledCount} pending requests`);
        }
    }

    /**
     * Get total number of pending requests across all priority levels.
     *
     * @returns Total queue size
     */
    size(): number {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }

    /**
     * Check if all queues are empty.
     *
     * @returns true if no pending requests
     */
    isEmpty(): boolean {
        return this.size() === 0;
    }

    /**
     * Generate comprehensive queue performance statistics.
     *
     * @returns Queue metrics including sizes and wait times
     */
    getStats(): PriorityQueueStats {
        const queueSizes = new Map<Priority, number>();

        for (const [priority, queue] of this.queues.entries()) {
            queueSizes.set(priority, queue.length);
        }

        return {
            queueSizes,
            totalProcessed: this.stats.processed,
            totalCancelled: this.stats.cancelled,
            averageWaitTime: this.stats.processed > 0
                ? this.stats.totalWaitTime / this.stats.processed
                : 0
        };
    }

    /**
     * Clear all queues and reset statistics.
     */
    clear(): void {
        this.cancelAll();
        this.logger.info('Queue cleared');
    }

    /**
     * Get all pending requests for a specific priority level.
     *
     * @param priority - Priority level to query
     * @returns Array of pending requests (may be empty)
     */
    getRequestsByPriority(priority: Priority): ContextRequest[] {
        return this.queues.get(priority) || [];
    }

    /**
     * Check if queue is currently processing requests.
     *
     * @returns true if processing is active
     */
    isProcessing(): boolean {
        return this.processing;
    }

    /**
     * Set the processing state flag.
     * Used to prevent concurrent processing.
     *
     * @param value - Processing state
     */
    setProcessing(value: boolean): void {
        this.processing = value;
    }
}
