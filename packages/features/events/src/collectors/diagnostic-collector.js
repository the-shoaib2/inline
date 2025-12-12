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
exports.DiagnosticCollector = void 0;
const vscode = __importStar(require("vscode"));
const event_types_1 = require("../event-types");
const shared_1 = require("@inline/shared");
/**
 * Collects diagnostic events (errors, warnings) from VS Code
 */
class DiagnosticCollector {
    constructor(eventBus, normalizer) {
        this.disposables = [];
        this.lastDiagnostics = new Map(); // URI -> hash of diagnostics
        this.logger = new shared_1.Logger('DiagnosticCollector');
        this.eventBus = eventBus;
        this.normalizer = normalizer;
    }
    /**
     * Start collecting diagnostic events
     */
    start() {
        this.logger.info('Starting diagnostic event collection');
        // Watch for diagnostic changes
        vscode.languages.onDidChangeDiagnostics((event) => {
            this.handleDiagnosticsChanged(event);
        }, null, this.disposables);
    }
    /**
     * Handle diagnostics changed
     */
    handleDiagnosticsChanged(event) {
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
            let eventType = event_types_1.SyntaxSemanticEventType.LINT_WARNING;
            for (const diag of diagnostics) {
                if (diag.severity === vscode.DiagnosticSeverity.Error) {
                    maxSeverity = vscode.DiagnosticSeverity.Error;
                    eventType = event_types_1.SyntaxSemanticEventType.SYNTAX_ERROR; // Or TYPE_ERROR
                    break;
                }
                else if (diag.severity === vscode.DiagnosticSeverity.Warning) {
                    eventType = event_types_1.SyntaxSemanticEventType.LINT_WARNING;
                }
            }
            const syntaxEvent = {
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
    emitEvent(event) {
        this.normalizer.addToBatch(event, (events) => {
            this.eventBus.emitBatch(events);
        });
    }
    /**
     * Stop collecting events and dispose resources
     */
    dispose() {
        this.logger.info('Stopping diagnostic event collection');
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
        this.lastDiagnostics.clear();
    }
}
exports.DiagnosticCollector = DiagnosticCollector;
//# sourceMappingURL=diagnostic-collector.js.map