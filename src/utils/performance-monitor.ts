import * as vscode from 'vscode';

export class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric> = new Map();
    private isMonitoring: boolean = false;

    public startMonitoring(): void {
        this.isMonitoring = true;
    }

    public stopMonitoring(): void {
        this.isMonitoring = false;
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

            this.recordMetric(name, duration, memoryUsed, true);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordMetric(name, duration, 0, false);
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

            this.recordMetric(name, duration, memoryUsed, true);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordMetric(name, duration, 0, false);
            throw error;
        }
    }

    private recordMetric(
        name: string,
        duration: number,
        memoryUsed: number,
        success: boolean
    ): void {
        if (!this.isMonitoring) {
            return;
        }

        const existing = this.metrics.get(name);
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
            this.metrics.set(name, {
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
        return Array.from(this.metrics.values());
    }

    public getMetric(name: string): PerformanceMetric | undefined {
        return this.metrics.get(name);
    }

    public clearMetrics(): void {
        this.metrics.clear();
    }

    public generateReport(): string {
        const lines: string[] = [
            'Performance Report',
            '='.repeat(80),
            ''
        ];

        const metrics = this.getMetrics().sort((a, b) => 
            b.totalDuration - a.totalDuration
        );

        for (const metric of metrics) {
            lines.push(`${metric.name}:`);
            lines.push(`  Count: ${metric.count}`);
            lines.push(`  Avg Duration: ${metric.avgDuration.toFixed(2)}ms`);
            lines.push(`  Max Duration: ${metric.maxDuration.toFixed(2)}ms`);
            lines.push(`  Min Duration: ${metric.minDuration.toFixed(2)}ms`);
            lines.push(`  Avg Memory: ${(metric.avgMemory / 1024).toFixed(2)}KB`);
            lines.push(`  Failures: ${metric.failures}`);
            lines.push('');
        }

        return lines.join('\n');
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
