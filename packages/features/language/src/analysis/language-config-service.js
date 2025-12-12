"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageConfigService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
class LanguageConfigService {
    constructor() {
        this.patterns = new Map();
        this.extensionMap = new Map();
        this.regexCache = new Map();
        this.fallbackPatterns = null;
        this.context = null;
        this.initialized = false;
    }
    /**
     * Get singleton instance of LanguageConfigService.
     * @returns Service instance
     */
    static getInstance() {
        if (!LanguageConfigService.instance) {
            LanguageConfigService.instance = new LanguageConfigService();
        }
        return LanguageConfigService.instance;
    }
    initialize(context) {
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
    loadPatterns() {
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
                        this.fallbackPatterns = patterns;
                        continue;
                    }
                    if (lang === '_extensions') {
                        // Load extension mappings
                        const extensions = patterns;
                        for (const [ext, langId] of Object.entries(extensions)) {
                            this.extensionMap.set(ext.toLowerCase(), langId);
                        }
                        continue;
                    }
                    this.patterns.set(lang, patterns);
                }
                // console.log(`[LanguageConfigService] Loaded patterns for ${this.patterns.size} languages`);
                // console.log(`[LanguageConfigService] Loaded ${this.extensionMap.size} extension mappings`);
            }
            else {
                // console.warn(`[LanguageConfigService] Config file not found at ${configPath}`);
            }
        }
        catch (error) {
            console.error(`[LanguageConfigService] Failed to load patterns: ${error}`);
        }
    }
    /**
     * Get patterns for a language, with fallback support.
     * @param languageId VS Code language ID
     * @returns Language patterns or fallback patterns if not found
     */
    getPatterns(languageId) {
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
    getLanguageFromExtension(extension) {
        const ext = extension.startsWith('.') ? extension.substring(1) : extension;
        return this.extensionMap.get(ext.toLowerCase());
    }
    /**
     * Detect language from file path.
     * @param filePath Absolute or relative file path
     * @returns Language ID or undefined
     */
    detectLanguage(filePath) {
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
    getCompiledRegex(pattern, flags = 'gm') {
        const cacheKey = `${pattern}::${flags}`;
        if (!this.regexCache.has(cacheKey)) {
            try {
                this.regexCache.set(cacheKey, new RegExp(pattern, flags));
            }
            catch (error) {
                console.error(`[LanguageConfigService] Invalid regex pattern: ${pattern}`, error);
                // Return a regex that never matches
                return /(?!)/;
            }
        }
        return this.regexCache.get(cacheKey);
    }
    /**
     * Get comment prefix for a language.
     * @param languageId VS Code language ID
     * @returns Comment prefix string
     */
    getCommentPrefix(languageId) {
        const patterns = this.getPatterns(languageId);
        return patterns?.commentPrefix || '//';
    }
    /**
     * Check if a language is supported (has explicit patterns).
     * @param languageId VS Code language ID
     * @returns True if language has explicit patterns
     */
    isLanguageSupported(languageId) {
        return this.patterns.has(languageId);
    }
    /**
     * Get all supported language IDs.
     * @returns Array of language IDs
     */
    getSupportedLanguages() {
        return Array.from(this.patterns.keys());
    }
    /**
     * Clear regex cache (useful for memory management).
     */
    clearRegexCache() {
        this.regexCache.clear();
    }
    /**
     * Check if Tree-sitter is enabled for a language
     */
    isTreeSitterEnabled(languageId) {
        const patterns = this.getPatterns(languageId);
        return patterns?.treeSitter?.enabled ?? false;
    }
    /**
     * Get Tree-sitter configuration for a language
     */
    getTreeSitterConfig(languageId) {
        return this.getPatterns(languageId)?.treeSitter;
    }
    /**
     * Get cache statistics for monitoring.
     */
    getCacheStats() {
        return {
            patterns: this.patterns.size,
            extensions: this.extensionMap.size,
            regexCache: this.regexCache.size
        };
    }
}
exports.LanguageConfigService = LanguageConfigService;
//# sourceMappingURL=language-config-service.js.map