import * as vscode from 'vscode';
import { EventBus, getEventBus, disposeEventBus } from './event-bus';
import { EventNormalizer } from './event-normalizer';
import { FileSystemCollector } from './collectors/file-system-collector';
import { EditorCollector } from './collectors/editor-collector';
import { CodeModificationCollector } from './collectors/code-modification-collector';
import { UserInteractionCollector } from './collectors/user-interaction-collector';
import { PerformanceEventCollector } from './collectors/performance-event-collector';
import { AIContextTracker } from './trackers/ai-context-tracker';
import { VCSEventTracker } from './trackers/vcs-event-tracker';
import { SessionStateTracker } from './trackers/session-state-tracker';
import { StateManager } from '../pipeline/state-manager';
import { ContextWindowBuilder } from '../pipeline/context-window-builder';
import { ContextEnricher } from '../pipeline/context-enricher';
import { OptimizationLayer } from '../pipeline/optimization-layer';
import { EventStorage } from '../pipeline/event-storage';
import { FeedbackLoop } from '../pipeline/feedback-loop';
import { ContextEngine } from '../core/context/context-engine';
import { Logger } from '../system/logger';
import * as path from 'path';
import * as os from 'os';

/**
 * Event tracking manager configuration
 */
export interface EventTrackingConfig {
    enabled: boolean;
    throttleMs: number;
    bufferSize: number;
    trackMouse: boolean;
    trackKeystrokes: boolean;
    storageEnabled: boolean;
    maxStorageSize: number;
    idleThresholdMs: number;
    performanceMonitoringIntervalMs: number;
}

/**
 * Event tracking manager - coordinates all event tracking components
 */
export class EventTrackingManager {
    private logger: Logger;
    private config: EventTrackingConfig;
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    
    // Collectors
    private fileSystemCollector: FileSystemCollector;
    private editorCollector: EditorCollector;
    private codeModificationCollector: CodeModificationCollector;
    private userInteractionCollector: UserInteractionCollector;
    private performanceCollector: PerformanceEventCollector;
    
    // Trackers
    private aiContextTracker: AIContextTracker;
    private vcsEventTracker: VCSEventTracker;
    private sessionStateTracker: SessionStateTracker;
    
    // Pipelne
    private stateManager: StateManager;
    private contextWindowBuilder: ContextWindowBuilder;
    private contextEnricher: ContextEnricher;
    private optimizationLayer: OptimizationLayer;
    private eventStorage: EventStorage;
    private feedbackLoop: FeedbackLoop;
    
    // State
    private isStarted: boolean = false;

    constructor(
        config: EventTrackingConfig,
        contextEngine: ContextEngine,
        extensionContext: vscode.ExtensionContext
    ) {
        this.logger = new Logger('EventTrackingManager');
        this.config = config;

        // Initialize event bus
        this.eventBus = getEventBus(config.bufferSize);

        // Initialize normalizer
        this.normalizer = new EventNormalizer(
            config.throttleMs,
            50, // batch delay
            10  // batch size
        );

        // Initialize collectors
        this.fileSystemCollector = new FileSystemCollector(this.eventBus, this.normalizer);
        this.editorCollector = new EditorCollector(this.eventBus, this.normalizer, config.throttleMs);
        this.codeModificationCollector = new CodeModificationCollector(this.eventBus, this.normalizer);
        this.userInteractionCollector = new UserInteractionCollector(
            this.eventBus,
            this.normalizer,
            config.idleThresholdMs,
            config.trackKeystrokes
        );
        this.performanceCollector = new PerformanceEventCollector(
            this.eventBus,
            this.normalizer,
            config.performanceMonitoringIntervalMs
        );

        // Initialize trackers
        this.aiContextTracker = new AIContextTracker(this.eventBus);
        this.vcsEventTracker = new VCSEventTracker(this.eventBus, this.normalizer);
        this.sessionStateTracker = new SessionStateTracker(this.eventBus, extensionContext);

        // Initialize pipeline
        this.stateManager = new StateManager(this.eventBus, 100);
        this.contextWindowBuilder = new ContextWindowBuilder(this.stateManager, contextEngine);
        this.contextEnricher = new ContextEnricher(contextEngine);
        this.optimizationLayer = new OptimizationLayer(60000, 1000);
        this.feedbackLoop = new FeedbackLoop(this.eventBus);
        
        // Initialize storage
        const storagePath = path.join(os.homedir(), '.inline', 'events');
        this.eventStorage = new EventStorage(storagePath, config.storageEnabled, config.maxStorageSize);
    }

    /**
     * Start event tracking
     */
    public start(): void {
        if (this.isStarted) {
            this.logger.warn('Event tracking already started');
            return;
        }

        if (!this.config.enabled) {
            this.logger.info('Event tracking is disabled');
            return;
        }

        this.logger.info('Starting event tracking system');

        // Start collectors
        this.fileSystemCollector.start();
        this.editorCollector.start();
        this.codeModificationCollector.start();
        this.userInteractionCollector.start();
        this.performanceCollector.start();

        // Start trackers
        this.aiContextTracker.start();
        this.vcsEventTracker.start();
        this.sessionStateTracker.start();

        // Start pipeline
        this.stateManager.start();
        this.feedbackLoop.start();

        this.isStarted = true;
        this.logger.info('Event tracking system started successfully');
    }

    /**
     * Stop event tracking
     */
    public stop(): void {
        if (!this.isStarted) {
            return;
        }

        this.logger.info('Stopping event tracking system');

        // Stop collectors
        this.fileSystemCollector.dispose();
        this.editorCollector.dispose();
        this.codeModificationCollector.dispose();
        this.userInteractionCollector.dispose();
        this.performanceCollector.dispose();

        // Stop trackers
        this.aiContextTracker.dispose();
        this.vcsEventTracker.dispose();
        this.sessionStateTracker.dispose();

        // Stop pipeline
        this.stateManager.dispose();
        this.optimizationLayer.dispose();
        this.feedbackLoop.dispose();

        // Dispose normalizer
        this.normalizer.dispose();

        this.isStarted = false;
        this.logger.info('Event tracking system stopped');
    }

    /**
     * Get the event bus
     */
    public getEventBus(): EventBus {
        return this.eventBus;
    }

    /**
     * Get the AI context tracker
     */
    public getAIContextTracker(): AIContextTracker {
        return this.aiContextTracker;
    }
    
    /**
     * Get the feedback loop
     */
    public getFeedbackLoop(): FeedbackLoop {
        return this.feedbackLoop;
    }

    /**
     * Get the state manager
     */
    public getStateManager(): StateManager {
        return this.stateManager;
    }

    /**
     * Get the context window builder
     */
    public getContextWindowBuilder(): ContextWindowBuilder {
        return this.contextWindowBuilder;
    }

    /**
     * Get the performance collector
     */
    public getPerformanceCollector(): PerformanceEventCollector {
        return this.performanceCollector;
    }

    /**
     * Update configuration
     */
    public updateConfig(config: Partial<EventTrackingConfig>): void {
        this.config = { ...this.config, ...config };
        
        // Restart if configuration changed while running
        if (this.isStarted) {
            this.stop();
            this.start();
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): EventTrackingConfig {
        return { ...this.config };
    }

    /**
     * Get statistics
     */
    public getStatistics(): {
        eventBusStats: {
            bufferSize: number;
            maxSize: number;
            subscriptionCount: number;
        };
        aiMetrics: ReturnType<AIContextTracker['getMetrics']>;
        stateInfo: {
            openDocuments: number;
            cursorHistorySize: number;
            recentEditsSize: number;
        };
    } {
        const bufferStats = this.eventBus.getBufferStats();
        const aiMetrics = this.aiContextTracker.getMetrics();
        const state = this.stateManager.getState();

        return {
            eventBusStats: {
                bufferSize: bufferStats.size,
                maxSize: bufferStats.maxSize,
                subscriptionCount: this.eventBus.getSubscriptionCount()
            },
            aiMetrics,
            stateInfo: {
                openDocuments: state.openDocuments.size,
                cursorHistorySize: state.cursorHistory.length,
                recentEditsSize: state.recentEdits.length
            }
        };
    }

    /**
     * Clear all history and buffers
     */
    public clearHistory(): void {
        this.eventBus.clearBuffer();
        this.stateManager.clearHistory();
        this.aiContextTracker.resetMetrics();
        this.logger.info('All history and buffers cleared');
    }

    /**
     * Dispose the event tracking manager
     */
    public dispose(): void {
        this.stop();
        disposeEventBus();
    }
}

/**
 * Create event tracking manager from VS Code configuration
 */
export function createEventTrackingManager(
    context: vscode.ExtensionContext,
    contextEngine: ContextEngine
): EventTrackingManager {
    const config = vscode.workspace.getConfiguration('inline');

    const trackingConfig: EventTrackingConfig = {
        enabled: config.get('events.enabled', true),
        throttleMs: config.get('events.throttleMs', 100),
        bufferSize: config.get('events.bufferSize', 1000),
        trackMouse: config.get('events.trackMouse', false),
        trackKeystrokes: config.get('events.trackKeystrokes', false),
        storageEnabled: config.get('events.storageEnabled', false),
        maxStorageSize: config.get('events.maxStorageSize', 10000),
        idleThresholdMs: 60000, // 1 minute
        performanceMonitoringIntervalMs: 30000 // 30 seconds
    };

    return new EventTrackingManager(trackingConfig, contextEngine, context);
}
