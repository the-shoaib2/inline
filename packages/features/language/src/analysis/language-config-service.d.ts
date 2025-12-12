import * as vscode from 'vscode';
/**
 * Tree-sitter configuration for a language
 */
export interface TreeSitterConfig {
    enabled: boolean;
    grammar: string;
    queryPath?: string;
}
/**
 * Language-specific patterns for code analysis.
 */
export interface LanguagePatterns {
    imports: string[];
    functions: string[];
    classes: string[];
    interfaces?: string[];
    types?: string[];
    variables?: string[];
    comments: string[];
    commentPrefix?: string;
    treeSitter?: TreeSitterConfig;
}
/**
 * Manages language-specific configuration and patterns.
 *
 * Responsibilities:
 * - Load language patterns from configuration files
 * - Provide singleton access to language configs
 * - Support dynamic pattern updates
 * - Handle initialization and error cases
 * - Map file extensions to language IDs
 * - Provide fallback patterns for unknown languages
 * - Cache compiled regex patterns for performance
 *
 * Used by context engine and semantic analyzer.
 */
export declare class LanguageConfigService {
    private static instance;
    private patterns;
    private extensionMap;
    private regexCache;
    private fallbackPatterns;
    private context;
    private initialized;
    private constructor();
    /**
     * Get singleton instance of LanguageConfigService.
     * @returns Service instance
     */
    static getInstance(): LanguageConfigService;
    initialize(context: vscode.ExtensionContext): void;
    private loadPatterns;
    /**
     * Get patterns for a language, with fallback support.
     * @param languageId VS Code language ID
     * @returns Language patterns or fallback patterns if not found
     */
    getPatterns(languageId: string): LanguagePatterns | undefined;
    /**
     * Get language ID from file extension.
     * @param extension File extension (with or without leading dot)
     * @returns Language ID or undefined if not found
     */
    getLanguageFromExtension(extension: string): string | undefined;
    /**
     * Detect language from file path.
     * @param filePath Absolute or relative file path
     * @returns Language ID or undefined
     */
    detectLanguage(filePath: string): string | undefined;
    /**
     * Get compiled regex pattern with caching for performance.
     * @param pattern Regex pattern string
     * @param flags Regex flags (default: 'gm')
     * @returns Compiled RegExp object
     */
    getCompiledRegex(pattern: string, flags?: string): RegExp;
    /**
     * Get comment prefix for a language.
     * @param languageId VS Code language ID
     * @returns Comment prefix string
     */
    getCommentPrefix(languageId: string): string;
    /**
     * Check if a language is supported (has explicit patterns).
     * @param languageId VS Code language ID
     * @returns True if language has explicit patterns
     */
    isLanguageSupported(languageId: string): boolean;
    /**
     * Get all supported language IDs.
     * @returns Array of language IDs
     */
    getSupportedLanguages(): string[];
    /**
     * Clear regex cache (useful for memory management).
     */
    clearRegexCache(): void;
    /**
     * Check if Tree-sitter is enabled for a language
     */
    isTreeSitterEnabled(languageId: string): boolean;
    /**
     * Get Tree-sitter configuration for a language
     */
    getTreeSitterConfig(languageId: string): TreeSitterConfig | undefined;
    /**
     * Get cache statistics for monitoring.
     */
    getCacheStats(): {
        patterns: number;
        extensions: number;
        regexCache: number;
    };
}
//# sourceMappingURL=language-config-service.d.ts.map