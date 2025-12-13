"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackLoop = void 0;
const event_types_1 = require("@inline/events/event-types");
const logger_1 = require("@inline/shared/platform/system/logger");
/**
 * Feedback Loop - Analyzes user acceptance/rejection of AI suggestions
 * and uses this data to improve future suggestions (e.g. by adjusting timeouts,
 * context selection, or model parameters).
 */
class FeedbackLoop {
    constructor(eventBus) {
        this.subscriptionIds = [];
        // Metrics
        this.recentAcceptanceRate = 0;
        this.acceptanceHistory = [];
        this.historySize = 50;
        this.logger = new logger_1.Logger('FeedbackLoop');
        this.eventBus = eventBus;
    }
    start() {
        this.logger.info('Starting Feedback Loop');
        const filter = {
            types: [
                event_types_1.AIContextEventType.SUGGESTION_ACCEPTED,
                event_types_1.AIContextEventType.SUGGESTION_REJECTED
            ]
        };
        const subId = this.eventBus.subscribe((event) => this.handleFeedback(event), filter, event_types_1.EventPriority.LOW);
        this.subscriptionIds.push(subId);
    }
    handleFeedback(event) {
        const isAccepted = event.type === event_types_1.AIContextEventType.SUGGESTION_ACCEPTED;
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
        }
        else if (this.recentAcceptanceRate > 0.7) {
            this.logger.info(`High acceptance rate (${(this.recentAcceptanceRate * 100).toFixed(1)}%). Model performing well.`);
        }
        // e.g. If acceptance rate is low (< 10%), increase confidence threshold
        // e.g. If acceptance rate is high (> 60%), maybe increase max tokens?
    }
    getAcceptanceRate() {
        return this.recentAcceptanceRate;
    }
    dispose() {
        this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
        this.subscriptionIds = [];
    }
}
exports.FeedbackLoop = FeedbackLoop;
//# sourceMappingURL=feedback-loop.js.map