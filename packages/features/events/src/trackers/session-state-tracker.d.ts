import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
/**
 * Tracks session and extension state events
 */
export declare class SessionStateTracker {
    private logger;
    private eventBus;
    private disposables;
    private extensionContext;
    private sessionStartTime;
    constructor(eventBus: EventBus, context: vscode.ExtensionContext);
    /**
     * Start tracking session state
     */
    start(): void;
    /**
     * Emit extension activated event
     */
    private emitExtensionActivated;
    /**
     * Handle configuration changed
     */
    private handleConfigurationChanged;
    /**
     * Handle theme changed
     */
    private handleThemeChanged;
    /**
     * Emit extension deactivation event
     */
    emitExtensionDeactivated(): void;
    /**
     * Emit plugin error event
     */
    emitPluginError(error: Error): void;
    /**
     * Get session statistics
     */
    getSessionStats(): {
        startTime: number;
        duration: number;
        uptime: string;
    };
    /**
     * Dispose tracker
     */
    dispose(): void;
}
//# sourceMappingURL=session-state-tracker.d.ts.map