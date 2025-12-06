import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    UserInteractionEvent, 
    UserInteractionEventType 
} from '../event-types';
import { Logger } from '../../utils/logger';

/**
 * Collects user interaction events
 */
export class UserInteractionCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private lastActivityTime: number = Date.now();
    private idleCheckInterval: NodeJS.Timeout | null = null;
    private readonly idleThresholdMs: number;
    private isIdle: boolean = false;
    private readonly trackKeystrokes: boolean;
    private lastKeystrokeTime: number = 0;

    constructor(
        eventBus: EventBus, 
        normalizer: EventNormalizer,
        idleThresholdMs: number = 60000, // 1 minute
        trackKeystrokes: boolean = false
    ) {
        this.logger = new Logger('UserInteractionCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
        this.idleThresholdMs = idleThresholdMs;
        this.trackKeystrokes = trackKeystrokes;
    }

    /**
     * Start collecting user interaction events
     */
    public start(): void {
        this.logger.info('Starting user interaction event collection');

        // Watch for window focus changes
        vscode.window.onDidChangeWindowState(state => {
            this.handleWindowStateChanged(state);
        }, null, this.disposables);

        // Watch for command execution
        // Note: VS Code doesn't provide a direct API for this,
        // but we can track it through other means

        // Start idle detection
        this.startIdleDetection();

        // Track document changes as activity indicator
        vscode.workspace.onDidChangeTextDocument(() => {
            this.recordActivity();
            if (this.trackKeystrokes) {
                this.handleKeystroke();
            }
        }, null, this.disposables);

        // Track selection changes as activity indicator
        vscode.window.onDidChangeTextEditorSelection(() => {
            this.recordActivity();
        }, null, this.disposables);
    }

    /**
     * Handle window state changed
     */
    private handleWindowStateChanged(state: vscode.WindowState): void {
        const event: UserInteractionEvent = {
            id: '',
            type: state.focused ? 
                UserInteractionEventType.FOCUS_GAINED : 
                UserInteractionEventType.FOCUS_LOST,
            timestamp: Date.now(),
            source: 'user-interaction-collector'
        };

        this.emitEvent(event);
        
        if (state.focused) {
            this.recordActivity();
        }
    }

    /**
     * Handle keystroke (privacy-aware)
     */
    private handleKeystroke(): void {
        const now = Date.now();
        const timeSinceLast = now - this.lastKeystrokeTime;

        // Only track timing patterns, not actual keys
        const event: UserInteractionEvent = {
            id: '',
            type: UserInteractionEventType.KEYSTROKE,
            timestamp: now,
            source: 'user-interaction-collector',
            keystroke: {
                key: '', // Don't track actual key for privacy
                timeSinceLast,
                isRepeated: timeSinceLast < 100
            }
        };

        this.emitEvent(event);
        this.lastKeystrokeTime = now;
    }

    /**
     * Record user activity
     */
    private recordActivity(): void {
        const wasIdle = this.isIdle;
        this.lastActivityTime = Date.now();
        this.isIdle = false;

        // If was idle, emit idle end event
        if (wasIdle) {
            const event: UserInteractionEvent = {
                id: '',
                type: UserInteractionEventType.IDLE_END,
                timestamp: Date.now(),
                source: 'user-interaction-collector'
            };

            this.emitEvent(event);
        }
    }

    /**
     * Start idle detection
     */
    private startIdleDetection(): void {
        this.idleCheckInterval = setInterval(() => {
            this.checkIdle();
        }, 10000); // Check every 10 seconds
    }

    /**
     * Check if user is idle
     */
    private checkIdle(): void {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;

        if (!this.isIdle && timeSinceActivity >= this.idleThresholdMs) {
            this.isIdle = true;

            const event: UserInteractionEvent = {
                id: '',
                type: UserInteractionEventType.IDLE_START,
                timestamp: now,
                source: 'user-interaction-collector',
                idleDuration: timeSinceActivity
            };

            this.emitEvent(event);
        }
    }

    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent(event: UserInteractionEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping user interaction event collection');
        
        if (this.idleCheckInterval) {
            clearInterval(this.idleCheckInterval);
            this.idleCheckInterval = null;
        }

        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
