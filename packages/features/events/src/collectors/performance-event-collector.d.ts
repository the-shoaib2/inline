import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { PerformanceEventType } from '../event-types';
/**
 * Collects performance metrics
 */
export declare class PerformanceEventCollector {
    private logger;
    private eventBus;
    private normalizer;
    private monitoringInterval;
    private readonly monitoringIntervalMs;
    constructor(eventBus: EventBus, normalizer: EventNormalizer, monitoringIntervalMs?: number);
    /**
     * Start collecting performance metrics
     */
    start(): void;
    /**
     * Collect current performance metrics
     */
    private collectMetrics;
    /**
     * Collect memory usage metrics
     */
    private collectMemoryMetrics;
    /**
     * Collect CPU usage metrics
     */
    private collectCPUMetrics;
    /**
     * Record a timed operation
     */
    recordOperation(operation: string, duration: number, type: PerformanceEventType): void;
    /**
     * Start timing an operation
     */
    startTiming(operation: string): () => void;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=performance-event-collector.d.ts.map