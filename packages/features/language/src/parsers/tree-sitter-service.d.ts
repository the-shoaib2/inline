import * as vscode from 'vscode';
import { Parser, Tree } from 'web-tree-sitter';
/**
 * Tree-sitter query match result
 */
export interface QueryMatch {
    pattern: number;
    captures: QueryCapture[];
}
/**
 * Tree-sitter query capture
 */
export interface QueryCapture {
    name: string;
    node: any;
}
/**
 * Language-specific Tree-sitter queries
 */
export interface LanguageQueries {
    imports?: string;
    functions?: string;
    classes?: string;
    decorators?: string;
    generics?: string;
    patternMatching?: string;
}
/**
 * Tree-sitter configuration for a language
 */
export interface TreeSitterConfig {
    enabled: boolean;
    grammar: string;
    queryPath?: string;
}
/**
 * Service for managing Tree-sitter parsers and AST parsing.
 *
 * Features:
 * - Lazy loading of language parsers
 * - Parser caching for performance
 * - Query execution for pattern matching
 * - Memory management
 *
 * Uses WebAssembly bindings to avoid NODE_MODULE_VERSION issues.
 */
export declare class TreeSitterService {
    private static instance;
    private parsers;
    private languages;
    private queries;
    private logger;
    private context;
    private initialized;
    private wasmDir;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): TreeSitterService;
    /**
     * Initialize Tree-sitter service
     */
    initialize(context: vscode.ExtensionContext): Promise<void>;
    /**
     * Check if Tree-sitter is supported for a language
     */
    isSupported(languageId: string): boolean;
    /**
     * Get or create parser for a language
     */
    getParser(languageId: string): Promise<Parser | null>;
    /**
     * Load a Tree-sitter language grammar
     */
    private loadLanguage;
    /**
     * Map VS Code language IDs to Tree-sitter WASM file names
     */
    private getWasmFileName;
    /**
     * Parse code to AST
     */
    /**
     * Parse code to AST (Native with WASM fallback)
     */
    parse(code: string, languageId: string): Promise<Tree | null>;
    /**
     * Parse code to AST using WASM (Fallback)
     */
    parseWasm(code: string, languageId: string): Promise<Tree | null>;
    /**
     * Execute Tree-sitter query on AST
     */
    query(tree: Tree, queryString: string): QueryMatch[];
    /**
     * Get language-specific queries
     */
    getLanguageQueries(languageId: string): LanguageQueries;
    /**
     * Load query files for a language
     */
    private loadQueries;
    /**
     * Clear parser cache (for memory management)
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        parsers: number;
        languages: number;
        queries: number;
    };
    /**
     * Dispose of all parsers
     */
    dispose(): void;
}
//# sourceMappingURL=tree-sitter-service.d.ts.map