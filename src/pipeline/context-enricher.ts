import { AnyEvent, CodeModificationEvent, EditorEvent } from '../events/event-types';
import { ContextEngine, CodeContext } from '../core/context/context-engine';
import { SemanticAnalyzer } from '../analysis/semantic-analyzer';
import { Logger } from '../system/logger';
import * as vscode from 'vscode';

/**
 * Enriches events with additional context information
 */
export class ContextEnricher {
    private logger: Logger;
    private contextEngine: ContextEngine;
    private semanticAnalyzer: SemanticAnalyzer;

    constructor(contextEngine: ContextEngine) {
        this.logger = new Logger('ContextEnricher');
        this.contextEngine = contextEngine;
        this.semanticAnalyzer = new SemanticAnalyzer();
    }

    /**
     * Enrich an event with additional context
     */
    public async enrichEvent(event: AnyEvent): Promise<AnyEvent> {
        // Add file metadata for document-related events
        if ('document' in event && event.document) {
            const enrichedEvent = await this.enrichDocumentEvent(event);
            return enrichedEvent;
        }

        return event;
    }

    /**
     * Enrich document-related events
     */
    private async enrichDocumentEvent(event: AnyEvent): Promise<AnyEvent> {
        if (!('document' in event) || !event.document) {
            return event;
        }

        try {
            // Get the actual document
            const document = await vscode.workspace.openTextDocument(event.document.uri);

            // Add file size
            const fileSize = document.getText().length;

            // Add line count
            const lineCount = document.lineCount;

            // Enrich metadata
            if (!event.metadata) {
                event.metadata = {};
            }

            event.metadata.fileSize = fileSize;
            event.metadata.lineCount = lineCount;
            event.metadata.languageId = document.languageId;

            // For code modification events, add AST context
            if (event.type.startsWith('code.')) {
                const codeEvent = event as CodeModificationEvent;
                if (codeEvent.changes && codeEvent.changes.length > 0) {
                    const change = codeEvent.changes[0];
                    
                    // Get surrounding context
                    const startLine = Math.max(0, change.range.start.line - 5);
                    const endLine = Math.min(document.lineCount - 1, change.range.end.line + 5);
                    const surroundingText = document.getText(
                        new vscode.Range(startLine, 0, endLine, 0)
                    );

                    event.metadata.surroundingContext = surroundingText;
                }
            }

            // For editor events, add cursor context
            if (event.type.startsWith('editor.')) {
                const editorEvent = event as EditorEvent;
                if (editorEvent.position) {
                    const line = document.lineAt(editorEvent.position.line);
                    event.metadata.currentLine = line.text;
                    event.metadata.linePrefix = line.text.substring(0, editorEvent.position.character);
                    event.metadata.lineSuffix = line.text.substring(editorEvent.position.character);
                }
            }

        } catch (error) {
            this.logger.debug('Could not enrich event:', error);
        }

        return event;
    }

    /**
     * Batch enrich multiple events
     */
    public async enrichEvents(events: AnyEvent[]): Promise<AnyEvent[]> {
        const enriched: AnyEvent[] = [];

        for (const event of events) {
            const enrichedEvent = await this.enrichEvent(event);
            enriched.push(enrichedEvent);
        }

        return enriched;
    }
}
