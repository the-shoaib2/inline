/**
 * Optimized Streaming Handler with Token Batching
 * Reduces overhead by batching tokens before UI updates
 * Target: <2ms per token (down from 5ms)
 */

import * as vscode from 'vscode';

export interface StreamingOptions {
    batchSize?: number;
    flushInterval?: number;
    enableBatching?: boolean;
}

export class OptimizedStreamingHandler {
    private tokenBuffer: string[] = [];
    private batchSize: number;
    private flushInterval: number;
    private flushTimer: NodeJS.Timeout | null = null;
    private callback: ((tokens: string) => void) | null = null;
    private enableBatching: boolean;
    private totalTokens = 0;
    private startTime = 0;

    constructor(options: StreamingOptions = {}) {
        this.batchSize = options.batchSize || 5;
        this.flushInterval = options.flushInterval || 50; // ms
        this.enableBatching = options.enableBatching !== false;
    }

    /**
     * Set the callback for batched tokens
     */
    public setCallback(callback: (tokens: string) => void): void {
        this.callback = callback;
    }

    /**
     * Process incoming token with batching
     */
    public onToken(token: string): void {
        if (!this.enableBatching) {
            // Direct mode for debugging
            this.callback?.(token);
            return;
        }

        this.tokenBuffer.push(token);
        this.totalTokens++;

        // Flush if batch size reached
        if (this.tokenBuffer.length >= this.batchSize) {
            this.flush();
        } else {
            // Schedule flush if not already scheduled
            if (!this.flushTimer) {
                this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
            }
        }
    }

    /**
     * Flush buffered tokens
     */
    private flush(): void {
        if (this.tokenBuffer.length === 0) return;

        const batch = this.tokenBuffer.join('');
        this.tokenBuffer = [];

        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }

        this.callback?.(batch);
    }

    /**
     * Force flush remaining tokens
     */
    public forceFlush(): void {
        this.flush();
    }

    /**
     * Start streaming session
     */
    public start(): void {
        this.startTime = Date.now();
        this.totalTokens = 0;
        this.tokenBuffer = [];
    }

    /**
     * End streaming session and get metrics
     */
    public end(): StreamingMetrics {
        this.forceFlush();
        
        const duration = Date.now() - this.startTime;
        const avgLatency = this.totalTokens > 0 ? duration / this.totalTokens : 0;

        return {
            totalTokens: this.totalTokens,
            duration,
            avgLatencyPerToken: avgLatency,
            throughput: this.totalTokens / (duration / 1000)
        };
    }

    /**
     * Reset handler
     */
    public reset(): void {
        this.tokenBuffer = [];
        this.totalTokens = 0;
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * Dispose resources
     */
    public dispose(): void {
        this.reset();
        this.callback = null;
    }
}

export interface StreamingMetrics {
    totalTokens: number;
    duration: number;
    avgLatencyPerToken: number;
    throughput: number; // tokens per second
}
