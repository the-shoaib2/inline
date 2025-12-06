import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    VCSEvent, 
    VCSEventType 
} from '../event-types';
import { Logger } from '../../utils/logger';

/**
 * Tracks version control system events (Git)
 */
export class VCSEventTracker {
    private logger: Logger;
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private gitExtension: any;
    private disposables: vscode.Disposable[] = [];
    private checkInterval: NodeJS.Timeout | null = null;
    private lastGitState: Map<string, any> = new Map();

    constructor(eventBus: EventBus, normalizer: EventNormalizer) {
        this.logger = new Logger('VCSEventTracker');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }

    /**
     * Start tracking VCS events
     */
    public start(): void {
        this.logger.info('Starting VCS event tracking');

        // Get Git extension
        this.gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        
        if (!this.gitExtension) {
            this.logger.warn('Git extension not found, VCS tracking disabled');
            return;
        }

        // Get Git API
        const gitAPI = this.gitExtension.getAPI(1);
        
        if (!gitAPI) {
            this.logger.warn('Git API not available');
            return;
        }

        // Watch for repository changes
        gitAPI.onDidOpenRepository((repo: any) => {
            this.handleRepositoryOpened(repo);
        }, null, this.disposables);

        gitAPI.onDidCloseRepository((repo: any) => {
            this.handleRepositoryClosed(repo);
        }, null, this.disposables);

        // Monitor existing repositories
        const repositories = gitAPI.repositories;
        repositories.forEach((repo: any) => {
            this.monitorRepository(repo);
        });

        // Periodic check for git status changes
        this.checkInterval = setInterval(() => {
            this.checkGitStatus(repositories);
        }, 5000); // Check every 5 seconds
    }

    /**
     * Handle repository opened
     */
    private handleRepositoryOpened(repo: any): void {
        this.logger.info(`Repository opened: ${repo.rootUri.fsPath}`);
        this.monitorRepository(repo);
    }

    /**
     * Handle repository closed
     */
    private handleRepositoryClosed(repo: any): void {
        this.logger.info(`Repository closed: ${repo.rootUri.fsPath}`);
        this.lastGitState.delete(repo.rootUri.fsPath);
    }

    /**
     * Monitor a repository for changes
     */
    private monitorRepository(repo: any): void {
        // Watch for state changes
        repo.state.onDidChange(() => {
            this.handleStateChange(repo);
        });

        // Initial state capture
        this.captureState(repo);
    }

    /**
     * Handle repository state change
     */
    private handleStateChange(repo: any): void {
        const currentState = this.captureState(repo);
        const lastState = this.lastGitState.get(repo.rootUri.fsPath);

        if (!lastState) {
            return;
        }

        // Check for branch change
        if (currentState.branch !== lastState.branch) {
            this.emitBranchChanged(repo, currentState.branch);
        }

        // Check for uncommitted changes
        if (currentState.workingTreeChanges !== lastState.workingTreeChanges) {
            this.emitUncommittedChanges(repo, currentState.workingTreeChanges);
        }

        // Check for staged changes
        if (currentState.indexChanges !== lastState.indexChanges) {
            this.emitStagedChanges(repo, currentState.indexChanges);
        }
    }

    /**
     * Capture current repository state
     */
    private captureState(repo: any): any {
        const state = {
            branch: repo.state.HEAD?.name || 'unknown',
            workingTreeChanges: repo.state.workingTreeChanges?.length || 0,
            indexChanges: repo.state.indexChanges?.length || 0,
            mergeChanges: repo.state.mergeChanges?.length || 0
        };

        this.lastGitState.set(repo.rootUri.fsPath, state);
        return state;
    }

    /**
     * Check git status periodically
     */
    private checkGitStatus(repositories: any[]): void {
        repositories.forEach(repo => {
            try {
                this.handleStateChange(repo);
            } catch (error) {
                // Ignore errors during periodic checks
            }
        });
    }

    /**
     * Emit branch changed event
     */
    private emitBranchChanged(repo: any, branch: string): void {
        const event: VCSEvent = {
            id: '',
            type: VCSEventType.BRANCH_CHANGED,
            timestamp: Date.now(),
            source: 'vcs-event-tracker',
            repository: repo.rootUri.fsPath,
            branch
        };

        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Emit uncommitted changes event
     */
    private emitUncommittedChanges(repo: any, changeCount: number): void {
        const event: VCSEvent = {
            id: '',
            type: VCSEventType.UNCOMMITTED_CHANGES,
            timestamp: Date.now(),
            source: 'vcs-event-tracker',
            repository: repo.rootUri.fsPath,
            metadata: { changeCount }
        };

        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Emit staged changes event
     */
    private emitStagedChanges(repo: any, changeCount: number): void {
        const event: VCSEvent = {
            id: '',
            type: VCSEventType.FILE_STAGED,
            timestamp: Date.now(),
            source: 'vcs-event-tracker',
            repository: repo.rootUri.fsPath,
            metadata: { changeCount }
        };

        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Dispose tracker
     */
    public dispose(): void {
        this.logger.info('Stopping VCS event tracking');
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.lastGitState.clear();
    }
}
