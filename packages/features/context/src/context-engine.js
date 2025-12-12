"use strict";
/**
 * Context engine for intelligent code analysis and context gathering.
 *
 * Features:
 * - Semantic analysis of code structure
 * - Import resolution and dependency tracking
 * - Function and class extraction
 * - Context optimization for AI models
 * - Adaptive context management based on model size
 */
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
exports.ContextEngine = exports.FIM_TEMPLATES = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const language_1 = require("@inline/language");
const context_analyzer_1 = require("./context-analyzer");
const context_optimizer_1 = require("./context-optimizer");
const adaptive_context_manager_1 = require("./adaptive-context-manager");
/**
 * Predefined FIM templates for different model families.
 */
exports.FIM_TEMPLATES = {
    // Standard (StarCoder, StableCode, etc.)
    'starcoder': { prefix: '<fim_prefix>', suffix: '<fim_suffix>', middle: '<fim_middle>' },
    // DeepSeek
    'deepseek': { prefix: '<｜fim begin｜>', suffix: '<｜fim hole｜>', middle: '<｜fim end｜>' },
    // CodeLlama
    'codellama': { prefix: '<PRE> ', suffix: ' <SUF> ', middle: ' <MID>' },
    // CodeGemma (Google)
    'codegemma': { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' },
    // Qwen (Alibaba) - Often follows StarCoder style but sometimes uses specialized tokens
    'qwen': { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' },
    // Yi-Coder (01.AI)
    'yi': { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' },
    // Codestral (Mistral)
    'codestral': { prefix: '[SUFFIX]', suffix: '[PREFIX]', middle: '' }, // Mistral is weird: [SUFFIX]suffix[PREFIX]prefix
    // StableCode - Uses StarCoder tokens
    'stable-code': { prefix: '<fim_prefix>', suffix: '<fim_suffix>', middle: '<fim_middle>' },
    // Fallback - Default to StarCoder/DeepSeek style (Standard for most modern GGUFs)
    // Previously defaulted to CodeLlama <PRE>, which caused hallucinations in others.
    'default': { prefix: '<|fim_prefix|>', suffix: '<|fim_suffix|>', middle: '<|fim_middle|>' }
};
/**
 * Main context engine for intelligent code analysis and context gathering.
 *
 * Features:
 * - Semantic analysis of code structure
 * - Adaptive context management based on model size
 * - Project-wide pattern detection
 * - Import resolution and dependency tracking
 * - Context optimization for AI models
 */
class ContextEngine {
    constructor() {
        this.maxContextLength = 4000;
        this.projectPatterns = new Map();
        this.stateManager = null;
        this.contextWindowBuilder = null;
        // Adaptive context support
        this.currentModelSize = adaptive_context_manager_1.ModelSize.SMALL;
        this.currentModelName = '';
        this.loadProjectPatterns();
        this.semanticAnalyzer = new language_1.SemanticAnalyzer();
        this.contextAnalyzer = new context_analyzer_1.ContextAnalyzer();
        this.contextOptimizer = new context_optimizer_1.ContextOptimizer();
    }
    /**
     * Set current model information for adaptive context management.
     * Adjusts context window and optimization based on model capabilities.
     *
     * @param modelName - Name of the current model
     * @param parameterCount - Optional parameter count for size detection
     */
    setModelInfo(modelName, parameterCount) {
        this.currentModelName = modelName;
        this.currentModelSize = adaptive_context_manager_1.AdaptiveContextManager.detectModelSize(modelName, parameterCount);
        // Update max context length based on model size
        const config = adaptive_context_manager_1.AdaptiveContextManager.getContextConfig(this.currentModelSize);
        this.maxContextLength = config.maxContextLength;
        console.log(`[ContextEngine] Model: ${modelName}, Size: ${this.currentModelSize}, MaxContext: ${this.maxContextLength}`);
    }
    /**
     * Get current model size
     */
    getModelSize() {
        return this.currentModelSize;
    }
    /**
     * Set the state manager for event-based context
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
    }
    /**
     * Set the context window builder
     */
    setContextWindowBuilder(builder) {
        this.contextWindowBuilder = builder;
    }
    async buildContext(document, position) {
        const text = document.getText();
        const offset = document.offsetAt(position);
        // 1. Dynamic Context Window (Performance Optimization)
        const fileSize = text.length;
        const isLargeFile = fileSize > 100 * 1024; // 100KB
        // Adjust context window based on file size
        const prefixLength = isLargeFile ? 1000 : Math.floor(this.maxContextLength * 0.75);
        const suffixLength = isLargeFile ? 500 : Math.floor(this.maxContextLength * 0.25);
        let prefix = text.substring(Math.max(0, offset - prefixLength), offset);
        let suffix = text.substring(offset, Math.min(text.length, offset + suffixLength));
        // Optimize context (reduce tokens)
        prefix = this.contextOptimizer.optimize(prefix, prefixLength);
        suffix = this.contextOptimizer.optimize(suffix, suffixLength);
        // Get event-based context if available
        let recentEdits = [];
        let cursorHistory = [];
        if (this.stateManager) {
            const state = this.stateManager.getState();
            const docState = state.openDocuments.get(document.uri.toString());
            if (docState) {
                // Get cursor movement patterns for current doc
                cursorHistory = state.cursorHistory
                    .filter(cursor => cursor.uri.toString() === document.uri.toString())
                    .slice(-10);
                // Analyze user patterns (currently unused but available for future enhancements)
                this.analyzeUserPatterns(docState.recentEdits, cursorHistory);
            }
            // Get recent edits from ALL other open documents
            for (const [uri, doc] of state.openDocuments) {
                if (uri !== document.uri.toString()) {
                    const docEdits = doc.recentEdits.map(edit => ({
                        timestamp: edit.timestamp,
                        file: uri, // Use URI as filename reference (simplified)
                        changes: edit.changes.map(c => c.text).join('\n')
                    }));
                    recentEdits.push(...docEdits);
                }
            }
            // Sort by timestamp (newest first) and take top 5
            recentEdits.sort((a, b) => b.timestamp - a.timestamp);
            recentEdits = recentEdits.slice(0, 5);
        }
        else {
            // Fallback to semantic analyzer
            recentEdits = await this.withTimeout(this.semanticAnalyzer.getRecentEditsEnhanced(document.uri), 50, []);
        }
        const cursorRules = await this.withTimeout(this.loadCursorRules(document.uri), 50, undefined);
        let imports = [];
        let functions = [];
        let classes = [];
        let interfaces = [];
        let types = [];
        let variables = [];
        let comments = [];
        let projectConfig = null;
        let decorators = [];
        let generics = [];
        if (!isLargeFile) {
            // Run enhanced extractions in parallel using semanticAnalyzer
            const results = await Promise.all([
                this.semanticAnalyzer.extractImportsEnhanced(document),
                this.semanticAnalyzer.extractFunctionsEnhanced(document),
                this.semanticAnalyzer.extractClassesEnhanced(document),
                this.semanticAnalyzer.extractInterfacesEnhanced(document),
                this.semanticAnalyzer.extractTypesEnhanced(document),
                this.semanticAnalyzer.extractVariablesEnhanced(document),
                Promise.resolve(this.extractComments(document)),
                this.semanticAnalyzer.getProjectConfig(document.uri),
                // NEW: Tree-sitter powered extractions
                this.semanticAnalyzer.extractDecorators(document),
                this.semanticAnalyzer.extractGenerics(document)
            ]);
            [imports, functions, classes, interfaces, types, variables, comments, projectConfig, decorators, generics] = results;
        }
        else {
            console.log(`[ContextEngine] ⚠️ Large file detected (${(text.length / 1024).toFixed(1)}KB), skipping deep analysis`);
            // Fallback to basic regex for essential items only
            imports = this.extractImports(document);
        }
        // Build symbol table using VS Code's symbol provider
        const symbolTable = await this.semanticAnalyzer.buildSymbolTable(document);
        // Detect cursor intent
        const cursorIntent = this.semanticAnalyzer.detectCursorIntent(document, position, prefix, suffix);
        // Analyze current scope
        const currentScope = this.semanticAnalyzer.analyzeCurrentScope(document, position, functions, classes);
        // Get project configuration
        projectConfig = await this.semanticAnalyzer.getProjectConfig(document.uri);
        // Detect coding patterns and style
        const styleGuide = this.semanticAnalyzer.detectStyleGuide(text);
        // Multi-file context analysis (only if enabled and not a large file)
        let dependencies = [];
        let relatedCode = [];
        let codingPatterns = [];
        const config = vscode.workspace.getConfiguration('inline');
        const enableMultiFileAnalysis = config.get('context.enableMultiFileAnalysis', true);
        if (enableMultiFileAnalysis && !isLargeFile && imports.length > 0) {
            try {
                // Build dependency graph
                dependencies = await this.withTimeout(this.contextAnalyzer.buildDependencyGraph(document.uri, imports), 100, []);
                // Find similar code (based on cursor intent)
                if (cursorIntent && cursorIntent.type === 'comment_to_code') {
                    const codeContext = prefix.substring(Math.max(0, prefix.length - 200));
                    relatedCode = await this.withTimeout(this.contextAnalyzer.findSimilarCode(codeContext, document.languageId, vscode.workspace.getWorkspaceFolder(document.uri)), 150, []);
                }
                // Detect coding patterns (cache for project)
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                if (workspaceFolder && !this.projectPatterns.has(workspaceFolder.name)) {
                    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'), '**/node_modules/**', 50);
                    codingPatterns = await this.withTimeout(this.contextAnalyzer.detectCodingPatterns(files), 200, []);
                }
            }
            catch (error) {
                console.warn('[ContextEngine] Multi-file analysis failed:', error);
            }
        }
        const context = {
            // Basic context
            prefix,
            suffix,
            language: document.languageId,
            filename: path.basename(document.uri.fsPath),
            project: this.getProjectName(document.uri),
            // Enhanced semantic context
            imports: imports,
            functions: functions,
            classes: classes,
            interfaces: interfaces,
            types,
            variables,
            // NEW: Tree-sitter enhanced features
            decorators,
            generics,
            // Scope and symbol information
            currentScope,
            symbolTable,
            dependencies,
            // Project-wide context
            projectConfig,
            codingPatterns,
            styleGuide,
            // Intelligent context
            relatedCode,
            recentEdits,
            cursorIntent,
            // Legacy fields
            comments,
            cursorRules
        };
        return context;
    }
    async withTimeout(promise, ms, fallback) {
        let timer;
        const timeout = new Promise(resolve => {
            timer = setTimeout(() => resolve(fallback), ms);
        });
        return Promise.race([
            promise.then(val => { clearTimeout(timer); return val; }),
            timeout
        ]);
    }
    async loadCursorRules(uri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder)
            return undefined;
        try {
            const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.cursorrules');
            // Check if file exists
            await vscode.workspace.fs.stat(rulesUri);
            const content = await vscode.workspace.fs.readFile(rulesUri);
            return new TextDecoder().decode(content);
        }
        catch {
            // Also try .cursorrules (no dot? no, dot is standard) or .rules
            try {
                const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.rules');
                await vscode.workspace.fs.stat(rulesUri);
                const content = await vscode.workspace.fs.readFile(rulesUri);
                return new TextDecoder().decode(content);
            }
            catch {
                return undefined;
            }
        }
    }
    getProjectName(uri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return workspaceFolder ? workspaceFolder.name : 'unknown';
    }
    extractImports(document) {
        const text = document.getText();
        const imports = [];
        const patterns = language_1.LanguageConfigService.getInstance().getPatterns(document.languageId);
        if (patterns && patterns.imports) {
            for (const patternString of patterns.imports) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    const matches = text.match(regex);
                    if (matches) {
                        imports.push(...matches);
                    }
                }
                catch (e) {
                    console.error(`[ContextEngine] Invalid regex for imports: ${patternString}`, e);
                }
            }
        }
        return imports;
    }
    extractFunctions(document) {
        const text = document.getText();
        const functions = [];
        const patterns = language_1.LanguageConfigService.getInstance().getPatterns(document.languageId);
        if (patterns && patterns.functions) {
            for (const patternString of patterns.functions) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    const matches = text.match(regex);
                    if (matches) {
                        functions.push(...matches);
                    }
                }
                catch (e) {
                    console.error(`[ContextEngine] Invalid regex for functions: ${patternString}`, e);
                }
            }
        }
        return functions;
    }
    extractClasses(document) {
        const text = document.getText();
        const classes = [];
        const patterns = language_1.LanguageConfigService.getInstance().getPatterns(document.languageId);
        if (patterns && patterns.classes) {
            for (const patternString of patterns.classes) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    const matches = text.match(regex);
                    if (matches) {
                        classes.push(...matches);
                    }
                }
                catch (e) {
                    console.error(`[ContextEngine] Invalid regex for classes: ${patternString}`, e);
                }
            }
        }
        return classes;
    }
    extractComments(document) {
        const text = document.getText();
        const comments = [];
        const patterns = language_1.LanguageConfigService.getInstance().getPatterns(document.languageId);
        if (patterns && patterns.comments) {
            for (const patternString of patterns.comments) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    const matches = text.match(regex);
                    if (matches) {
                        comments.push(...matches.filter(comment => comment.trim().length > 1));
                    }
                }
                catch (e) {
                    console.error(`[ContextEngine] Invalid regex for comments: ${patternString}`, e);
                }
            }
        }
        return comments;
    }
    async getRecentEdits(currentUri) {
        const edits = [];
        // Get visible text editors (other tabs)
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() !== currentUri.toString()) {
                // Get a small chunk of relevant code (e.g., top 20 lines or around cursor)
                const text = editor.document.getText();
                // Simple heuristic: Take first 500 chars as context overlap
                if (text.length > 0) {
                    edits.push(`// File: ${path.basename(editor.document.fileName)}\n${text.substring(0, 500)}...`);
                }
            }
        }
        return edits.slice(0, 3); // Limit to top 3 files
    }
    async generatePrompt(context, templateId = 'default') {
        let template;
        // "Universal" Support: Allow user to define custom tokens
        if (templateId === 'custom') {
            const config = vscode.workspace.getConfiguration('inline');
            const customFim = config.get('fim');
            if (customFim && customFim.prefix) {
                template = customFim;
            }
            else {
                template = exports.FIM_TEMPLATES['default'];
            }
        }
        else {
            // Get FIM template based on ID or fallback to default
            template = exports.FIM_TEMPLATES[templateId] || exports.FIM_TEMPLATES['default'];
        }
        // Mistral / Codestral Special Case
        // Format: [SUFFIX]suffix[PREFIX]prefix
        if (templateId === 'codestral') {
            return `${template.prefix}${context.suffix}${template.suffix}${context.prefix}`;
        }
        const fimPrefix = template.prefix;
        const fimSuffix = template.suffix;
        const fimMiddle = template.middle;
        // Build intelligent, structured header
        const header = this.buildIntelligentHeader(context);
        // Construct FIM prompt
        return `${fimPrefix}${header}${fimSuffix}${context.suffix}${fimMiddle}`;
    }
    /**
     * Build intelligent header with type context, examples, and scope information
     */
    buildIntelligentHeader(context) {
        // Get adaptive context configuration based on model size
        const adaptiveConfig = adaptive_context_manager_1.AdaptiveContextManager.getContextConfig(this.currentModelSize);
        const commentPrefix = this.getCommentPrefix(context.language);
        // Use adaptive configuration instead of static setting
        if (!adaptiveConfig.enableVerboseHeader) {
            // Minimal header for small models
            return `${commentPrefix} File: ${context.filename}\n${commentPrefix} Language: ${context.language}\n${context.prefix}`;
        }
        let header = '';
        // === SECTION 1: File Metadata ===
        header += this.buildFileMetadata(context, commentPrefix);
        // === SECTION 2: Type Definitions ===
        if (adaptiveConfig.includeTypeDefinitions &&
            (context.cursorIntent?.type === 'type_annotation' ||
                context.cursorIntent?.type === 'variable_declaration' ||
                context.types?.length > 0 || context.interfaces?.length > 0)) {
            header += this.buildTypeContext(context, commentPrefix, adaptiveConfig.maxTypes);
        }
        // === SECTION 3: Function Signatures ===
        if (adaptiveConfig.includeFunctionSignatures &&
            (context.cursorIntent?.type === 'function_call' || context.functions?.length > 0)) {
            header += this.buildFunctionContext(context, commentPrefix, adaptiveConfig.maxFunctions);
        }
        // === SECTION 4: Similar Code Examples ===
        if (context.cursorIntent?.type === 'comment_to_code' && context.relatedCode?.length > 0) {
            header += this.buildExampleContext(context, commentPrefix);
        }
        // === SECTION 5: Scope Context ===
        if (context.currentScope && context.currentScope.type !== 'global') {
            header += this.buildScopeContext(context, commentPrefix);
        }
        // === SECTION 6: Project Rules ===
        if (adaptiveConfig.includeProjectRules && context.cursorRules && context.cursorRules.length > 0) {
            header += this.buildProjectRules(context, commentPrefix);
        }
        // === SECTION 7: Related Files Context ===
        if (adaptiveConfig.includeRelatedFiles && context.recentEdits.length > 0) {
            header += this.buildRelatedFilesContext(context, commentPrefix, adaptiveConfig.maxRelatedFiles);
        }
        // === SECTION 8: Main Code Context ===
        header += '\n' + context.prefix;
        return header;
    }
    /**
     * Build file metadata section
     */
    buildFileMetadata(context, commentPrefix) {
        let section = `${commentPrefix} ═══ FILE METADATA ═══\n`;
        section += `${commentPrefix} File: ${context.filename}\n`;
        section += `${commentPrefix} Language: ${context.language}\n`;
        if (context.projectConfig) {
            if (context.projectConfig.framework) {
                section += `${commentPrefix} Framework: ${context.projectConfig.framework}\n`;
            }
        }
        if (context.styleGuide) {
            section += `${commentPrefix} Style: ${context.styleGuide.indentation === 'spaces' ? context.styleGuide.indentSize + ' spaces' : 'tabs'}, `;
            section += `${context.styleGuide.quotes} quotes, `;
            section += `${context.styleGuide.semicolons ? 'semicolons' : 'no semicolons'}\n`;
        }
        section += '\n';
        return section;
    }
    /**
     * Build type context section
     */
    buildTypeContext(context, commentPrefix, maxTypes = 5) {
        let section = `${commentPrefix} ═══ TYPE DEFINITIONS ═══\n`;
        // Add interfaces (adaptive limit)
        const topInterfaces = context.interfaces.slice(0, Math.min(maxTypes, 3));
        if (topInterfaces.length > 0) {
            section += `${commentPrefix} Interfaces:\n`;
            topInterfaces.forEach(iface => {
                section += `interface ${iface.name}`;
                if (iface.extends && iface.extends.length > 0) {
                    section += ` extends ${iface.extends.join(', ')}`;
                }
                section += ' { ... }\n';
            });
        }
        // Add type aliases (adaptive limit)
        const topTypes = context.types.slice(0, maxTypes);
        if (topTypes.length > 0) {
            section += `${commentPrefix} Types:\n`;
            topTypes.forEach(type => {
                section += `type ${type.name} = ${type.definition.substring(0, 100)}${type.definition.length > 100 ? '...' : ''}\n`;
            });
        }
        section += '\n';
        return section;
    }
    /**
     * Build function context section
     */
    buildFunctionContext(context, commentPrefix, maxFunctions = 5) {
        let section = `${commentPrefix} ═══ AVAILABLE FUNCTIONS ═══\n`;
        // Add function signatures (adaptive limit)
        const topFunctions = context.functions.slice(0, maxFunctions);
        topFunctions.forEach(func => {
            section += `${func.isAsync ? 'async ' : ''}function ${func.name}(`;
            section += func.parameters.map(p => `${p.name}${p.optional ? '?' : ''}${p.type ? ': ' + p.type : ''}`).join(', ');
            section += `)${func.returnType ? ': ' + func.returnType : ''}\n`;
            if (func.docstring) {
                section += `${commentPrefix}   ${func.docstring.substring(0, 80)}\n`;
            }
        });
        section += '\n';
        return section;
    }
    /**
     * Build example context section
     */
    buildExampleContext(context, commentPrefix) {
        let section = `${commentPrefix} ═══ SIMILAR CODE EXAMPLES ═══\n`;
        // Add similar code (top 2)
        const topExamples = context.relatedCode.slice(0, 2);
        topExamples.forEach((example, index) => {
            section += `${commentPrefix} Example ${index + 1} (${Math.round(example.similarity * 100)}% similar):\n`;
            section += `${commentPrefix} From: ${path.basename(example.filePath)}\n`;
            // Add code snippet (limit to 10 lines)
            const lines = example.code.split('\n').slice(0, 10);
            lines.forEach(line => {
                section += `${commentPrefix} ${line}\n`;
            });
            section += '\n';
        });
        return section;
    }
    /**
     * Build scope context section
     */
    buildScopeContext(context, commentPrefix) {
        if (!context.currentScope)
            return '';
        let section = `${commentPrefix} ═══ CURRENT SCOPE ═══\n`;
        section += `${commentPrefix} Scope: ${context.currentScope.type}`;
        if (context.currentScope.name) {
            section += ` (${context.currentScope.name})`;
        }
        section += '\n';
        // Add variables in scope
        if (context.currentScope.variables.size > 0) {
            section += `${commentPrefix} Variables in scope:\n`;
            let count = 0;
            for (const [name, type] of context.currentScope.variables) {
                if (count++ >= 5)
                    break; // Limit to 5 variables
                section += `${commentPrefix}   ${name}: ${type.definition}\n`;
            }
        }
        section += '\n';
        return section;
    }
    /**
     * Build project rules section
     */
    buildProjectRules(context, commentPrefix) {
        let section = `${commentPrefix} ═══ PROJECT RULES ═══\n`;
        // Add cursor rules (limit to 500 chars)
        const rules = context.cursorRules.substring(0, 500);
        const ruleLines = rules.split('\n');
        ruleLines.forEach(line => {
            section += `${commentPrefix} ${line}\n`;
        });
        if (context.cursorRules.length > 500) {
            section += `${commentPrefix} ...\n`;
        }
        section += '\n';
        return section;
    }
    /**
     * Build related files context section
     */
    buildRelatedFilesContext(context, commentPrefix, maxRelatedFiles = 2) {
        let section = `${commentPrefix} ═══ RELATED FILES ═══\n`;
        // Add recent edits (adaptive limit)
        const topEdits = context.recentEdits.slice(0, maxRelatedFiles);
        topEdits.forEach(edit => {
            section += `${commentPrefix} From: ${path.basename(edit.file)}\n`;
            // Add snippet (limit to 5 lines)
            const lines = edit.changes.split('\n').slice(0, 5);
            lines.forEach(line => {
                section += `${commentPrefix} ${line}\n`;
            });
            section += '\n';
        });
        return section;
    }
    loadProjectPatterns() {
        // Project patterns are loaded and analyzed during workspace analysis
        // This method is called during initialization to prepare pattern detection
    }
    async extractProjectPatterns(workspaceFolder) {
        const patterns = [];
        try {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'), '**/node_modules/**', 50);
            for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    this.analyzeFileForPatterns(document, patterns);
                }
                catch (error) {
                    console.error(`Failed to analyze file ${file.fsPath}:`, error);
                }
            }
            this.projectPatterns.set(workspaceFolder.name, patterns);
        }
        catch (error) {
            console.error('Failed to extract project patterns:', error);
        }
        return patterns;
    }
    analyzeFileForPatterns(document, patterns) {
        const text = document.getText();
        const imports = this.extractImports(document);
        // Add imports to patterns
        for (const imp of imports) {
            const existing = patterns.find(p => p.pattern === imp);
            if (existing) {
                existing.frequency++;
                if (existing.examples.length < 3) {
                    existing.examples.push(imp);
                }
            }
            else {
                patterns.push({
                    pattern: imp,
                    frequency: 1,
                    examples: [imp]
                });
            }
        }
        // Add function patterns
        const functions = this.extractFunctions(document);
        for (const func of functions) {
            // Extract simplified signature as pattern
            const signature = func.split('{')[0].trim();
            const existing = patterns.find(p => p.pattern === signature);
            if (existing) {
                existing.frequency++;
            }
            else {
                patterns.push({
                    pattern: signature,
                    frequency: 1,
                    examples: [func.substring(0, 100)]
                });
            }
        }
    }
    analyzeComments(comments) {
        const intent = this.extractIntent(comments);
        const requirements = this.extractRequirements(comments);
        return { intent, requirements };
    }
    extractIntent(comments) {
        const commentText = comments.join(' ').toLowerCase();
        if (commentText.includes('create') || commentText.includes('implement')) {
            return 'create';
        }
        else if (commentText.includes('fix') || commentText.includes('bug')) {
            return 'fix';
        }
        else if (commentText.includes('refactor') || commentText.includes('improve')) {
            return 'refactor';
        }
        else if (commentText.includes('test')) {
            return 'test';
        }
        return 'complete';
    }
    extractRequirements(comments) {
        const requirements = [];
        comments.forEach(comment => {
            // Look for specific requirements in comments
            const patterns = [
                /should\s+(.+)/i,
                /must\s+(.+)/i,
                /need\s+to\s+(.+)/i,
                /require[sd]?\s+(.+)/i
            ];
            for (const pattern of patterns) {
                const match = comment.match(pattern);
                if (match) {
                    requirements.push(match[1].trim());
                }
            }
        });
        return requirements;
    }
    /**
     * Analyze user patterns from edit history and cursor movements
     */
    analyzeUserPatterns(edits, cursorHistory) {
        if (edits.length === 0 && cursorHistory.length === 0) {
            return null;
        }
        // Calculate typing speed (edits per minute)
        const recentEdits = edits.slice(-10);
        const typingSpeed = recentEdits.length > 1
            ? (recentEdits.length / ((recentEdits[recentEdits.length - 1].timestamp - recentEdits[0].timestamp) / 60000))
            : 0;
        // Detect editing style
        const hasFrequentSmallEdits = recentEdits.filter(e => {
            const edit = e;
            return edit.changes && edit.changes.length === 1 && edit.changes[0].text.length < 5;
        }).length > recentEdits.length * 0.7;
        // Detect cursor movement patterns
        const cursorJumps = cursorHistory.length > 1
            ? cursorHistory.filter((curr, i) => {
                if (i === 0)
                    return false;
                const prev = cursorHistory[i - 1];
                const currPos = curr;
                const prevPos = prev;
                const lineDiff = Math.abs(currPos.position.line - prevPos.position.line);
                return lineDiff > 5; // Jump more than 5 lines
            }).length
            : 0;
        return {
            typingSpeed: Math.round(typingSpeed),
            editingStyle: hasFrequentSmallEdits ? 'incremental' : 'bulk',
            cursorJumps,
            isActivelyEditing: recentEdits.length > 5,
            preferredEditType: this.detectPreferredEditType(recentEdits)
        };
    }
    /**
     * Detect preferred edit type from history
     */
    detectPreferredEditType(edits) {
        const types = edits.map((e) => e.type);
        const typeCounts = {};
        types.forEach((type) => {
            if (type) {
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            }
        });
        let maxType = 'unknown';
        let maxCount = 0;
        for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) {
                maxCount = count;
                maxType = type;
            }
        }
        return maxType;
    }
    getCommentPrefix(language) {
        const commentStarts = {
            'python': '#',
            'shellscript': '#',
            'ruby': '#',
            'perl': '#',
            'yaml': '#',
            'makefile': '#',
            'javascript': '//',
            'typescript': '//',
            'java': '//',
            'c': '//',
            'cpp': '//',
            'go': '//',
            'rust': '//',
            'php': '//',
            'html': '<!--',
            'css': '/*',
            'xml': '<!--'
        };
        return commentStarts[language] || '//';
    }
    smartTruncate(text, type) {
        if (text.length === 0)
            return text;
        if (type === 'prefix') {
            const firstNewline = text.indexOf('\n');
            if (firstNewline !== -1 && firstNewline < 100) {
                return text.substring(firstNewline + 1);
            }
        }
        else {
            const lastNewline = text.lastIndexOf('\n');
            if (lastNewline !== -1 && text.length - lastNewline < 100) {
                return text.substring(0, lastNewline);
            }
        }
        return text;
    }
}
exports.ContextEngine = ContextEngine;
//# sourceMappingURL=context-engine.js.map