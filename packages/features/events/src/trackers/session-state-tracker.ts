import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { 
    SessionStateEvent, 
    SessionStateEventType,
    EventFilter,
    EventPriority
} from '../event-types';
import { Logger } from '@inline/shared';

/**
 * Tracks session and extension state events
 */
export class SessionStateTracker {
    private logger: Logger;
    private eventBus: EventBus;
    private disposables: vscode.Disposable[] = [];
    private extensionContext: vscode.ExtensionContext;
    private sessionStartTime: number;

    constructor(eventBus: EventBus, context: vscode.ExtensionContext) {
        this.logger = new Logger('SessionStateTracker');
        this.eventBus = eventBus;
        this.extensionContext = context;
        this.sessionStartTime = Date.now();
    }

    /**
     * Start tracking session state
     */
    public start(): void {
        this.logger.info('Starting session state tracking');

        // Emit extension activated event
        this.emitExtensionActivated();

        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(event => {
            this.handleConfigurationChanged(event);
        }, null, this.disposables);

        // Watch for color theme changes
        vscode.window.onDidChangeActiveColorTheme(theme => {
            this.handleThemeChanged(theme);
        }, null, this.disposables);
    }

    /**
     * Emit extension activated event
     */
    private emitExtensionActivated(): void {
        const event: SessionStateEvent = {
            id: '',
            type: SessionStateEventType.EXTENSION_ACTIVATED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            metadata: {
                extensionMode: this.extensionContext.extensionMode,
                sessionStartTime: this.sessionStartTime
            }
        };

        this.eventBus.emit(event);
    }

    /**
     * Handle configuration changed
     */
    private handleConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
        // Check if inline extension settings changed
        if (event.affectsConfiguration('inline')) {
            const config = vscode.workspace.getConfiguration('inline');
            
            const settingsEvent: SessionStateEvent = {
                id: '',
                type: SessionStateEventType.SETTINGS_CHANGED,
                timestamp: Date.now(),
                source: 'session-state-tracker',
                metadata: {
                    affectedSection: 'inline',
                    settings: config
                }
            };

            this.eventBus.emit(settingsEvent);
        }
    }

    /**
     * Handle theme changed
     */
    private handleThemeChanged(theme: vscode.ColorTheme): void {
        const event: SessionStateEvent = {
            id: '',
            type: SessionStateEventType.THEME_CHANGED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            themeName: theme.kind === vscode.ColorThemeKind.Dark ? 'dark' : 
                      theme.kind === vscode.ColorThemeKind.Light ? 'light' : 'high-contrast'
        };

        this.eventBus.emit(event);
    }

    /**
     * Emit extension deactivation event
     */
    public emitExtensionDeactivated(): void {
        const sessionDuration = Date.now() - this.sessionStartTime;
        
        const event: SessionStateEvent = {
            id: '',
            type: SessionStateEventType.EXTENSION_DEACTIVATED,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            metadata: {
                sessionDuration,
                sessionStartTime: this.sessionStartTime
            }
        };

        this.eventBus.emit(event);
    }

    /**
     * Emit plugin error event
     */
    public emitPluginError(error: Error): void {
        const event: SessionStateEvent = {
            id: '',
            type: SessionStateEventType.PLUGIN_ERROR,
            timestamp: Date.now(),
            source: 'session-state-tracker',
            error
        };

        this.eventBus.emit(event);
    }

    /**
     * Get session statistics
     */
    public getSessionStats(): {
        startTime: number;
        duration: number;
        uptime: string;
    } {
        const duration = Date.now() - this.sessionStartTime;
        const hours = Math.floor(duration / 3600000);
        const minutes = Math.floor((duration % 3600000) / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        return {
            startTime: this.sessionStartTime,
            duration,
            uptime: `${hours}h ${minutes}m ${seconds}s`
        };
    }

    /**
     * Dispose tracker
     */
    public dispose(): void {
        this.logger.info('Stopping session state tracking');
        this.emitExtensionDeactivated();
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
