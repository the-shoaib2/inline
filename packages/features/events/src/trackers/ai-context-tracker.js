"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIContextTracker = void 0;
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Tracks AI-specific context and events
 */
class AIContextTracker {
    constructor(eventBus) {
        this.subscriptionIds = [];
        // AI metrics
        this.totalInferences = 0;
        this.totalSuggestions = 0;
        this.acceptedSuggestions = 0;
        this.rejectedSuggestions = 0;
        this.modifiedSuggestions = 0;
        this.totalInferenceTime = 0;
        this.averageConfidence = 0;
        this.currentModelName = null;
        // Recent suggestions for tracking
        this.recentSuggestions = new Map();
        this.logger = new shared_1.Logger('AIContextTracker');
        this.eventBus = eventBus;
    }
    /**
     * Start tracking AI context
     */
    start() {
        this.logger.info('Starting AI context tracking');
        // Subscribe to completion provider events (we'll emit these from completion provider)
        const filter = {
            types: Object.values(event_types_1.AIContextEventType)
        };
        const subId = this.eventBus.subscribe((event) => this.handleAIEvent(event), filter, event_types_1.EventPriority.NORMAL);
        this.subscriptionIds.push(subId);
    }
    /**
     * Handle AI-related events
     */
    handleAIEvent(event) {
        switch (event.type) {
            case event_types_1.AIContextEventType.INFERENCE_REQUESTED:
                this.totalInferences++;
                break;
            case event_types_1.AIContextEventType.SUGGESTION_GENERATED:
                this.totalSuggestions++;
                if (event.suggestionText && event.confidence !== undefined) {
                    this.recentSuggestions.set(event.id, {
                        text: event.suggestionText,
                        timestamp: event.timestamp,
                        confidence: event.confidence
                    });
                    this.updateAverageConfidence(event.confidence);
                }
                if (event.inferenceTime) {
                    this.totalInferenceTime += event.inferenceTime;
                }
                break;
            case event_types_1.AIContextEventType.SUGGESTION_ACCEPTED:
                this.acceptedSuggestions++;
                break;
            case event_types_1.AIContextEventType.SUGGESTION_REJECTED:
                this.rejectedSuggestions++;
                break;
            case event_types_1.AIContextEventType.SUGGESTION_MODIFIED:
                this.modifiedSuggestions++;
                break;
            case event_types_1.AIContextEventType.MODEL_LOADED:
                this.currentModelName = event.modelName || null;
                break;
            case event_types_1.AIContextEventType.MODEL_UNLOADED:
                this.currentModelName = null;
                break;
        }
    }
    /**
     * Update average confidence score
     */
    updateAverageConfidence(newConfidence) {
        const totalSuggestions = this.totalSuggestions;
        this.averageConfidence =
            (this.averageConfidence * (totalSuggestions - 1) + newConfidence) / totalSuggestions;
    }
    /**
     * Emit an AI context event
     */
    emitInferenceRequested(contextWindowSize) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.INFERENCE_REQUESTED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            contextWindowSize,
            modelName: this.currentModelName || undefined
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit suggestion generated event
     */
    emitSuggestionGenerated(suggestionText, confidence, inferenceTime, contextWindowSize) {
        const event = {
            id: `suggestion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: event_types_1.AIContextEventType.SUGGESTION_GENERATED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            suggestionText,
            confidence,
            inferenceTime,
            contextWindowSize,
            modelName: this.currentModelName || undefined
        };
        this.eventBus.emit(event);
        return event.id;
    }
    /**
     * Emit suggestion accepted event
     */
    emitSuggestionAccepted(suggestionId) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.SUGGESTION_ACCEPTED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            accepted: true,
            metadata: { suggestionId }
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit suggestion rejected event
     */
    emitSuggestionRejected(suggestionId) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.SUGGESTION_REJECTED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            accepted: false,
            metadata: { suggestionId }
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit suggestion modified event
     */
    emitSuggestionModified(suggestionId, userModification) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.SUGGESTION_MODIFIED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            userModification,
            metadata: { suggestionId }
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit model loaded event
     */
    emitModelLoaded(modelName) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.MODEL_LOADED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            modelName
        };
        this.eventBus.emit(event);
    }
    /**
     * Emit model unloaded event
     */
    emitModelUnloaded(modelName) {
        const event = {
            id: '',
            type: event_types_1.AIContextEventType.MODEL_UNLOADED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            modelName
        };
        this.eventBus.emit(event);
    }
    /**
     * Get AI metrics
     */
    getMetrics() {
        const acceptanceRate = this.totalSuggestions > 0
            ? this.acceptedSuggestions / this.totalSuggestions
            : 0;
        const averageInferenceTime = this.totalInferences > 0
            ? this.totalInferenceTime / this.totalInferences
            : 0;
        return {
            totalInferences: this.totalInferences,
            totalSuggestions: this.totalSuggestions,
            acceptedSuggestions: this.acceptedSuggestions,
            rejectedSuggestions: this.rejectedSuggestions,
            modifiedSuggestions: this.modifiedSuggestions,
            acceptanceRate,
            averageInferenceTime,
            averageConfidence: this.averageConfidence,
            currentModel: this.currentModelName
        };
    }
    /**
     * Reset metrics
     */
    resetMetrics() {
        this.totalInferences = 0;
        this.totalSuggestions = 0;
        this.acceptedSuggestions = 0;
        this.rejectedSuggestions = 0;
        this.modifiedSuggestions = 0;
        this.totalInferenceTime = 0;
        this.averageConfidence = 0;
        this.recentSuggestions.clear();
    }
    /**
     * Dispose tracker
     */
    dispose() {
        this.logger.info('Stopping AI context tracking');
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
        this.recentSuggestions.clear();
    }
}
exports.AIContextTracker = AIContextTracker;
//# sourceMappingURL=ai-context-tracker.js.map