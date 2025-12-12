import * as vscode from 'vscode';
import { EventBus } from './event-bus';
import { PerformanceEventCollector } from './collectors/performance-event-collector';
import { AIContextTracker } from './trackers/ai-context-tracker';
import { StateManager } from '@inline/storage';
import { ContextWindowBuilder } from '@inline/context/builders/context-window-builder';
import { FeedbackLoop } from '@inline/context';
import { ContextEngine } from '@inline/context';
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
export declare class EventTrackingManager {
    private logger;
    private config;
    private eventBus;
    private normalizer;
    private fileSystemCollector;
    private editorCollector;
    private codeModificationCollector;
    private userInteractionCollector;
    private performanceCollector;
    private diagnosticCollector;
    private terminalCollector;
    private aiContextTracker;
    private vcsEventTracker;
    private sessionStateTracker;
    private stateManager;
    private contextWindowBuilder;
    private contextEnricher;
    private optimizationLayer;
    private eventStorage;
    private feedbackLoop;
    private isStarted;
    constructor(config: EventTrackingConfig, contextEngine: ContextEngine, extensionContext: vscode.ExtensionContext);
    /**
     * Start event tracking
     */
    start(): void;
    /**
     * Stop event tracking
     */
    stop(): void;
    /**
     * Get the event bus
     */
    getEventBus(): EventBus;
    /**
     * Get the AI context tracker
     */
    getAIContextTracker(): AIContextTracker;
    /**
     * Get the feedback loop
     */
    getFeedbackLoop(): FeedbackLoop;
    /**
     * Get the state manager
     */
    getStateManager(): StateManager;
    /**
     * Get the context window builder
     */
    getContextWindowBuilder(): ContextWindowBuilder;
    /**
     * Get the performance collector
     */
    getPerformanceCollector(): PerformanceEventCollector;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<EventTrackingConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): EventTrackingConfig;
    /**
     * Get statistics
     */
    getStatistics(): {
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
    };
    /**
     * Clear all history and buffers
     */
    clearHistory(): void;
    /**
     * Dispose the event tracking manager
     */
    dispose(): void;
}
/**
 * Create event tracking manager from VS Code configuration
 */
export declare function createEventTrackingManager(context: vscode.ExtensionContext, contextEngine: ContextEngine): EventTrackingManager;
//# sourceMappingURL=event-tracking-manager.d.ts.map