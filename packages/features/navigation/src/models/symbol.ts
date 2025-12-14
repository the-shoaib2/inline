import * as vscode from 'vscode';

/**
 * Symbol kind enumeration
 */
export enum SymbolKind {
    Function = 'function',
    Class = 'class',
    Interface = 'interface',
    Variable = 'variable',
    Constant = 'constant',
    Method = 'method',
    Property = 'property',
    Parameter = 'parameter',
    TypeAlias = 'typeAlias',
    Enum = 'enum',
    EnumMember = 'enumMember',
    Module = 'module',
    Namespace = 'namespace',
}

/**
 * Scope type enumeration
 */
export enum ScopeType {
    Global = 'global',
    Module = 'module',
    Class = 'class',
    Function = 'function',
    Block = 'block',
}

/**
 * Symbol location information
 */
export interface SymbolLocation {
    uri: vscode.Uri;
    range: vscode.Range;
    selectionRange?: vscode.Range;
}

/**
 * Import/Export information
 */
export interface ImportInfo {
    source: string;
    imported: string;
    local: string;
    location: SymbolLocation;
}

export interface ExportInfo {
    exported: string;
    local: string;
    location: SymbolLocation;
}

/**
 * Scope information
 */
export interface Scope {
    type: ScopeType;
    range: vscode.Range;
    parent?: Scope;
    symbols: Map<string, Symbol>;
    children: Scope[];
}

/**
 * Symbol reference
 */
export interface SymbolReference {
    location: SymbolLocation;
    isDefinition: boolean;
    isWrite: boolean;
    context: string; // Surrounding code snippet
}

/**
 * Symbol information
 */
export interface Symbol {
    name: string;
    kind: SymbolKind;
    location: SymbolLocation;
    scope: Scope;
    definition: vscode.Range;
    references: SymbolReference[];
    imports?: ImportInfo[];
    exports?: ExportInfo[];
    documentation?: string;
    type?: string;
}

/**
 * Symbol index entry
 */
export interface SymbolIndexEntry {
    symbol: Symbol;
    lastModified: number;
    fileUri: vscode.Uri;
}

/**
 * Workspace symbol index
 */
export interface WorkspaceSymbolIndex {
    symbols: Map<string, SymbolIndexEntry[]>;
    fileIndex: Map<string, Symbol[]>;
    lastIndexTime: number;
}

/**
 * Reference search options
 */
export interface ReferenceSearchOptions {
    includeDeclaration: boolean;
    scope?: 'workspace' | 'file' | 'folder';
    maxResults?: number;
}

/**
 * Rename validation result
 */
export interface RenameValidation {
    valid: boolean;
    message?: string;
    conflicts?: SymbolLocation[];
}
