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
exports.TreeSitterService = void 0;
const path = __importStar(require("path"));
const web_tree_sitter_1 = require("web-tree-sitter");
const logger_1 = require("@platform/system/logger");
const native_loader_1 = require("@platform/native/native-loader");
const path_constants_1 = require("@platform/system/path-constants");
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
class TreeSitterService {
    constructor() {
        this.parsers = new Map();
        this.languages = new Map();
        this.queries = new Map();
        this.context = null;
        this.initialized = false;
        this.wasmDir = '';
        this.logger = new logger_1.Logger('TreeSitterService');
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!TreeSitterService.instance) {
            TreeSitterService.instance = new TreeSitterService();
        }
        return TreeSitterService.instance;
    }
    /**
     * Initialize Tree-sitter service
     */
    async initialize(context) {
        if (this.initialized) {
            return;
        }
        this.context = context;
        this.wasmDir = (0, path_constants_1.getResourcePath)(context.extensionUri, path_constants_1.RESOURCE_PATHS.TREE_SITTER_WASMS);
        try {
            // Initialize Tree-sitter WASM
            await web_tree_sitter_1.Parser.init();
            this.logger.info('Tree-sitter WASM initialized');
            this.initialized = true;
        }
        catch (error) {
            this.logger.error('Failed to initialize Tree-sitter:', error);
            throw error;
        }
    }
    /**
     * Check if Tree-sitter is supported for a language
     */
    isSupported(languageId) {
        // All languages with WASM files (36 total)
        const supportedLanguages = [
            // Web & JavaScript ecosystem
            'typescript', 'javascript', 'javascriptreact', 'typescriptreact',
            'tsx', 'jsx', 'vue', 'html', 'css', 'json',
            // Systems programming
            'c', 'cpp', 'rust', 'go', 'zig', 'swift', 'objectivec',
            // JVM languages
            'java', 'kotlin', 'scala',
            // .NET
            'csharp',
            // Scripting languages
            'python', 'ruby', 'php', 'lua', 'bash', 'shell',
            // Functional languages
            'elixir', 'elm', 'ocaml', 'elisp', 'rescript',
            // Data & config
            'yaml', 'toml',
            // Blockchain
            'solidity',
            // Other
            'dart', 'ql', 'systemrdl', 'tlaplus', 'embedded_template'
        ];
        return supportedLanguages.includes(languageId.toLowerCase());
    }
    /**
     * Get or create parser for a language
     */
    async getParser(languageId) {
        if (!this.initialized) {
            this.logger.warn('Tree-sitter not initialized');
            return null;
        }
        // Check cache
        if (this.parsers.has(languageId)) {
            return this.parsers.get(languageId);
        }
        try {
            // Load language grammar
            const language = await this.loadLanguage(languageId);
            if (!language) {
                return null;
            }
            // Create parser
            const parser = new web_tree_sitter_1.Parser();
            parser.setLanguage(language);
            // Cache parser
            this.parsers.set(languageId, parser);
            this.logger.info(`Created parser for ${languageId}`);
            return parser;
        }
        catch (error) {
            this.logger.error(`Failed to create parser for ${languageId}:`, error);
            return null;
        }
    }
    /**
     * Load a Tree-sitter language grammar
     */
    async loadLanguage(languageId) {
        if (this.languages.has(languageId)) {
            return this.languages.get(languageId);
        }
        try {
            // Map VS Code language IDs to WASM file names
            const languageMap = {
                // TypeScript/JavaScript
                'typescript': 'tree-sitter-typescript',
                'typescriptreact': 'tree-sitter-tsx',
                'javascript': 'tree-sitter-javascript',
                'javascriptreact': 'tree-sitter-javascript',
                'tsx': 'tree-sitter-tsx',
                'jsx': 'tree-sitter-javascript',
                // Systems
                'c': 'tree-sitter-c',
                'cpp': 'tree-sitter-cpp',
                'rust': 'tree-sitter-rust',
                'go': 'tree-sitter-go',
                'zig': 'tree-sitter-zig',
                'swift': 'tree-sitter-swift',
                'objectivec': 'tree-sitter-objc',
                // JVM
                'java': 'tree-sitter-java',
                'kotlin': 'tree-sitter-kotlin',
                'scala': 'tree-sitter-scala',
                // .NET
                'csharp': 'tree-sitter-c_sharp',
                // Scripting
                'python': 'tree-sitter-python',
                'ruby': 'tree-sitter-ruby',
                'php': 'tree-sitter-php',
                'lua': 'tree-sitter-lua',
                'bash': 'tree-sitter-bash',
                'shell': 'tree-sitter-bash',
                'sh': 'tree-sitter-bash',
                // Functional
                'elixir': 'tree-sitter-elixir',
                'elm': 'tree-sitter-elm',
                'ocaml': 'tree-sitter-ocaml',
                'elisp': 'tree-sitter-elisp',
                'rescript': 'tree-sitter-rescript',
                // Web
                'vue': 'tree-sitter-vue',
                'html': 'tree-sitter-html',
                'css': 'tree-sitter-css',
                // Data
                'json': 'tree-sitter-json',
                'yaml': 'tree-sitter-yaml',
                'toml': 'tree-sitter-toml',
                // Blockchain
                'solidity': 'tree-sitter-solidity',
                // Other
                'dart': 'tree-sitter-dart',
                'ql': 'tree-sitter-ql',
                'systemrdl': 'tree-sitter-systemrdl',
                'tlaplus': 'tree-sitter-tlaplus',
                'embedded_template': 'tree-sitter-embedded_template'
            };
            const wasmFileName = languageMap[languageId.toLowerCase()];
            if (!wasmFileName) {
                this.logger.warn(`No WASM mapping for language: ${languageId}`);
                return null;
            }
            const wasmPath = path.join(this.wasmDir, `${wasmFileName}.wasm`);
            // Load the language from WASM file
            const language = await web_tree_sitter_1.Language.load(wasmPath);
            this.languages.set(languageId, language);
            this.logger.info(`Loaded Tree-sitter grammar for ${languageId}`);
            return language;
        }
        catch (error) {
            this.logger.error(`Failed to load Tree-sitter language for ${languageId}:`, error);
            return null;
        }
    }
    /**
     * Map VS Code language IDs to Tree-sitter WASM file names
     */
    getWasmFileName(languageId) {
        const wasmMap = {
            // TypeScript/JavaScript
            'typescript': 'tree-sitter-typescript.wasm',
            'typescriptreact': 'tree-sitter-tsx.wasm',
            'javascript': 'tree-sitter-javascript.wasm',
            'javascriptreact': 'tree-sitter-javascript.wasm',
            'tsx': 'tree-sitter-tsx.wasm',
            'jsx': 'tree-sitter-javascript.wasm',
            // Systems
            'c': 'tree-sitter-c.wasm',
            'cpp': 'tree-sitter-cpp.wasm',
            'rust': 'tree-sitter-rust.wasm',
            'go': 'tree-sitter-go.wasm',
            'zig': 'tree-sitter-zig.wasm',
            'swift': 'tree-sitter-swift.wasm',
            'objectivec': 'tree-sitter-objc.wasm',
            // JVM
            'java': 'tree-sitter-java.wasm',
            'kotlin': 'tree-sitter-kotlin.wasm',
            'scala': 'tree-sitter-scala.wasm',
            // .NET
            'csharp': 'tree-sitter-c_sharp.wasm',
            // Scripting
            'python': 'tree-sitter-python.wasm',
            'ruby': 'tree-sitter-ruby.wasm',
            'php': 'tree-sitter-php.wasm',
            'lua': 'tree-sitter-lua.wasm',
            'bash': 'tree-sitter-bash.wasm',
            'shell': 'tree-sitter-bash.wasm',
            'sh': 'tree-sitter-bash.wasm',
            // Functional
            'elixir': 'tree-sitter-elixir.wasm',
            'elm': 'tree-sitter-elm.wasm',
            'ocaml': 'tree-sitter-ocaml.wasm',
            'elisp': 'tree-sitter-elisp.wasm',
            'rescript': 'tree-sitter-rescript.wasm',
            // Web
            'vue': 'tree-sitter-vue.wasm',
            'html': 'tree-sitter-html.wasm',
            'css': 'tree-sitter-css.wasm',
            // Data
            'json': 'tree-sitter-json.wasm',
            'yaml': 'tree-sitter-yaml.wasm',
            'toml': 'tree-sitter-toml.wasm',
            // Blockchain
            'solidity': 'tree-sitter-solidity.wasm',
            // Other
            'dart': 'tree-sitter-dart.wasm',
            'ql': 'tree-sitter-ql.wasm',
            'systemrdl': 'tree-sitter-systemrdl.wasm',
            'tlaplus': 'tree-sitter-tlaplus.wasm',
            'embedded_template': 'tree-sitter-embedded_template.wasm'
        };
        return wasmMap[languageId] || `tree-sitter-${languageId}.wasm`;
    }
    /**
     * Parse code to AST
     */
    /**
     * Parse code to AST (Native with WASM fallback)
     */
    async parse(code, languageId) {
        const native = native_loader_1.NativeLoader.getInstance();
        // Existing WASM implementation
        return this.parseWasm(code, languageId);
    }
    /**
     * Parse code to AST using WASM (Fallback)
     */
    async parseWasm(code, languageId) {
        const parser = await this.getParser(languageId);
        if (!parser) {
            return null;
        }
        try {
            const tree = parser.parse(code);
            return tree;
        }
        catch (error) {
            this.logger.error(`Failed to parse code for ${languageId}:`, error);
            return null;
        }
    }
    /**
     * Execute Tree-sitter query on AST
     */
    query(tree, queryString) {
        try {
            const query = tree.language.query(queryString);
            const matches = query.matches(tree.rootNode);
            return matches.map((match) => ({
                pattern: match.pattern,
                captures: match.captures.map((capture) => ({
                    name: capture.name,
                    node: capture.node
                }))
            }));
        }
        catch (error) {
            this.logger.error('Failed to execute query:', error);
            return [];
        }
    }
    /**
     * Get language-specific queries
     */
    getLanguageQueries(languageId) {
        // Check cache
        if (this.queries.has(languageId)) {
            return this.queries.get(languageId);
        }
        // Load queries from file
        const queries = this.loadQueries(languageId);
        this.queries.set(languageId, queries);
        return queries;
    }
    /**
     * Load query files for a language
     */
    loadQueries(languageId) {
        if (!this.context) {
            return {};
        }
        const queries = {};
        const queryPath = path.join(this.context.extensionPath, 'src', 'resources', 'tree-sitter-queries', languageId);
        // Try to load each query file
        const queryTypes = ['imports', 'functions', 'classes', 'decorators', 'generics', 'patternMatching'];
        for (const queryType of queryTypes) {
            try {
                const fs = require('fs');
                const filePath = path.join(queryPath, `${queryType}.scm`);
                if (fs.existsSync(filePath)) {
                    queries[queryType] = fs.readFileSync(filePath, 'utf8');
                }
            }
            catch (error) {
                // Query file doesn't exist, skip
            }
        }
        return queries;
    }
    /**
     * Clear parser cache (for memory management)
     */
    clearCache() {
        this.parsers.clear();
        this.logger.info('Parser cache cleared');
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            parsers: this.parsers.size,
            languages: this.languages.size,
            queries: this.queries.size
        };
    }
    /**
     * Dispose of all parsers
     */
    dispose() {
        this.parsers.clear();
        this.languages.clear();
        this.queries.clear();
        this.initialized = false;
        this.logger.info('Tree-sitter service disposed');
    }
}
exports.TreeSitterService = TreeSitterService;
//# sourceMappingURL=tree-sitter-service.js.map