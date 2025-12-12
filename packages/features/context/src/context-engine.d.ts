/**
 * Context engine for intelligent code analysis and context gathering.
 *
 * Features:
 * - Semantic analysis of code structure
 * - Import resolution and dependency tracking
 * - Function and class extraction
 * - Context optimization for AI models
 * - Adaptive context management based on model size
 */
import * as vscode from 'vscode';
import { DecoratorInfo, GenericInfo } from '@inline/language';
import { StateManager } from '@inline/storage';
import { ContextWindowBuilder } from '@context/builders/context-window-builder';
import { ModelSize } from './adaptive-context-manager';
/**
 * Import statement information with resolution details.
 */
export interface ImportInfo {
    module: string;
    imports: string[];
    tokenCount?: number;
    isDefault: boolean;
    alias?: string;
    resolvedPath?: string;
    lineNumber: number;
}
/**
 * Function parameter information with type and default values.
 */
export interface ParameterInfo {
    name: string;
    type?: string;
    optional: boolean;
    defaultValue?: string;
}
/**
 * Function signature and metadata for context analysis.
 */
export interface FunctionInfo {
    name: string;
    signature: string;
    parameters: ParameterInfo[];
    returnType?: string;
    docstring?: string;
    lineNumber: number;
    isAsync: boolean;
    isExported: boolean;
}
/**
 * Class property information with visibility modifiers.
 */
export interface PropertyInfo {
    name: string;
    type?: string;
    visibility?: 'public' | 'private' | 'protected';
    isStatic: boolean;
    isReadonly: boolean;
}
/**
 * Class definition with methods and properties.
 */
export interface ClassInfo {
    name: string;
    extends?: string;
    implements?: string[];
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    lineNumber: number;
    isExported: boolean;
}
/**
 * Interface definition for type analysis.
 */
export interface InterfaceInfo {
    name: string;
    extends?: string[];
    properties: PropertyInfo[];
    methods: FunctionInfo[];
    lineNumber: number;
}
/**
 * Type alias or type definition information.
 */
export interface TypeInfo {
    name: string;
    definition: string;
    lineNumber: number;
}
/**
 * Variable declaration information with type and value.
 */
export interface VariableInfo {
    name: string;
    type?: string;
    value?: string;
    isConst: boolean;
    lineNumber: number;
}
/**
 * Symbol information extracted from code analysis.
 */
export interface SymbolInfo {
    name: string;
    kind: vscode.SymbolKind;
    type?: string;
    location: vscode.Location;
    documentation?: string;
}
/**
 * Scope information for variable visibility analysis.
 */
export interface ScopeInfo {
    type: 'global' | 'class' | 'function' | 'block';
    name?: string;
    variables: Map<string, TypeInfo>;
    parent?: ScopeInfo;
    lineRange: {
        start: number;
        end: number;
    };
}
/**
 * File dependency information for import analysis.
 */
export interface DependencyInfo {
    filePath: string;
    symbols: string[];
    isExternal: boolean;
}
/**
 * Related code block with similarity scoring.
 */
export interface RelatedCodeBlock {
    code: string;
    filePath: string;
    similarity: number;
    context: string;
}
/**
 * Edit history tracking for context relevance.
 */
export interface EditHistory {
    timestamp: number;
    file: string;
    changes: string;
}
/**
 * Detected user intent from cursor position and context.
 */
export interface CursorIntent {
    type: 'function_call' | 'variable_declaration' | 'class_method' | 'import' | 'comment_to_code' | 'type_annotation' | 'unknown';
    confidence: number;
    suggestedContext: string[];
    detectedPatterns: string[];
}
/**
 * Project configuration and metadata.
 */
export interface ProjectConfig {
    hasTypeScript: boolean;
    hasJavaScript: boolean;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
    framework?: string;
    dependencies: string[];
}
/**
 * Coding pattern detected in the codebase.
 */
export interface CodingPattern {
    pattern: string;
    frequency: number;
    examples: string[];
}
/**
 * Style guide configuration for code formatting.
 */
export interface StyleGuide {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quotes: 'single' | 'double';
    semicolons: boolean;
    trailingComma: boolean;
}
/**
 * Comprehensive code context with semantic information.
 * Combines basic context with enhanced semantic analysis.
 */
export interface CodeContext {
    prefix: string;
    suffix: string;
    language: string;
    filename: string;
    project: string;
    tokenCount?: number;
    imports: ImportInfo[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
    variables: VariableInfo[];
    decorators: DecoratorInfo[];
    generics: GenericInfo[];
    currentScope: ScopeInfo | null;
    symbolTable: Map<string, SymbolInfo>;
    dependencies: DependencyInfo[];
    projectConfig: ProjectConfig | null;
    codingPatterns: CodingPattern[];
    styleGuide: StyleGuide | null;
    relatedCode: RelatedCodeBlock[];
    recentEdits: EditHistory[];
    cursorIntent: CursorIntent | null;
    comments: string[];
    cursorRules?: string;
}
/**
 * Project-wide coding patterns and conventions.
 */
export interface ProjectPatterns {
    namingConventions: string[];
    codeStyle: string[];
    commonImports: string[];
    frequentPatterns: string[];
}
/**
 * Fill-in-the-Middle template configuration.
 */
export interface FIMTemplate {
    prefix: string;
    suffix: string;
    middle: string;
    eos?: string;
}
/**
 * Predefined FIM templates for different model families.
 */
export declare const FIM_TEMPLATES: Record<string, FIMTemplate>;
/**
 * Main context engine for intelligent code analysis and context gathering.
 *
 * Features:
 * - Semantic analysis of code structure
 * - Adaptive context management based on model size
 * - Project-wide pattern detection
 * - Import resolution and dependency tracking
 * - Context optimization for AI models
 */
export declare class ContextEngine {
    private maxContextLength;
    private projectPatterns;
    private semanticAnalyzer;
    private contextAnalyzer;
    private contextOptimizer;
    private stateManager;
    private contextWindowBuilder;
    private currentModelSize;
    private currentModelName;
    constructor();
    /**
     * Set current model information for adaptive context management.
     * Adjusts context window and optimization based on model capabilities.
     *
     * @param modelName - Name of the current model
     * @param parameterCount - Optional parameter count for size detection
     */
    setModelInfo(modelName: string, parameterCount?: string): void;
    /**
     * Get current model size
     */
    getModelSize(): ModelSize;
    /**
     * Set the state manager for event-based context
     */
    setStateManager(stateManager: StateManager): void;
    /**
     * Set the context window builder
     */
    setContextWindowBuilder(builder: ContextWindowBuilder): void;
    buildContext(document: vscode.TextDocument, position: vscode.Position): Promise<CodeContext>;
    private withTimeout;
    private loadCursorRules;
    private getProjectName;
    private extractImports;
    private extractFunctions;
    private extractClasses;
    private extractComments;
    private getRecentEdits;
    generatePrompt(context: CodeContext, templateId?: string): Promise<string>;
    /**
     * Build intelligent header with type context, examples, and scope information
     */
    private buildIntelligentHeader;
    /**
     * Build file metadata section
     */
    private buildFileMetadata;
    /**
     * Build type context section
     */
    private buildTypeContext;
    /**
     * Build function context section
     */
    private buildFunctionContext;
    /**
     * Build example context section
     */
    private buildExampleContext;
    /**
     * Build scope context section
     */
    private buildScopeContext;
    /**
     * Build project rules section
     */
    private buildProjectRules;
    /**
     * Build related files context section
     */
    private buildRelatedFilesContext;
    private loadProjectPatterns;
    private extractProjectPatterns;
    private analyzeFileForPatterns;
    analyzeComments(comments: string[]): {
        intent: string;
        requirements: string[];
    };
    private extractIntent;
    private extractRequirements;
    /**
     * Analyze user patterns from edit history and cursor movements
     */
    private analyzeUserPatterns;
    /**
     * Detect preferred edit type from history
     */
    private detectPreferredEditType;
    private getCommentPrefix;
    private smartTruncate;
}
//# sourceMappingURL=context-engine.d.ts.map