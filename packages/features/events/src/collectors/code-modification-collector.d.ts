import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects code modification events from VS Code
 */
export declare class CodeModificationCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    constructor(eventBus: EventBus, normalizer: EventNormalizer);
    /**
     * Start collecting code modification events
     */
    start(): void;
    /**
     * Handle document changed event
     */
    private handleDocumentChanged;
    /**
     * Detect the type of modification
     */
    private detectModificationType;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=code-modification-collector.d.ts.map