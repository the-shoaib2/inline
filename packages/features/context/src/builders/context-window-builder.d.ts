import * as vscode from 'vscode';
import { StateManager } from '@inline/storage';
import { ContextEngine } from '@context/context-engine';
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
    prefix: string;
    suffix: string;
    language: string;
    filename: string;
    currentDocument: {
        uri: vscode.Uri;
        languageId: string;
        version: number;
    };
    recentEdits: Array<{
        timestamp: number;
        type: string;
        summary: string;
    }>;
    cursorHistory: Array<{
        line: number;
        character: number;
        timestamp: number;
    }>;
    relatedFiles: Array<{
        uri: vscode.Uri;
        reason: string;
        relevance: number;
    }>;
    userPatterns: {
        typingSpeed: number;
        commonPatterns: string[];
        preferredStyle: string;
    };
    projectInfo: {
        hasTypeScript: boolean;
        hasJavaScript: boolean;
        framework?: string;
        dependencies: string[];
    };
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
export declare class ContextWindowBuilder {
    private logger;
    private stateManager;
    private contextEngine;
    /**
     * Initialize context window builder.
     * @param stateManager For editor state and history
     * @param contextEngine For code context extraction
     */
    constructor(stateManager: StateManager, contextEngine: ContextEngine);
    /**
     * Build complete context window for current cursor position.
     * Gathers context from all available sources.
     */
    buildContextWindow(document: vscode.TextDocument, position: vscode.Position): Promise<ContextWindow>;
    /**
     * Get recent edits summary
     */
    private getRecentEditsSummary;
    /**
     * Summarize an edit
     */
    private summarizeEdit;
    /**
     * Get cursor history summary
     */
    private getCursorHistorySummary;
    /**
     * Get related files
     */
    private getRelatedFiles;
    /**
     * Get user patterns
     */
    private getUserPatterns;
    /**
     * Detect common coding patterns from recent edits
     */
    private detectCommonPatterns;
    /**
     * Detect preferred coding style from recent edits
     */
    private detectPreferredStyle;
    /**
     * Calculate context size
     */
    private calculateContextSize;
    /**
     * Build lightweight context for quick operations
     */
    buildLightweightContext(document: vscode.TextDocument, position: vscode.Position): Promise<{
        prefix: string;
        suffix: string;
        language: string;
        recentEdits: number;
    }>;
}
//# sourceMappingURL=context-window-builder.d.ts.map