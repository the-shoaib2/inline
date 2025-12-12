"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VCSEventTracker = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Tracks version control system events (Git)
 */
class VCSEventTracker {
    constructor(eventBus, normalizer) {
        this.disposables = [];
        this.checkInterval = null;
        this.lastGitState = new Map();
        this.logger = new shared_1.Logger('VCSEventTracker');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }
    /**
     * Start tracking VCS events
     */
    start() {
        this.logger.info('Starting VCS event tracking');
        try {
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
            gitAPI.onDidOpenRepository((repo) => {
                this.handleRepositoryOpened(repo);
            }, null, this.disposables);
            gitAPI.onDidCloseRepository((repo) => {
                this.handleRepositoryClosed(repo);
            }, null, this.disposables);
            // Monitor existing repositories
            const repositories = gitAPI.repositories;
            repositories.forEach((repo) => {
                this.monitorRepository(repo);
            });
            // Periodic check for git status changes
            this.checkInterval = setInterval(() => {
                this.checkGitStatus(gitAPI.repositories);
            }, 5000); // Check every 5 seconds
            this.logger.info('VCS tracking started successfully');
        }
        catch (error) {
            this.logger.warn('Failed to initialize VCS tracking:', error);
        }
    }
    /**
     * Handle repository opened
     */
    handleRepositoryOpened(repo) {
        this.logger.info(`Repository opened: ${repo.rootUri.fsPath}`);
        this.monitorRepository(repo);
    }
    /**
     * Handle repository closed
     */
    handleRepositoryClosed(repo) {
        this.logger.info(`Repository closed: ${repo.rootUri.fsPath}`);
        this.lastGitState.delete(repo.rootUri.fsPath);
    }
    /**
     * Monitor a repository for changes
     */
    monitorRepository(repo) {
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
    handleStateChange(repo) {
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
    captureState(repo) {
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
    checkGitStatus(repositories) {
        repositories.forEach(repo => {
            try {
                this.handleStateChange(repo);
            }
            catch (error) {
                // Ignore errors during periodic checks
            }
        });
    }
    /**
     * Emit branch changed event
     */
    emitBranchChanged(repo, branch) {
        const event = {
            id: '',
            type: event_types_1.VCSEventType.BRANCH_CHANGED,
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
    emitUncommittedChanges(repo, changeCount) {
        const event = {
            id: '',
            type: event_types_1.VCSEventType.UNCOMMITTED_CHANGES,
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
    emitStagedChanges(repo, changeCount) {
        const event = {
            id: '',
            type: event_types_1.VCSEventType.FILE_STAGED,
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
    dispose() {
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
exports.VCSEventTracker = VCSEventTracker;
//# sourceMappingURL=vcs-event-tracker.js.map