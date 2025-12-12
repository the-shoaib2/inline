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
    imports: ImportInfo[];
}
//# sourceMappingURL=code-analysis.d.ts.map