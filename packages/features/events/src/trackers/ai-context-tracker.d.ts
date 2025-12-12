import { EventBus } from '../event-bus';
/**
 * Tracks AI-specific context and events
 */
export declare class AIContextTracker {
    private logger;
    private eventBus;
    private subscriptionIds;
    private totalInferences;
    private totalSuggestions;
    private acceptedSuggestions;
    private rejectedSuggestions;
    private modifiedSuggestions;
    private totalInferenceTime;
    private averageConfidence;
    private currentModelName;
    private recentSuggestions;
    constructor(eventBus: EventBus);
    /**
     * Start tracking AI context
     */
    start(): void;
    /**
     * Handle AI-related events
     */
    private handleAIEvent;
    /**
     * Update average confidence score
     */
    private updateAverageConfidence;
    /**
     * Emit an AI context event
     */
    emitInferenceRequested(contextWindowSize: number): void;
    /**
     * Emit suggestion generated event
     */
    emitSuggestionGenerated(suggestionText: string, confidence: number, inferenceTime: number, contextWindowSize: number): string;
    /**
     * Emit suggestion accepted event
     */
    emitSuggestionAccepted(suggestionId: string): void;
    /**
     * Emit suggestion rejected event
     */
    emitSuggestionRejected(suggestionId: string): void;
    /**
     * Emit suggestion modified event
     */
    emitSuggestionModified(suggestionId: string, userModification: string): void;
    /**
     * Emit model loaded event
     */
    emitModelLoaded(modelName: string): void;
    /**
     * Emit model unloaded event
     */
    emitModelUnloaded(modelName: string): void;
    /**
     * Get AI metrics
     */
    getMetrics(): {
        totalInferences: number;
        totalSuggestions: number;
        acceptedSuggestions: number;
        rejectedSuggestions: number;
        modifiedSuggestions: number;
        acceptanceRate: number;
        averageInferenceTime: number;
        averageConfidence: number;
        currentModel: string | null;
    };
    /**
     * Reset metrics
     */
    resetMetrics(): void;
    /**
     * Dispose tracker
     */
    dispose(): void;
}
//# sourceMappingURL=ai-context-tracker.d.ts.map