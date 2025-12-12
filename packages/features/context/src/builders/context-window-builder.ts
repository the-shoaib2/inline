import * as vscode from 'vscode';
import { StateManager, DocumentState, EditRecord } from '@inline/storage';
import { ContextEngine, CodeContext } from '../context-engine';
import { Logger } from '@inline/shared';

/**
 * Complete context window for AI model inference.
 *
 * Combines:
 * - Code context (prefix/suffix)
 * - Document metadata
 * - Recent edits and cursor history
 * - Related files and imports
 * - User typing patterns
 * - Project structure information
 */
export interface ContextWindow {
    // Core code context
    prefix: string;
    suffix: string;
    language: string;
    filename: string;

    // Current document metadata
    currentDocument: {
        uri: vscode.Uri;
        languageId: string;
        version: number;
    };

    // Recent activity for pattern detection
    recentEdits: Array<{
        timestamp: number;
        type: string;
        summary: string;
    }>;

    // Cursor movement history
    cursorHistory: Array<{
        line: number;
        character: number;
        timestamp: number;
    }>;

    // Related files for multi-file context
    relatedFiles: Array<{
        uri: vscode.Uri;
        reason: string;
        relevance: number;
    }>;

    // User behavior patterns
    userPatterns: {
        typingSpeed: number;
        commonPatterns: string[];
        preferredStyle: string;
    };

    // Project-level information
    projectInfo: {
        hasTypeScript: boolean;
        hasJavaScript: boolean;
        framework?: string;
        dependencies: string[];
    };

    // Metadata for optimization
    contextSize: number;
    buildTime: number;
}

/**
 * Assembles complete context window from multiple sources.
 *
 * Responsibilities:
 * - Gather code context from ContextEngine
 * - Retrieve editor state from StateManager
 * - Extract recent edits and cursor history
 * - Identify related files
 * - Analyze user patterns
 * - Collect project information
 * - Measure build time and size
 */
export class ContextWindowBuilder {
    private logger: Logger;
    private stateManager: StateManager;
    private contextEngine: ContextEngine;

    /**
     * Initialize context window builder.
     * @param stateManager For editor state and history
     * @param contextEngine For code context extraction
     */
    constructor(stateManager: StateManager, contextEngine: ContextEngine) {
        this.logger = new Logger('ContextWindowBuilder');
        this.stateManager = stateManager;
        this.contextEngine = contextEngine;
    }

    /**
     * Build complete context window for current cursor position.
     * Gathers context from all available sources.
     */
    public async buildContextWindow(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<ContextWindow> {
        const startTime = Date.now();

        // Get code context from context engine
        const codeContext = await this.contextEngine.buildContext(document, position);

        // Get document state from state manager
        const docState = this.stateManager.getDocumentState(document.uri);

        // Build context window
        const contextWindow: ContextWindow = {
            // Core context from context engine
            prefix: codeContext.prefix,
            suffix: codeContext.suffix,
            language: codeContext.language,
            filename: codeContext.filename,

            // Current document
            currentDocument: {
                uri: document.uri,
                languageId: document.languageId,
                version: document.version
            },

            // Recent activity from state manager
            recentEdits: this.getRecentEditsSummary(document.uri),
            cursorHistory: this.getCursorHistorySummary(),

            // Related files
            relatedFiles: this.getRelatedFiles(codeContext),

            // User patterns
            userPatterns: this.getUserPatterns(docState),

            // Project context
            projectInfo: {
                hasTypeScript: codeContext.projectConfig?.hasTypeScript || false,
                hasJavaScript: codeContext.projectConfig?.hasJavaScript || false,
                framework: codeContext.projectConfig?.framework,
                dependencies: codeContext.projectConfig?.dependencies || []
            },

            // Metadata
            contextSize: this.calculateContextSize(codeContext),
            buildTime: Date.now() - startTime
        };

        this.logger.debug(`Context window built in ${contextWindow.buildTime}ms, size: ${contextWindow.contextSize}`);

        return contextWindow;
    }

    /**
     * Get recent edits summary
     */
    private getRecentEditsSummary(uri: vscode.Uri): Array<{
        timestamp: number;
        type: string;
        summary: string;
    }> {
        const recentEdits = this.stateManager.getRecentEdits(uri, 10);

        return recentEdits.map(edit => ({
            timestamp: edit.timestamp,
            type: edit.type,
            summary: this.summarizeEdit(edit)
        }));
    }

    /**
     * Summarize an edit
     */
    private summarizeEdit(edit: EditRecord): string {
        const totalChars = edit.changes.reduce((sum, c) => sum + c.text.length, 0);
        const changeCount = edit.changes.length;

        if (changeCount === 1) {
            return `${totalChars} chars`;
        } else {
            return `${changeCount} changes, ${totalChars} chars`;
        }
    }

    /**
     * Get cursor history summary
     */
    private getCursorHistorySummary(): Array<{
        line: number;
        character: number;
        timestamp: number;
    }> {
        const history = this.stateManager.getCursorHistory(5);

        return history.map(h => ({
            line: h.position.line,
            character: h.position.character,
            timestamp: h.timestamp
        }));
    }

    /**
     * Get related files
     */
    private getRelatedFiles(codeContext: CodeContext): Array<{
        uri: vscode.Uri;
        reason: string;
        relevance: number;
    }> {
        const relatedFiles: Array<{
            uri: vscode.Uri;
            reason: string;
            relevance: number;
        }> = [];

        // Add files from imports
        for (const imp of codeContext.imports) {
            if (imp.resolvedPath) {
                relatedFiles.push({
                    uri: vscode.Uri.file(imp.resolvedPath),
                    reason: 'imported',
                    relevance: 0.9
                });
            }
        }

        // Add files from related code blocks
        for (const related of codeContext.relatedCode) {
            relatedFiles.push({
                uri: vscode.Uri.file(related.filePath),
                reason: 'similar code',
                relevance: related.similarity
            });
        }

        // Sort by relevance
        relatedFiles.sort((a, b) => b.relevance - a.relevance);

        // Return top 5
        return relatedFiles.slice(0, 5);
    }

    /**
     * Get user patterns
     */
    private getUserPatterns(docState: DocumentState | undefined): {
        typingSpeed: number;
        commonPatterns: string[];
        preferredStyle: string;
    } {
        if (!docState || docState.recentEdits.length < 2) {
            return {
                typingSpeed: 0,
                commonPatterns: [],
                preferredStyle: 'unknown'
            };
        }

        // Calculate typing speed from recent edits
        const edits = docState.recentEdits.slice(-10);
        const timeDiffs: number[] = [];

        for (let i = 1; i < edits.length; i++) {
            const diff = edits[i].timestamp - edits[i - 1].timestamp;
            if (diff < 5000) { // Only count edits within 5 seconds
                timeDiffs.push(diff);
            }
        }

        const avgTimeDiff = timeDiffs.length > 0
            ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
            : 0;

        const typingSpeed = avgTimeDiff > 0 ? 1000 / avgTimeDiff : 0; // edits per second

        return {
            typingSpeed,
            commonPatterns: this.detectCommonPatterns(docState),
            preferredStyle: this.detectPreferredStyle(docState)
        };
    }

    /**
     * Detect common coding patterns from recent edits
     */
    private detectCommonPatterns(docState: DocumentState | undefined): string[] {
        if (!docState || docState.recentEdits.length === 0) {
            return [];
        }

        const patterns: Map<string, number> = new Map();
        
        // Analyze recent edits for patterns
        for (const edit of docState.recentEdits) {
            for (const change of edit.changes) {
                const text = change.text;
                
                // Detect common patterns
                if (text.includes('const ')) patterns.set('const-declarations', (patterns.get('const-declarations') || 0) + 1);
                if (text.includes('let ')) patterns.set('let-declarations', (patterns.get('let-declarations') || 0) + 1);
                if (text.includes('async ')) patterns.set('async-functions', (patterns.get('async-functions') || 0) + 1);
                if (text.includes('=>')) patterns.set('arrow-functions', (patterns.get('arrow-functions') || 0) + 1);
                if (text.includes('function ')) patterns.set('function-declarations', (patterns.get('function-declarations') || 0) + 1);
            }
        }

        // Return top 3 patterns
        return Array.from(patterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pattern]) => pattern);
    }

    /**
     * Detect preferred coding style from recent edits
     */
    private detectPreferredStyle(docState: DocumentState | undefined): string {
        if (!docState || docState.recentEdits.length === 0) {
            return 'unknown';
        }

        let singleQuotes = 0;
        let doubleQuotes = 0;
        let semicolons = 0;
        let noSemicolons = 0;

        for (const edit of docState.recentEdits) {
            for (const change of edit.changes) {
                const text = change.text;
                
                // Count quote style
                singleQuotes += (text.match(/'/g) || []).length;
                doubleQuotes += (text.match(/"/g) || []).length;
                
                // Count semicolon usage
                if (text.trim().endsWith(';')) semicolons++;
                if (text.trim().length > 0 && !text.trim().endsWith(';') && !text.trim().endsWith('{') && !text.trim().endsWith('}')) {
                    noSemicolons++;
                }
            }
        }

        // Determine style
        const quoteStyle = singleQuotes > doubleQuotes ? 'single-quotes' : 'double-quotes';
        const semicolonStyle = semicolons > noSemicolons ? 'semicolons' : 'no-semicolons';
        
        return `${quoteStyle}, ${semicolonStyle}`;
    }

    /**
     * Calculate context size
     */
    private calculateContextSize(codeContext: CodeContext): number {
        let size = 0;

        size += codeContext.prefix.length;
        size += codeContext.suffix.length;
        size += codeContext.imports.reduce((sum, imp) => sum + imp.module.length, 0);
        size += codeContext.functions.reduce((sum, fn) => sum + fn.signature.length, 0);
        size += codeContext.classes.reduce((sum, cls) => sum + cls.name.length, 0);

        return size;
    }

    /**
     * Build lightweight context for quick operations
     */
    public async buildLightweightContext(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<{
        prefix: string;
        suffix: string;
        language: string;
        recentEdits: number;
    }> {
        const codeContext = await this.contextEngine.buildContext(document, position);
        const recentEdits = this.stateManager.getRecentEdits(document.uri, 5);

        return {
            prefix: codeContext.prefix,
            suffix: codeContext.suffix,
            language: codeContext.language,
            recentEdits: recentEdits.length
        };
    }
}
