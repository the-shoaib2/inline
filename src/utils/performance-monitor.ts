import { Logger } from './logger';

export interface CompletionMetrics {
    contextGatherTime: number;
    inferenceTime: number;
    renderTime: number;
    totalTime: number;
    cacheHit: boolean;
    timestamp: number;
    tokensGenerated: number;
}

export interface PerformanceStats {
    count: number;
    p50: number;
    p95: number;
    p99: number;
    average: number;
    min: number;
    max: number;
}

export class PerformanceMonitor {
    private logger: Logger;
    private metrics: CompletionMetrics[] = [];
    private maxMetrics: number = 1000;
    private enabled: boolean = false;

    // Legacy metrics for backward compatibility
    private legacyMetrics: Map<string, PerformanceMetric> = new Map();
    private isMonitoring: boolean = false;

    constructor() {
        this.logger = new Logger('PerformanceMonitor');
    }

    /**
     * Enable or disable performance monitoring
     */
    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.isMonitoring = enabled;
        if (enabled) {
            this.logger.info('Performance monitoring enabled');
        }
    }

    /**
     * Record a completion performance metric
     */
    public record(metric: CompletionMetrics): void {
        if (!this.enabled) {
            return;
        }

        this.metrics.push(metric);

        // Keep only recent metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.shift();
        }

        // Log if performance is degraded
        if (metric.totalTime > 500) {
            this.logger.warn(`Slow completion: ${metric.totalTime}ms (context: ${metric.contextGatherTime}ms, inference: ${metric.inferenceTime}ms, render: ${metric.renderTime}ms)`);
        } else if (metric.totalTime > 325) {
            this.logger.info(`Above target: ${metric.totalTime}ms (target: 210-325ms)`);
        }
    }

    /**
     * Get statistics for a specific metric
     */
    private getStats(values: number[]): PerformanceStats {
        if (values.length === 0) {
            return {
                count: 0,
                p50: 0,
                p95: 0,
                p99: 0,
                average: 0,
                min: 0,
                max: 0
            };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const count = sorted.length;

        return {
            count,
            p50: this.percentile(sorted, 50),
            p95: this.percentile(sorted, 95),
            p99: this.percentile(sorted, 99),
            average: sorted.reduce((a, b) => a + b, 0) / count,
            min: sorted[0],
            max: sorted[count - 1]
        };
    }

    /**
     * Calculate percentile
     */
    private percentile(sorted: number[], p: number): number {
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Get overall performance statistics
     */
    public getOverallStats(): {
        total: PerformanceStats;
        contextGather: PerformanceStats;
        inference: PerformanceStats;
        render: PerformanceStats;
        cacheHitRate: number;
        tokensPerSec: number;
    } {
        const totalTimes = this.metrics.map(m => m.totalTime);
        const contextTimes = this.metrics.map(m => m.contextGatherTime);
        const inferenceTimes = this.metrics.map(m => m.inferenceTime);
        const renderTimes = this.metrics.map(m => m.renderTime);

        const cacheHits = this.metrics.filter(m => m.cacheHit).length;
        const cacheHitRate = this.metrics.length > 0 ? cacheHits / this.metrics.length : 0;

        return {
            total: this.getStats(totalTimes),
            contextGather: this.getStats(contextTimes),
            inference: this.getStats(inferenceTimes),
            render: this.getStats(renderTimes),
            cacheHitRate,
            tokensPerSec: this.calculateTokensPerSec()
        };
    }

    private calculateTokensPerSec(): number {
        const recent = this.metrics.filter(m => !m.cacheHit && m.inferenceTime > 0);
        if (recent.length === 0) return 0;
        
        const totalTokens = recent.reduce((sum, m) => sum + (m.tokensGenerated || 0), 0);
        const totalTimeSec = recent.reduce((sum, m) => sum + m.inferenceTime, 0) / 1000;
        
        return totalTimeSec > 0 ? totalTokens / totalTimeSec : 0;
    }

    /**
     * Get recent performance summary
     */
    public getRecentSummary(count: number = 10): string {
        const recent = this.metrics.slice(-count);
        if (recent.length === 0) {
            return 'No metrics recorded';
        }

        const avgTotal = recent.reduce((sum, m) => sum + m.totalTime, 0) / recent.length;
        const avgContext = recent.reduce((sum, m) => sum + m.contextGatherTime, 0) / recent.length;
        const avgInference = recent.reduce((sum, m) => sum + m.inferenceTime, 0) / recent.length;
        const avgRender = recent.reduce((sum, m) => sum + m.renderTime, 0) / recent.length;

        return `Last ${recent.length} completions: ${avgTotal.toFixed(0)}ms avg (context: ${avgContext.toFixed(0)}ms, inference: ${avgInference.toFixed(0)}ms, render: ${avgRender.toFixed(0)}ms)`;
    }

    /**
     * Export metrics for analysis
     */
    public exportMetrics(): CompletionMetrics[] {
        return [...this.metrics];
    }

    /**
     * Clear all metrics
     */
    public clear(): void {
        this.metrics = [];
        this.legacyMetrics.clear();
        this.logger.info('Performance metrics cleared');
    }

    /**
     * Get formatted report
     */
    public getReport(): string {
        const stats = this.getOverallStats();

        return `
Performance Report (${stats.total.count} samples)
===========================================

Total Latency:
  P50: ${stats.total.p50.toFixed(0)}ms
  P95: ${stats.total.p95.toFixed(0)}ms
  P99: ${stats.total.p99.toFixed(0)}ms
  Avg: ${stats.total.average.toFixed(0)}ms
  Range: ${stats.total.min.toFixed(0)}-${stats.total.max.toFixed(0)}ms

Context Gathering:
  P50: ${stats.contextGather.p50.toFixed(0)}ms
  P95: ${stats.contextGather.p95.toFixed(0)}ms
  Avg: ${stats.contextGather.average.toFixed(0)}ms

Inference:
  P50: ${stats.inference.p50.toFixed(0)}ms
  P95: ${stats.inference.p95.toFixed(0)}ms
  Avg: ${stats.inference.average.toFixed(0)}ms

Rendering:
  P50: ${stats.render.p50.toFixed(0)}ms
  P95: ${stats.render.p95.toFixed(0)}ms
  Avg: ${stats.render.average.toFixed(0)}ms

  P95: ${stats.render.p95.toFixed(0)}ms
  Avg: ${stats.render.average.toFixed(0)}ms

Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%
Tokens/Sec: ${stats.tokensPerSec.toFixed(1)} T/s

Target: 210-325ms total
Status: ${stats.total.p95 <= 325 ? '✅ PASSING' : '❌ NEEDS OPTIMIZATION'}
        `.trim();
    }

    // Legacy methods for backward compatibility
    public startMonitoring(): void {
        this.setEnabled(true);
    }

    public stopMonitoring(): void {
        this.setEnabled(false);
    }

    public async measureAsync<T>(
        name: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;

        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            const memoryUsed = process.memoryUsage().heapUsed - startMemory;

            this.recordLegacyMetric(name, duration, memoryUsed, true);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordLegacyMetric(name, duration, 0, false);
            throw error;
        }
    }

    public measure<T>(name: string, fn: () => T): T {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;

        try {
            const result = fn();
            const duration = Date.now() - startTime;
            const memoryUsed = process.memoryUsage().heapUsed - startMemory;

            this.recordLegacyMetric(name, duration, memoryUsed, true);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordLegacyMetric(name, duration, 0, false);
            throw error;
        }
    }

    private recordLegacyMetric(
        name: string,
        duration: number,
        memoryUsed: number,
        success: boolean
    ): void {
        if (!this.isMonitoring) {
            return;
        }

        const existing = this.legacyMetrics.get(name);
        if (existing) {
            existing.count++;
            existing.totalDuration += duration;
            existing.totalMemory += memoryUsed;
            existing.avgDuration = existing.totalDuration / existing.count;
            existing.avgMemory = existing.totalMemory / existing.count;
            existing.maxDuration = Math.max(existing.maxDuration, duration);
            existing.minDuration = Math.min(existing.minDuration, duration);
            if (!success) {
                existing.failures++;
            }
        } else {
            this.legacyMetrics.set(name, {
                name,
                count: 1,
                totalDuration: duration,
                totalMemory: memoryUsed,
                avgDuration: duration,
                avgMemory: memoryUsed,
                maxDuration: duration,
                minDuration: duration,
                failures: success ? 0 : 1
            });
        }
    }

    public getMetrics(): PerformanceMetric[] {
        return Array.from(this.legacyMetrics.values());
    }

    public getMetric(name: string): PerformanceMetric | undefined {
        return this.legacyMetrics.get(name);
    }

    public clearMetrics(): void {
        this.clear();
    }

    public generateReport(): string {
        // Return new report format
        return this.getReport();
    }
}

interface PerformanceMetric {
    name: string;
    count: number;
    totalDuration: number;
    totalMemory: number;
    avgDuration: number;
    avgMemory: number;
    maxDuration: number;
    minDuration: number;
    failures: number;
}
