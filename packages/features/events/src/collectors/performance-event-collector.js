"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceEventCollector = void 0;
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects performance metrics
 */
class PerformanceEventCollector {
    constructor(eventBus, normalizer, monitoringIntervalMs = 30000 // 30 seconds
    ) {
        this.monitoringInterval = null;
        this.logger = new shared_1.Logger('PerformanceEventCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.monitoringIntervalMs = monitoringIntervalMs;
    }
    /**
     * Start collecting performance metrics
     */
    start() {
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
    collectMetrics() {
        this.collectMemoryMetrics();
        this.collectCPUMetrics();
    }
    /**
     * Collect memory usage metrics
     */
    collectMemoryMetrics() {
        const memUsage = process.memoryUsage();
        const event = {
            id: '',
            type: event_types_1.PerformanceEventType.MEMORY_USAGE,
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
    collectCPUMetrics() {
        const cpuUsage = process.cpuUsage();
        const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        const event = {
            id: '',
            type: event_types_1.PerformanceEventType.CPU_USAGE,
            timestamp: Date.now(),
            source: 'performance-collector',
            cpuUsage: totalUsage
        };
        this.emitEvent(event);
    }
    /**
     * Record a timed operation
     */
    recordOperation(operation, duration, type) {
        const event = {
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
    startTiming(operation) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.recordOperation(operation, duration, event_types_1.PerformanceEventType.INFERENCE_TIME);
        };
    }
    /**
     * Emit event through normalizer and event bus
     */
    emitEvent(event) {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }
    /**
     * Stop collecting events and dispose resources
     */
    dispose() {
        this.logger.info('Stopping performance event collection');
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}
exports.PerformanceEventCollector = PerformanceEventCollector;
//# sourceMappingURL=performance-event-collector.js.map