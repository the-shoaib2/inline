/**
 * Semantic analyzer for type-aware code analysis.
 *
 * Provides language-specific extraction of:
 * - Import statements with module resolution
 * - Function signatures with type information
 * - Class definitions and inheritance
 * - Interface definitions
 * - Type aliases and declarations
 * - Variable declarations with type inference
 *
 * Uses language-specific regex patterns from LanguageConfigService.
 */
import * as vscode from 'vscode';
import { ImportInfo, FunctionInfo, ClassInfo, InterfaceInfo, TypeInfo, VariableInfo, SymbolInfo, ScopeInfo, CursorIntent, ProjectConfig, StyleGuide, EditHistory, DecoratorInfo, GenericInfo } from '@inline/shared';
/**
 * Performs semantic analysis on code documents.
 * Extracts structural information for context building.
 */
export declare class SemanticAnalyzer {
    private treeSitterService;
    constructor();
    /**
     * Extract all import statements with detailed metadata.
     * Handles named, default, and namespace imports.
     * Supports JavaScript, TypeScript, and Python.
     *
     * @param document VS Code document to analyze
     * @returns Array of import information with module and line number
     */
    extractImportsEnhanced(document: vscode.TextDocument): Promise<ImportInfo[]>;
    /**
     * Extract detailed function information with parameters and types
     */
    extractFunctionsEnhanced(document: vscode.TextDocument): Promise<FunctionInfo[]>;
    /**
     * Extract detailed class information with methods and properties
     */
    extractClassesEnhanced(document: vscode.TextDocument): Promise<ClassInfo[]>;
    /**
     * Extract TypeScript/Java interfaces
     */
    extractInterfacesEnhanced(document: vscode.TextDocument): Promise<InterfaceInfo[]>;
    /**
     * Extract type definitions
     */
    extractTypesEnhanced(document: vscode.TextDocument): Promise<TypeInfo[]>;
    /**
     * Extract variable declarations with types
     */
    extractVariablesEnhanced(document: vscode.TextDocument): Promise<VariableInfo[]>;
    /**
     * Parse function parameters
     */
    private parseParameters;
    /**
     * Build symbol table using VS Code's symbol provider
     */
    buildSymbolTable(document: vscode.TextDocument): Promise<Map<string, SymbolInfo>>;
    private processSymbols;
    /**
     * Detect cursor intent based on context
     */
    detectCursorIntent(document: vscode.TextDocument, position: vscode.Position, prefix: string, suffix: string): CursorIntent | null;
    /**
     * Analyze current scope
     */
    analyzeCurrentScope(document: vscode.TextDocument, position: vscode.Position, functions: FunctionInfo[], classes: ClassInfo[]): ScopeInfo | null;
    /**
     * Get project configuration
     */
    getProjectConfig(uri: vscode.Uri): Promise<ProjectConfig | null>;
    /**
     * Detect coding style guide
     */
    detectStyleGuide(text: string): StyleGuide | null;
    /**
     * Get enhanced recent edits with history
     */
    getRecentEditsEnhanced(currentUri: vscode.Uri): Promise<EditHistory[]>;
    /**
     * Extract decorators using Tree-sitter (NEW CAPABILITY)
     *
     * Accurately detects decorators in TypeScript and Python:
     * - TypeScript: @Component, @Injectable, @Input(), etc.
     * - Python: @property, @staticmethod, @app.route('/path'), etc.
     *
     * This was impossible with regex due to complex syntax variations.
     */
    extractDecorators(document: vscode.TextDocument): Promise<DecoratorInfo[]>;
    /**
     * Extract generic type parameters using Tree-sitter (NEW CAPABILITY)
     *
     * Accurately detects generics in TypeScript:
     * - Function generics: <T extends Base>
     * - Class generics: class Foo<T, U>
     * - Type generics: Array<string>, Map<K, V>
     *
     * This was impossible with regex due to nested brackets and complex constraints.
     */
    extractGenerics(document: vscode.TextDocument): Promise<GenericInfo[]>;
}
//# sourceMappingURL=semantic-analyzer.d.ts.map