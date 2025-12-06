import * as vscode from 'vscode';
import { Logger } from '../../system/logger';

export enum Priority {
    P0_IMMEDIATE = 0,    // Current line, syntax highlighting (0-5ms)
    P1_FAST = 1,         // Function scope, imports, local variables (5-20ms)
    P2_MEDIUM = 2,       // File-level symbols, related files (20-50ms)
    P3_BACKGROUND = 3    // Project-wide search, duplicate detection (50-200ms)
}

export interface ContextRequest {
    id: string;
    document: vscode.TextDocument;
    position: vscode.Position;
    priority: Priority;
    timestamp: number;
    cancellationToken: vscode.CancellationToken;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

export interface PriorityQueueStats {
    queueSizes: Map<Priority, number>;
    totalProcessed: number;
    totalCancelled: number;
    averageWaitTime: number;
}

/**
 * Priority Queue for Context Requests
 * 
 * Prioritization:
 * - P0 (0-5ms): Current line, cursor position, selected text
 * - P1 (5-20ms): Function scope, local variables, imports
 * - P2 (20-50ms): File symbols, type definitions, globals
 * - P3 (50-200ms): Project search, similar code, duplicates
 */
export class PriorityQueue {
    private queues: Map<Priority, ContextRequest[]> = new Map();
    private processing: boolean = false;
    private logger: Logger;
    
    // Statistics
    private stats = {
        processed: 0,
        cancelled: 0,
        totalWaitTime: 0
    };

    constructor() {
        this.logger = new Logger('PriorityQueue');
        
        // Initialize queues for each priority level
        for (const priority of Object.values(Priority)) {
            if (typeof priority === 'number') {
                this.queues.set(priority, []);
            }
        }
    }

    /**
     * Enqueue a context request
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
     * Dequeue highest priority request
     */
    dequeue(): ContextRequest | null {
        // Check queues in priority order (P0 -> P3)
        for (let priority = Priority.P0_IMMEDIATE; priority <= Priority.P3_BACKGROUND; priority++) {
            const queue = this.queues.get(priority);
            if (queue && queue.length > 0) {
                const request = queue.shift()!;
                
                // Calculate wait time
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
     * Cancel all requests below a certain priority
     */
    cancelBelow(priority: Priority): void {
        let cancelledCount = 0;

        for (let p = priority + 1; p <= Priority.P3_BACKGROUND; p++) {
            const queue = this.queues.get(p);
            if (queue) {
                cancelledCount += queue.length;
                
                // Reject all pending requests
                queue.forEach(request => {
                    request.reject(new Error('Cancelled due to higher priority request'));
                });
                
                queue.length = 0; // Clear queue
            }
        }

        if (cancelledCount > 0) {
            this.stats.cancelled += cancelledCount;
            this.logger.debug(`Cancelled ${cancelledCount} requests below priority ${Priority[priority]}`);
        }
    }

    /**
     * Cancel all requests for a specific document
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

            // Remove in reverse order to maintain indices
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
     * Cancel all pending requests
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
     * Get total number of pending requests
     */
    size(): number {
        let total = 0;
        for (const queue of this.queues.values()) {
            total += queue.length;
        }
        return total;
    }

    /**
     * Check if queue is empty
     */
    isEmpty(): boolean {
        return this.size() === 0;
    }

    /**
     * Get queue statistics
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
     * Clear all queues
     */
    clear(): void {
        this.cancelAll();
        this.logger.info('Queue cleared');
    }

    /**
     * Get requests by priority
     */
    getRequestsByPriority(priority: Priority): ContextRequest[] {
        return this.queues.get(priority) || [];
    }

    /**
     * Check if processing
     */
    isProcessing(): boolean {
        return this.processing;
    }

    /**
     * Set processing state
     */
    setProcessing(value: boolean): void {
        this.processing = value;
    }
}
