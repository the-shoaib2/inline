
import * as vscode from 'vscode';

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
    lineRange: { start: number; end: number };
}

/**
 * File dependency information for import analysis.
 */
export interface DependencyInfo {
    filePath: string;
    symbols: string[];
    imports: ImportInfo[];
    isExternal: boolean;
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
 * Related code block with similarity scoring.
 */
export interface RelatedCodeBlock {
    code: string;
    filePath: string;
    similarity: number;
    context: string;
}

/**
 * Decorator information extracted from code
 */
export interface DecoratorInfo {
    name: string;
    arguments?: string;
    lineNumber: number;
    target?: 'class' | 'method' | 'property' | 'parameter';
}

/**
 * Generic type parameter information
 */
export interface GenericInfo {
    name: string;
    constraint?: string;
    defaultType?: string;
    lineNumber: number;
}

/**
 * Comprehensive code context with semantic information.
 * Combines basic context with enhanced semantic analysis.
 */
export interface CodeContext {
    // Basic context (existing)
    prefix: string;
    suffix: string;
    language: string;
    filename: string;
    project: string;
    tokenCount?: number;

    // Enhanced semantic context
    imports: ImportInfo[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
    variables: VariableInfo[];

    // NEW: Tree-sitter enhanced features
    decorators: DecoratorInfo[];
    generics: GenericInfo[];

    // Scope and symbol information
    currentScope: ScopeInfo | null;
    symbolTable: Map<string, SymbolInfo>;
    dependencies: DependencyInfo[];

    // Project-wide context
    projectConfig: ProjectConfig | null;
    codingPatterns: CodingPattern[];
    styleGuide: StyleGuide | null;

    // Intelligent context
    relatedCode: RelatedCodeBlock[];
    recentEdits: EditHistory[];
    cursorIntent: CursorIntent | null;

    // Legacy fields
    comments: string[];
    cursorRules?: string;
}
