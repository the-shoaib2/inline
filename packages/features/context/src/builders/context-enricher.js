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
exports.ContextEnricher = void 0;
const language_1 = require("@inline/language");
const logger_1 = require("@inline/shared/platform/system/logger");
const vscode = __importStar(require("vscode"));
/**
 * Enriches events with additional context information
 */
class ContextEnricher {
    constructor(contextEngine) {
        this.logger = new logger_1.Logger('ContextEnricher');
        this.contextEngine = contextEngine;
        this.semanticAnalyzer = new language_1.SemanticAnalyzer();
    }
    /**
     * Enrich an event with additional context
     */
    async enrichEvent(event) {
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
    async enrichDocumentEvent(event) {
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
                const codeEvent = event;
                if (codeEvent.changes && codeEvent.changes.length > 0) {
                    const change = codeEvent.changes[0];
                    // Get surrounding context
                    const startLine = Math.max(0, change.range.start.line - 5);
                    const endLine = Math.min(document.lineCount - 1, change.range.end.line + 5);
                    const surroundingText = document.getText(new vscode.Range(startLine, 0, endLine, 0));
                    event.metadata.surroundingContext = surroundingText;
                }
            }
            // For editor events, add cursor context
            if (event.type.startsWith('editor.')) {
                const editorEvent = event;
                if (editorEvent.position) {
                    const line = document.lineAt(editorEvent.position.line);
                    event.metadata.currentLine = line.text;
                    event.metadata.linePrefix = line.text.substring(0, editorEvent.position.character);
                    event.metadata.lineSuffix = line.text.substring(editorEvent.position.character);
                }
            }
        }
        catch (error) {
            this.logger.debug('Could not enrich event:', error);
        }
        return event;
    }
    /**
     * Batch enrich multiple events
     */
    async enrichEvents(events) {
        const enriched = [];
        for (const event of events) {
            const enrichedEvent = await this.enrichEvent(event);
            enriched.push(enrichedEvent);
        }
        return enriched;
    }
}
exports.ContextEnricher = ContextEnricher;
//# sourceMappingURL=context-enricher.js.map