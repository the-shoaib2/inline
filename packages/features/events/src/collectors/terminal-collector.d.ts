import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects terminal events (execution, lifecycle) from VS Code
 */
export declare class TerminalCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    constructor(eventBus: EventBus, normalizer: EventNormalizer);
    /**
     * Start collecting terminal events
     */
    start(): void;
    private emitTerminalEvent;
    private handleShellExecution;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=terminal-collector.d.ts.map