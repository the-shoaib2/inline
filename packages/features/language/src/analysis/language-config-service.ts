import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

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
export class LanguageConfigService {
    private static instance: LanguageConfigService;
    private patterns: Map<string, LanguagePatterns> = new Map();
    private extensionMap: Map<string, string> = new Map();
    private regexCache: Map<string, RegExp> = new Map();
    private fallbackPatterns: LanguagePatterns | null = null;
    private context: vscode.ExtensionContext | null = null;
    private initialized = false;

    private constructor() {}

    /**
     * Get singleton instance of LanguageConfigService.
     * @returns Service instance
     */
    public static getInstance(): LanguageConfigService {
        if (!LanguageConfigService.instance) {
            LanguageConfigService.instance = new LanguageConfigService();
        }
        return LanguageConfigService.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.loadPatterns();
        this.initialized = true;

        // Watch for changes (development only usually, but good for dynamic updates)
        const configPath = path.join(context.extensionPath, 'src', 'resources', 'languages.json');
        if (fs.existsSync(configPath)) {
            // Simple polling or just reload on extension restart.
            // fs.watch might be too aggressive or platform dependent.
            // For now, load once.
        }
    }

    private loadPatterns(): void {
        if (!this.context) {
            // console.warn('[LanguageConfigService] Context not set, cannot load patterns');
            return;
        }

        try {
            const configPath = path.join(this.context.extensionPath, 'src', 'resources', 'languages.json');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf8');
                const config = JSON.parse(content);

                for (const [lang, patterns] of Object.entries(config)) {
                    // Handle special keys
                    if (lang === '_fallback') {
                        this.fallbackPatterns = patterns as LanguagePatterns;
                        continue;
                    }
                    if (lang === '_extensions') {
                        // Load extension mappings
                        const extensions = patterns as Record<string, string>;
                        for (const [ext, langId] of Object.entries(extensions)) {
                            this.extensionMap.set(ext.toLowerCase(), langId);
                        }
                        continue;
                    }

                    this.patterns.set(lang, patterns as LanguagePatterns);
                }
                // console.log(`[LanguageConfigService] Loaded patterns for ${this.patterns.size} languages`);
                // console.log(`[LanguageConfigService] Loaded ${this.extensionMap.size} extension mappings`);
            } else {
                // console.warn(`[LanguageConfigService] Config file not found at ${configPath}`);
            }
        } catch (error) {
            console.error(`[LanguageConfigService] Failed to load patterns: ${error}`);
        }
    }

    /**
     * Get patterns for a language, with fallback support.
     * @param languageId VS Code language ID
     * @returns Language patterns or fallback patterns if not found
     */
    public getPatterns(languageId: string): LanguagePatterns | undefined {
        const patterns = this.patterns.get(languageId);
        if (patterns) {
            return patterns;
        }

        // Try fallback patterns for unknown languages
        if (this.fallbackPatterns) {
            // console.log(`[LanguageConfigService] Using fallback patterns for ${languageId}`);
            return this.fallbackPatterns;
        }

        return undefined;
    }

    /**
     * Get language ID from file extension.
     * @param extension File extension (with or without leading dot)
     * @returns Language ID or undefined if not found
     */
    public getLanguageFromExtension(extension: string): string | undefined {
        const ext = extension.startsWith('.') ? extension.substring(1) : extension;
        return this.extensionMap.get(ext.toLowerCase());
    }

    /**
     * Detect language from file path.
     * @param filePath Absolute or relative file path
     * @returns Language ID or undefined
     */
    public detectLanguage(filePath: string): string | undefined {
        const ext = path.extname(filePath);
        if (ext) {
            return this.getLanguageFromExtension(ext);
        }
        return undefined;
    }

    /**
     * Get compiled regex pattern with caching for performance.
     * @param pattern Regex pattern string
     * @param flags Regex flags (default: 'gm')
     * @returns Compiled RegExp object
     */
    public getCompiledRegex(pattern: string, flags: string = 'gm'): RegExp {
        const cacheKey = `${pattern}::${flags}`;
        
        if (!this.regexCache.has(cacheKey)) {
            try {
                this.regexCache.set(cacheKey, new RegExp(pattern, flags));
            } catch (error) {
                console.error(`[LanguageConfigService] Invalid regex pattern: ${pattern}`, error);
                // Return a regex that never matches
                return /(?!)/;
            }
        }
        
        return this.regexCache.get(cacheKey)!;
    }

    /**
     * Get comment prefix for a language.
     * @param languageId VS Code language ID
     * @returns Comment prefix string
     */
    public getCommentPrefix(languageId: string): string {
        const patterns = this.getPatterns(languageId);
        return patterns?.commentPrefix || '//';
    }

    /**
     * Check if a language is supported (has explicit patterns).
     * @param languageId VS Code language ID
     * @returns True if language has explicit patterns
     */
    public isLanguageSupported(languageId: string): boolean {
        return this.patterns.has(languageId);
    }

    /**
     * Get all supported language IDs.
     * @returns Array of language IDs
     */
    public getSupportedLanguages(): string[] {
        return Array.from(this.patterns.keys());
    }

    /**
     * Clear regex cache (useful for memory management).
     */
    public clearRegexCache(): void {
        this.regexCache.clear();
    }

    /**
     * Check if Tree-sitter is enabled for a language
     */
    public isTreeSitterEnabled(languageId: string): boolean {
        const patterns = this.getPatterns(languageId);
        return patterns?.treeSitter?.enabled ?? false;
    }

    /**
     * Get Tree-sitter configuration for a language
     */
    public getTreeSitterConfig(languageId: string): TreeSitterConfig | undefined {
        return this.getPatterns(languageId)?.treeSitter;
    }

    /**
     * Get cache statistics for monitoring.
     */
    public getCacheStats(): { patterns: number; extensions: number; regexCache: number } {
        return {
            patterns: this.patterns.size,
            extensions: this.extensionMap.size,
            regexCache: this.regexCache.size
        };
    }
}

