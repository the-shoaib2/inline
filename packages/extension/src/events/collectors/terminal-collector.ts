import * as vscode from 'vscode';
import { EventBus } from '@events/event-bus';
import { EventNormalizer } from '@events/event-normalizer';
import { 
    UserInteractionEvent, 
    UserInteractionEventType 
} from '@events/event-types';
import { Logger } from '@platform/system/logger';

/**
 * Collects terminal events (execution, lifecycle) from VS Code
 */
export class TerminalCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;

    constructor(
        eventBus: EventBus, 
        normalizer: EventNormalizer
    ) {
        this.logger = new Logger('TerminalCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }

    /**
     * Start collecting terminal events
     */
    public start(): void {
        this.logger.info('Starting terminal event collection');

        // Watch for terminal open
        vscode.window.onDidOpenTerminal((terminal) => {
            this.emitTerminalEvent(UserInteractionEventType.TERMINAL_SESSION_STARTED, terminal);
        }, null, this.disposables);

        // Watch for terminal close
        vscode.window.onDidCloseTerminal((terminal) => {
            this.emitTerminalEvent(UserInteractionEventType.TERMINAL_SESSION_ENDED, terminal);
        }, null, this.disposables);

        // Watch for shell execution (New API in recent VS Code versions)
        // Check if onDidStartTerminalShellExecution exists (might be proposed API or recent)
        // For standard VS Code API 1.85+, we might have limited access to command strings unless we use task API or shell integration
        // However, we can track that *something* happened.
        
        // If we want to capture actual commands, we might need to rely on the "shell integration" events if available, 
        // or just track active terminal title changes / generic activity.
        
        // Using `onDidStartTerminalShellExecution` if available (VS Code 1.93+?) - Wait, let's check basic support.
        // For now, we will simulate command tracking via generic means or available APIs.
        // Since we are targeting compatibility, we'll stick to basic lifecycle + active terminal checks.
        
        // Note: VS Code recently added `vscode.window.onDidStartTerminalShellExecution`. 
        // We'll check for its existence at runtime to be safe or use `any` casting.
        if ((vscode.window as any).onDidStartTerminalShellExecution) {
             (vscode.window as any).onDidStartTerminalShellExecution((event: any) => {
                this.handleShellExecution(event);
            }, null, this.disposables);
        }
    }

    private emitTerminalEvent(type: UserInteractionEventType, terminal: vscode.Terminal): void {
        const event: UserInteractionEvent = {
            id: '',
            type: type,
            timestamp: Date.now(),
            source: 'terminal-collector',
            metadata: {
                name: terminal.name,
                processId: terminal.processId
            }
        };
        this.emitEvent(event);
    }

    private handleShellExecution(event: any): void {
        // event.commandLine contains the command
        const userEvent: UserInteractionEvent = {
            id: '',
            type: UserInteractionEventType.TERMINAL_COMMAND_EXECUTED,
            timestamp: Date.now(),
            source: 'terminal-collector',
            command: event.commandLine?.value || event.commandLine || 'unknown', // Adjust based on API structure
            metadata: {
                cwd: event.cwd,
                exitCode: event.exitCode
            }
        };
        this.emitEvent(userEvent);
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
        this.logger.info('Stopping terminal event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
