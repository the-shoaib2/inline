import { AnyEvent } from '@events/event-types';
import { ContextEngine } from '@context/context-engine';
/**
 * Enriches events with additional context information
 */
export declare class ContextEnricher {
    private logger;
    private contextEngine;
    private semanticAnalyzer;
    constructor(contextEngine: ContextEngine);
    /**
     * Enrich an event with additional context
     */
    enrichEvent(event: AnyEvent): Promise<AnyEvent>;
    /**
     * Enrich document-related events
     */
    private enrichDocumentEvent;
    /**
     * Batch enrich multiple events
     */
    enrichEvents(events: AnyEvent[]): Promise<AnyEvent[]>;
}
//# sourceMappingURL=context-enricher.d.ts.map