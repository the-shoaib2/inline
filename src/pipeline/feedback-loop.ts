import { EventBus } from '../events/event-bus';
import { AIContextEventType, AIContextEvent, EventFilter, EventPriority } from '../events/event-types';
import { Logger } from '../system/logger';

/**
 * Feedback Loop - Analyzes user acceptance/rejection of AI suggestions
 * and uses this data to improve future suggestions (e.g. by adjusting timeouts,
 * context selection, or model parameters).
 */
export class FeedbackLoop {
    private logger: Logger;
    private eventBus: EventBus;
    private subscriptionIds: string[] = [];
    
    // Metrics
    private recentAcceptanceRate: number = 0;
    private acceptanceHistory: boolean[] = [];
    private readonly historySize = 50;

    constructor(eventBus: EventBus) {
        this.logger = new Logger('FeedbackLoop');
        this.eventBus = eventBus;
    }

    public start(): void {
        this.logger.info('Starting Feedback Loop');

        const filter: EventFilter = {
            types: [
                AIContextEventType.SUGGESTION_ACCEPTED,
                AIContextEventType.SUGGESTION_REJECTED
            ]
        };

        const subId = this.eventBus.subscribe(
            (event) => this.handleFeedback(event as AIContextEvent),
            filter,
            EventPriority.LOW
        );
        this.subscriptionIds.push(subId);
    }

    private handleFeedback(event: AIContextEvent): void {
        const isAccepted = event.type === AIContextEventType.SUGGESTION_ACCEPTED;
        
        // Update history
        this.acceptanceHistory.push(isAccepted);
        if (this.acceptanceHistory.length > this.historySize) {
            this.acceptanceHistory.shift();
        }

        // Recalculate rate
        const acceptedCount = this.acceptanceHistory.filter(a => a).length;
        this.recentAcceptanceRate = this.acceptanceHistory.length > 0 
            ? acceptedCount / this.acceptanceHistory.length 
            : 0;

        this.logger.debug(`Feedback received: ${isAccepted ? 'ACCEPTED' : 'REJECTED'}. Recent Rate: ${(this.recentAcceptanceRate * 100).toFixed(1)}%`);

        // Implement adaptive logic based on rate
        if (this.recentAcceptanceRate < 0.3) {
            this.logger.warn(`Low acceptance rate (${(this.recentAcceptanceRate * 100).toFixed(1)}%). Consider adjusting temperature or context.`);
            // Could trigger automatic parameter adjustment here
        } else if (this.recentAcceptanceRate > 0.7) {
            this.logger.info(`High acceptance rate (${(this.recentAcceptanceRate * 100).toFixed(1)}%). Model performing well.`);
        }
        // e.g. If acceptance rate is low (< 10%), increase confidence threshold
        // e.g. If acceptance rate is high (> 60%), maybe increase max tokens?
    }

    public getAcceptanceRate(): number {
        return this.recentAcceptanceRate;
    }

    public dispose(): void {
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
    }
}
