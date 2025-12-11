import * as vscode from 'vscode';
import * as path from 'path';
import { Parser, Language, Tree } from 'web-tree-sitter';
import { Logger } from '@platform/system/logger';
import { NativeLoader } from '@platform/native/native-loader';
import { RESOURCE_PATHS, getResourcePath } from '@platform/system/path-constants';

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
export class TreeSitterService {
    private static instance: TreeSitterService;
    private parsers: Map<string, Parser> = new Map();
    private languages: Map<string, Language> = new Map();
    private queries: Map<string, LanguageQueries> = new Map();
    private logger: Logger;
    private context: vscode.ExtensionContext | null = null;
    private initialized = false;
    private wasmDir: string = '';

    private constructor() {
        this.logger = new Logger('TreeSitterService');
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): TreeSitterService {
        if (!TreeSitterService.instance) {
            TreeSitterService.instance = new TreeSitterService();
        }
        return TreeSitterService.instance;
    }

    /**
     * Initialize Tree-sitter service
     */
    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.context = context;
        this.wasmDir = getResourcePath(context.extensionUri, RESOURCE_PATHS.TREE_SITTER_WASMS);
        
        try {
            // Initialize Tree-sitter WASM
            await Parser.init();
            this.logger.info('Tree-sitter WASM initialized');
            this.initialized = true;
        } catch (error) {
            this.logger.error('Failed to initialize Tree-sitter:', error as Error);
            throw error;
        }
    }

    /**
     * Check if Tree-sitter is supported for a language
     */
    public isSupported(languageId: string): boolean {
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
    public async getParser(languageId: string): Promise<Parser | null> {
        if (!this.initialized) {
            this.logger.warn('Tree-sitter not initialized');
            return null;
        }

        // Check cache
        if (this.parsers.has(languageId)) {
            return this.parsers.get(languageId)!;
        }

        try {
            // Load language grammar
            const language = await this.loadLanguage(languageId);
            if (!language) {
                return null;
            }

            // Create parser
            const parser = new Parser();
            parser.setLanguage(language);

            // Cache parser
            this.parsers.set(languageId, parser);
            this.logger.info(`Created parser for ${languageId}`);

            return parser;
        } catch (error) {
            this.logger.error(`Failed to create parser for ${languageId}:`, error as Error);
            return null;
        }
    }

    /**
     * Load a Tree-sitter language grammar
     */
    private async loadLanguage(languageId: string): Promise<Language | null> {
        if (this.languages.has(languageId)) {
            return this.languages.get(languageId)!;
        }

        try {
            // Map VS Code language IDs to WASM file names
            const languageMap: Record<string, string> = {
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
            const language = await Language.load(wasmPath);
            this.languages.set(languageId, language);
            
            this.logger.info(`Loaded Tree-sitter grammar for ${languageId}`);
            return language;
        } catch (error) {
            this.logger.error(`Failed to load Tree-sitter language for ${languageId}:`, error as Error);
            return null;
        }
    }
    /**
     * Map VS Code language IDs to Tree-sitter WASM file names
     */
    private getWasmFileName(languageId: string): string {
        const wasmMap: Record<string, string> = {
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
    public async parse(code: string, languageId: string): Promise<Tree | null> {
        const native = NativeLoader.getInstance();
        
        if (native.isAvailable()) {
            try {
                // Determine if we can use native parsing
                // Note: Native parser returns a different structure, so we might need adapter
                // For now, we follow the interface and assume compatibility or handle fallback
                const result = await native.parseAst(code, languageId);
                if (result) {
                     return result;
                }
            } catch (error) {
                this.logger.warn('Native parse failed, using WASM fallback', error);
            }
        }
        
        // Existing WASM implementation
        return this.parseWasm(code, languageId);
    }

    /**
     * Parse code to AST using WASM (Fallback)
     */
    public async parseWasm(code: string, languageId: string): Promise<Tree | null> {
        const parser = await this.getParser(languageId);
        if (!parser) {
            return null;
        }

        try {
            const tree = parser.parse(code);
            return tree;
        } catch (error) {
            this.logger.error(`Failed to parse code for ${languageId}:`, error as Error);
            return null;
        }
    }

    /**
     * Execute Tree-sitter query on AST
     */
    public query(tree: Tree, queryString: string): QueryMatch[] {
        try {
            const query = tree.language.query(queryString);
            const matches = query.matches(tree.rootNode);

            return matches.map((match: any) => ({
                pattern: match.pattern,
                captures: match.captures.map((capture: any) => ({
                    name: capture.name,
                    node: capture.node
                }))
            }));
        } catch (error) {
            this.logger.error('Failed to execute query:', error as Error);
            return [];
        }
    }

    /**
     * Get language-specific queries
     */
    public getLanguageQueries(languageId: string): LanguageQueries {
        // Check cache
        if (this.queries.has(languageId)) {
            return this.queries.get(languageId)!;
        }

        // Load queries from file
        const queries = this.loadQueries(languageId);
        this.queries.set(languageId, queries);
        return queries;
    }

    /**
     * Load query files for a language
     */
    private loadQueries(languageId: string): LanguageQueries {
        if (!this.context) {
            return {};
        }

        const queries: LanguageQueries = {};
        const queryPath = path.join(
            this.context.extensionPath,
            'src',
            'resources',
            'tree-sitter-queries',
            languageId
        );

        // Try to load each query file
        const queryTypes = ['imports', 'functions', 'classes', 'decorators', 'generics', 'patternMatching'];
        
        for (const queryType of queryTypes) {
            try {
                const fs = require('fs');
                const filePath = path.join(queryPath, `${queryType}.scm`);
                
                if (fs.existsSync(filePath)) {
                    queries[queryType as keyof LanguageQueries] = fs.readFileSync(filePath, 'utf8');
                }
            } catch (error) {
                // Query file doesn't exist, skip
            }
        }

        return queries;
    }

    /**
     * Clear parser cache (for memory management)
     */
    public clearCache(): void {
        this.parsers.clear();
        this.logger.info('Parser cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { parsers: number; languages: number; queries: number } {
        return {
            parsers: this.parsers.size,
            languages: this.languages.size,
            queries: this.queries.size
        };
    }

    /**
     * Dispose of all parsers
     */
    public dispose(): void {
        this.parsers.clear();
        this.languages.clear();
        this.queries.clear();
        this.initialized = false;
        this.logger.info('Tree-sitter service disposed');
    }
}
