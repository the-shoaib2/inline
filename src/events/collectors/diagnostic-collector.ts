import * as vscode from 'vscode';
import { EventBus } from '../event-bus';
import { EventNormalizer } from '../event-normalizer';
import { 
    SyntaxSemanticEvent, 
    SyntaxSemanticEventType 
} from '../event-types';
import { Logger } from './../../system/logger';

/**
 * Collects diagnostic events (errors, warnings) from VS Code
 */
export class DiagnosticCollector {
    private logger: Logger;
    private disposables: vscode.Disposable[] = [];
    private eventBus: EventBus;
    private normalizer: EventNormalizer;
    private lastDiagnostics = new Map<string, string>(); // URI -> hash of diagnostics

    constructor(
        eventBus: EventBus, 
        normalizer: EventNormalizer
    ) {
        this.logger = new Logger('DiagnosticCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }

    /**
     * Start collecting diagnostic events
     */
    public start(): void {
        this.logger.info('Starting diagnostic event collection');

        // Watch for diagnostic changes
        vscode.languages.onDidChangeDiagnostics((event: vscode.DiagnosticChangeEvent) => {
            this.handleDiagnosticsChanged(event);
        }, null, this.disposables);
    }

    /**
     * Handle diagnostics changed
     */
    private handleDiagnosticsChanged(event: vscode.DiagnosticChangeEvent): void {
        for (const uri of event.uris) {
            const diagnostics = vscode.languages.getDiagnostics(uri);
            const diagnosticsHash = JSON.stringify(diagnostics.map(d => ({
                message: d.message,
                range: d.range,
                severity: d.severity,
                code: d.code
            })));

            // Only emit if changed (simple deduplication)
            if (this.lastDiagnostics.get(uri.toString()) === diagnosticsHash) {
                continue;
            }
            this.lastDiagnostics.set(uri.toString(), diagnosticsHash);

            if (diagnostics.length === 0) {
                continue; // Clear event? Maybe not needed for now
            }

            // Categorize max severity
            let maxSeverity = vscode.DiagnosticSeverity.Hint;
            let eventType = SyntaxSemanticEventType.LINT_WARNING;

            for (const diag of diagnostics) {
                if (diag.severity === vscode.DiagnosticSeverity.Error) {
                    maxSeverity = vscode.DiagnosticSeverity.Error;
                    eventType = SyntaxSemanticEventType.SYNTAX_ERROR; // Or TYPE_ERROR
                    break;
                } else if (diag.severity === vscode.DiagnosticSeverity.Warning) {
                    eventType = SyntaxSemanticEventType.LINT_WARNING;
                }
            }

            const syntaxEvent: SyntaxSemanticEvent = {
                id: '',
                type: eventType,
                timestamp: Date.now(),
                source: 'diagnostic-collector',
                document: {
                    uri: uri,
                    languageId: '' // Need to resolve language ID?
                },
                diagnostics: diagnostics
            };

            // Try to resolve language ID if document is open
            const editor = vscode.window.visibleTextEditors.find(e => e.document.uri.toString() === uri.toString());
            if (editor) {
                syntaxEvent.document.languageId = editor.document.languageId;
            }

            this.emitEvent(syntaxEvent);
        }
    }

    /**
     * Emit event through normalizer and event bus
     */
    private emitEvent(event: SyntaxSemanticEvent): void {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }

    /**
     * Stop collecting events and dispose resources
     */
    public dispose(): void {
        this.logger.info('Stopping diagnostic event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.lastDiagnostics.clear();
    }
}
