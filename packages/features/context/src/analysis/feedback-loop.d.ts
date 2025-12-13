import { EventBus } from '@inline/events/event-bus';
/**
 * Feedback Loop - Analyzes user acceptance/rejection of AI suggestions
 * and uses this data to improve future suggestions (e.g. by adjusting timeouts,
 * context selection, or model parameters).
 */
export declare class FeedbackLoop {
    private logger;
    private eventBus;
    private subscriptionIds;
    private recentAcceptanceRate;
    private acceptanceHistory;
    private readonly historySize;
    constructor(eventBus: EventBus);
    start(): void;
    private handleFeedback;
    getAcceptanceRate(): number;
    dispose(): void;
}
//# sourceMappingURL=feedback-loop.d.ts.map