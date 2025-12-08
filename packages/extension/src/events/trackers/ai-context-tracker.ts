import { EventBus } from '@events/event-bus';
import { 
    AIContextEvent, 
    AIContextEventType,
    EventFilter,
    EventPriority
} from '@events/event-types';
import { Logger } from '@platform/system/logger';

/**
 * Tracks AI-specific context and events
 */
export class AIContextTracker {
    private logger: Logger;
    private eventBus: EventBus;
    private subscriptionIds: string[] = [];
    
    // AI metrics
    private totalInferences: number = 0;
    private totalSuggestions: number = 0;
    private acceptedSuggestions: number = 0;
    private rejectedSuggestions: number = 0;
    private modifiedSuggestions: number = 0;
    private totalInferenceTime: number = 0;
    private averageConfidence: number = 0;
    private currentModelName: string | null = null;

    // Recent suggestions for tracking
    private recentSuggestions: Map<string, {
        text: string;
        timestamp: number;
        confidence: number;
    }> = new Map();

    constructor(eventBus: EventBus) {
        this.logger = new Logger('AIContextTracker');
        this.eventBus = eventBus;
    }

    /**
     * Start tracking AI context
     */
    public start(): void {
        this.logger.info('Starting AI context tracking');

        // Subscribe to completion provider events (we'll emit these from completion provider)
        const filter: EventFilter = {
            types: Object.values(AIContextEventType)
        };

        const subId = this.eventBus.subscribe(
            (event) => this.handleAIEvent(event as AIContextEvent),
            filter,
            EventPriority.NORMAL
        );

        this.subscriptionIds.push(subId);
    }

    /**
     * Handle AI-related events
     */
    private handleAIEvent(event: AIContextEvent): void {
        switch (event.type) {
            case AIContextEventType.INFERENCE_REQUESTED:
                this.totalInferences++;
                break;

            case AIContextEventType.SUGGESTION_GENERATED:
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

            case AIContextEventType.SUGGESTION_ACCEPTED:
                this.acceptedSuggestions++;
                break;

            case AIContextEventType.SUGGESTION_REJECTED:
                this.rejectedSuggestions++;
                break;

            case AIContextEventType.SUGGESTION_MODIFIED:
                this.modifiedSuggestions++;
                break;

            case AIContextEventType.MODEL_LOADED:
                this.currentModelName = event.modelName || null;
                break;

            case AIContextEventType.MODEL_UNLOADED:
                this.currentModelName = null;
                break;
        }
    }

    /**
     * Update average confidence score
     */
    private updateAverageConfidence(newConfidence: number): void {
        const totalSuggestions = this.totalSuggestions;
        this.averageConfidence = 
            (this.averageConfidence * (totalSuggestions - 1) + newConfidence) / totalSuggestions;
    }

    /**
     * Emit an AI context event
     */
    public emitInferenceRequested(contextWindowSize: number): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.INFERENCE_REQUESTED,
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
    public emitSuggestionGenerated(
        suggestionText: string,
        confidence: number,
        inferenceTime: number,
        contextWindowSize: number
    ): string {
        const event: AIContextEvent = {
            id: `suggestion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: AIContextEventType.SUGGESTION_GENERATED,
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
    public emitSuggestionAccepted(suggestionId: string): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.SUGGESTION_ACCEPTED,
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
    public emitSuggestionRejected(suggestionId: string): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.SUGGESTION_REJECTED,
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
    public emitSuggestionModified(suggestionId: string, userModification: string): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.SUGGESTION_MODIFIED,
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
    public emitModelLoaded(modelName: string): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.MODEL_LOADED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            modelName
        };

        this.eventBus.emit(event);
    }

    /**
     * Emit model unloaded event
     */
    public emitModelUnloaded(modelName: string): void {
        const event: AIContextEvent = {
            id: '',
            type: AIContextEventType.MODEL_UNLOADED,
            timestamp: Date.now(),
            source: 'ai-context-tracker',
            modelName
        };

        this.eventBus.emit(event);
    }

    /**
     * Get AI metrics
     */
    public getMetrics(): {
        totalInferences: number;
        totalSuggestions: number;
        acceptedSuggestions: number;
        rejectedSuggestions: number;
        modifiedSuggestions: number;
        acceptanceRate: number;
        averageInferenceTime: number;
        averageConfidence: number;
        currentModel: string | null;
    } {
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
    public resetMetrics(): void {
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
    public dispose(): void {
        this.logger.info('Stopping AI context tracking');
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
        this.recentSuggestions.clear();
    }
}
