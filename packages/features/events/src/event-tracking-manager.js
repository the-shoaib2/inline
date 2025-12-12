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
exports.EventTrackingManager = void 0;
exports.createEventTrackingManager = createEventTrackingManager;
const vscode = __importStar(require("vscode"));
const event_bus_1 = require("./event-bus");
const event_normalizer_1 = require("./event-normalizer");
const file_system_collector_1 = require("./collectors/file-system-collector");
const editor_collector_1 = require("./collectors/editor-collector");
const code_modification_collector_1 = require("./collectors/code-modification-collector");
const user_interaction_collector_1 = require("./collectors/user-interaction-collector");
const performance_event_collector_1 = require("./collectors/performance-event-collector");
const diagnostic_collector_1 = require("./collectors/diagnostic-collector");
const terminal_collector_1 = require("./collectors/terminal-collector");
const ai_context_tracker_1 = require("./trackers/ai-context-tracker");
const vcs_event_tracker_1 = require("./trackers/vcs-event-tracker");
const session_state_tracker_1 = require("./trackers/session-state-tracker");
const storage_1 = require("@inline/storage");
const context_window_builder_1 = require("@inline/context/builders/context-window-builder");
const context_enricher_1 = require("@inline/context/builders/context-enricher");
const optimization_layer_1 = require("@inline/intelligence/optimization/optimization-layer");
const storage_2 = require("@inline/storage");
const context_1 = require("@inline/context");
const shared_1 = require("@inline/shared");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Event tracking manager - coordinates all event tracking components
 */
class EventTrackingManager {
    constructor(config, contextEngine, extensionContext) {
        // State
        this.isStarted = false;
        this.logger = new shared_1.Logger('EventTrackingManager');
        this.config = config;
        // Initialize event bus
        this.eventBus = (0, event_bus_1.getEventBus)(config.bufferSize);
        // Initialize normalizer
        this.normalizer = new event_normalizer_1.EventNormalizer(config.throttleMs, 50, // batch delay
        10 // batch size
        );
        // Initialize collectors
        this.fileSystemCollector = new file_system_collector_1.FileSystemCollector(this.eventBus, this.normalizer);
        this.editorCollector = new editor_collector_1.EditorCollector(this.eventBus, this.normalizer, config.throttleMs);
        this.codeModificationCollector = new code_modification_collector_1.CodeModificationCollector(this.eventBus, this.normalizer);
        this.userInteractionCollector = new user_interaction_collector_1.UserInteractionCollector(this.eventBus, this.normalizer, config.idleThresholdMs, config.trackKeystrokes);
        this.performanceCollector = new performance_event_collector_1.PerformanceEventCollector(this.eventBus, this.normalizer, config.performanceMonitoringIntervalMs);
        this.diagnosticCollector = new diagnostic_collector_1.DiagnosticCollector(this.eventBus, this.normalizer);
        this.terminalCollector = new terminal_collector_1.TerminalCollector(this.eventBus, this.normalizer);
        // Initialize trackers
        this.aiContextTracker = new ai_context_tracker_1.AIContextTracker(this.eventBus);
        this.vcsEventTracker = new vcs_event_tracker_1.VCSEventTracker(this.eventBus, this.normalizer);
        this.sessionStateTracker = new session_state_tracker_1.SessionStateTracker(this.eventBus, extensionContext);
        // Initialize pipeline
        this.stateManager = new storage_1.StateManager(this.eventBus, 100);
        this.contextWindowBuilder = new context_window_builder_1.ContextWindowBuilder(this.stateManager, contextEngine);
        this.contextEnricher = new context_enricher_1.ContextEnricher(contextEngine);
        this.optimizationLayer = new optimization_layer_1.OptimizationLayer(60000, 1000);
        this.feedbackLoop = new context_1.FeedbackLoop(this.eventBus);
        // Initialize storage
        const storagePath = path.join(os.homedir(), '.inline', 'events');
        this.eventStorage = new storage_2.EventStorage(storagePath, config.storageEnabled, config.maxStorageSize);
    }
    /**
     * Start event tracking
     */
    start() {
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
        this.diagnosticCollector.start();
        this.terminalCollector.start();
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
    stop() {
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
        this.diagnosticCollector.dispose();
        this.terminalCollector.dispose();
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
    getEventBus() {
        return this.eventBus;
    }
    /**
     * Get the AI context tracker
     */
    getAIContextTracker() {
        return this.aiContextTracker;
    }
    /**
     * Get the feedback loop
     */
    getFeedbackLoop() {
        return this.feedbackLoop;
    }
    /**
     * Get the state manager
     */
    getStateManager() {
        return this.stateManager;
    }
    /**
     * Get the context window builder
     */
    getContextWindowBuilder() {
        return this.contextWindowBuilder;
    }
    /**
     * Get the performance collector
     */
    getPerformanceCollector() {
        return this.performanceCollector;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get statistics
     */
    getStatistics() {
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
    clearHistory() {
        this.eventBus.clearBuffer();
        this.stateManager.clearHistory();
        this.aiContextTracker.resetMetrics();
        this.logger.info('All history and buffers cleared');
    }
    /**
     * Dispose the event tracking manager
     */
    dispose() {
        this.stop();
        (0, event_bus_1.disposeEventBus)();
    }
}
exports.EventTrackingManager = EventTrackingManager;
/**
 * Create event tracking manager from VS Code configuration
 */
function createEventTrackingManager(context, contextEngine) {
    const config = vscode.workspace.getConfiguration('inline');
    const trackingConfig = {
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
//# sourceMappingURL=event-tracking-manager.js.map