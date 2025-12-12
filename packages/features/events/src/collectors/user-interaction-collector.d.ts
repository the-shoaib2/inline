import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects user interaction events
 */
export declare class UserInteractionCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    private lastActivityTime;
    private idleCheckInterval;
    private readonly idleThresholdMs;
    private isIdle;
    private readonly trackKeystrokes;
    private lastKeystrokeTime;
    constructor(eventBus: EventBus, normalizer: EventNormalizer, idleThresholdMs?: number, // 1 minute
    trackKeystrokes?: boolean);
    /**
     * Start collecting user interaction events
     */
    start(): void;
    /**
     * Handle window state changed
     */
    private handleWindowStateChanged;
    /**
     * Handle keystroke (privacy-aware)
     */
    private handleKeystroke;
    /**
     * Record user activity
     */
    private recordActivity;
    /**
     * Start idle detection
     */
    private startIdleDetection;
    /**
     * Check if user is idle
     */
    private checkIdle;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=user-interaction-collector.d.ts.map