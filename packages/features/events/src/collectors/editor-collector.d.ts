import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Collects editor-related events from VS Code
 */
export declare class EditorCollector {
    private logger;
    private disposables;
    private eventBus;
    private normalizer;
    private lastCursorPosition;
    private cursorDebounceTimer;
    private readonly cursorDebounceMs;
    constructor(eventBus: EventBus, normalizer: EventNormalizer, cursorDebounceMs?: number);
    /**
     * Start collecting editor events
     */
    start(): void;
    /**
     * Handle selection changed event
     */
    private handleSelectionChanged;
    /**
     * Check if cursor has moved
     */
    private hasCursorMoved;
    /**
     * Debounced cursor move event
     */
    private debouncedCursorMove;
    /**
     * Handle visible ranges changed (scroll)
     */
    private handleVisibleRangesChanged;
    /**
     * Handle active editor changed
     */
    private handleActiveEditorChanged;
    /**
     * Handle visible editors changed
     */
    private handleVisibleEditorsChanged;
    /**
     * Handle view column changed (split view)
     */
    private handleViewColumnChanged;
    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent;
    /**
     * Stop collecting events and dispose resources
     */
    dispose(): void;
}
//# sourceMappingURL=editor-collector.d.ts.map