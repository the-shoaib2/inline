import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects diagnostic events (errors, warnings) from VS Code
 */
export declare class DiagnosticCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    private lastDiagnostics;
    constructor(eventBus: EventBus, normalizer: EventNormalizer);
    /**
     * Start collecting diagnostic events
     */
    start(): void;
    /**
     * Handle diagnostics changed
     */
    private handleDiagnosticsChanged;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=diagnostic-collector.d.ts.map