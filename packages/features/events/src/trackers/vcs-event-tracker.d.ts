import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
/**
 * Tracks version control system events (Git)
 */
export declare class VCSEventTracker {
    private logger;
    private eventBus;
    private normalizer;
    private gitExtension;
    private disposables;
    private checkInterval;
    private lastGitState;
    constructor(eventBus: EventBus, normalizer: EventNormalizer);
    /**
     * Start tracking VCS events
     */
    start(): void;
    /**
     * Handle repository opened
     */
    private handleRepositoryOpened;
    /**
     * Handle repository closed
     */
    private handleRepositoryClosed;
    /**
     * Monitor a repository for changes
     */
    private monitorRepository;
    /**
     * Handle repository state change
     */
    private handleStateChange;
    /**
     * Capture current repository state
     */
    private captureState;
    /**
     * Check git status periodically
     */
    private checkGitStatus;
    /**
     * Emit branch changed event
     */
    private emitBranchChanged;
    /**
     * Emit uncommitted changes event
     */
    private emitUncommittedChanges;
    /**
     * Emit staged changes event
     */
    private emitStagedChanges;
    /**
     * Dispose tracker
     */
    dispose(): void;
}
//# sourceMappingURL=vcs-event-tracker.d.ts.map