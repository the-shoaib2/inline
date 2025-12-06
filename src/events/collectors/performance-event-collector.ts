import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    PerformanceEvent, 
    PerformanceEventType 
} from '../event-types';
import { Logger } from './../../system/logger';

/**
 * Collects performance metrics
 */
export class PerformanceEventCollector {
    private logger: Logger;
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly monitoringIntervalMs: number;

    constructor(
        eventBus: EventBus, 
        normalizer: EventNormalizer,
        monitoringIntervalMs: number = 30000 // 30 seconds
    ) {
        this.logger = new Logger('PerformanceEventCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.monitoringIntervalMs = monitoringIntervalMs;
    }

    /**
     * Start collecting performance metrics
     */
    public start(): void {
        this.logger.info('Starting performance event collection');

        // Start periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, this.monitoringIntervalMs);

        // Collect initial metrics
        this.collectMetrics();
    }

    /**
     * Collect current performance metrics
     */
    private collectMetrics(): void {
        this.collectMemoryMetrics();
        this.collectCPUMetrics();
    }

    /**
     * Collect memory usage metrics
     */
    private collectMemoryMetrics(): void {
        const memUsage = process.memoryUsage();

        const event: PerformanceEvent = {
            id: '',
            type: PerformanceEventType.MEMORY_USAGE,
            timestamp: Date.now(),
            source: 'performance-collector',
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external
            }
        };

        this.emitEvent(event);
    }

    /**
     * Collect CPU usage metrics
     */
    private collectCPUMetrics(): void {
        const cpuUsage = process.cpuUsage();
        const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

        const event: PerformanceEvent = {
            id: '',
            type: PerformanceEventType.CPU_USAGE,
            timestamp: Date.now(),
            source: 'performance-collector',
            cpuUsage: totalUsage
        };

        this.emitEvent(event);
    }

    /**
     * Record a timed operation
     */
    public recordOperation(operation: string, duration: number, type: PerformanceEventType): void {
        const event: PerformanceEvent = {
            id: '',
            type,
            timestamp: Date.now(),
            source: 'performance-collector',
            operation,
            duration
        };

        this.emitEvent(event);
    }

    /**
     * Start timing an operation
     */
    public startTiming(operation: string): () => void {
        const startTime = Date.now();

        return () => {
            const duration = Date.now() - startTime;
            this.recordOperation(operation, duration, PerformanceEventType.INFERENCE_TIME);
        };
    }

    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent(event: PerformanceEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping performance event collection');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}
