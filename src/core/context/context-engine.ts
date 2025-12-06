import * as vscode from 'vscode';
import * as path from 'path';
import { SemanticAnalyzer } from '../../analysis/semantic-analyzer';
import { ContextAnalyzer } from './context-analyzer';
import { ContextOptimizer } from './context-optimizer';
import { StateManager } from '../../pipeline/state-manager';
import { ContextWindowBuilder } from '../../pipeline/context-window-builder';
import { AdaptiveContextManager, ModelSize } from './adaptive-context-manager';

// Enhanced type information interfaces
export interface ImportInfo {
    module: string;
    imports: string[];
    tokenCount?: number;
    isDefault: boolean;
    alias?: string;
    resolvedPath?: string;
    lineNumber: number;
}

export interface ParameterInfo {
    name: string;
    type?: string;
    optional: boolean;
    defaultValue?: string;
}

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

export interface PropertyInfo {
    name: string;
    type?: string;
    visibility?: 'public' | 'private' | 'protected';
    isStatic: boolean;
    isReadonly: boolean;
}

export interface ClassInfo {
    name: string;
    extends?: string;
    implements?: string[];
    methods: FunctionInfo[];
    properties: PropertyInfo[];
    lineNumber: number;
    isExported: boolean;
}

export interface InterfaceInfo {
    name: string;
    extends?: string[];
    properties: PropertyInfo[];
    methods: FunctionInfo[];
    lineNumber: number;
}

export interface TypeInfo {
    name: string;
    definition: string;
    lineNumber: number;
}

export interface VariableInfo {
    name: string;
    type?: string;
    value?: string;
    isConst: boolean;
    lineNumber: number;
}

export interface SymbolInfo {
    name: string;
    kind: vscode.SymbolKind;
    type?: string;
    location: vscode.Location;
    documentation?: string;
}

export interface ScopeInfo {
    type: 'global' | 'class' | 'function' | 'block';
    name?: string;
    variables: Map<string, TypeInfo>;
    parent?: ScopeInfo;
    lineRange: { start: number; end: number };
}

export interface DependencyInfo {
    filePath: string;
    symbols: string[];
    isExternal: boolean;
}

export interface RelatedCodeBlock {
    code: string;
    filePath: string;
    similarity: number;
    context: string;
}

export interface EditHistory {
    timestamp: number;
    file: string;
    changes: string;
}

export interface CursorIntent {
    type: 'function_call' | 'variable_declaration' | 'class_method' | 'import' | 'comment_to_code' | 'type_annotation' | 'unknown';
    confidence: number;
    suggestedContext: string[];
    detectedPatterns: string[];
}

export interface ProjectConfig {
    hasTypeScript: boolean;
    hasJavaScript: boolean;
    packageManager?: 'npm' | 'yarn' | 'pnpm';
    framework?: string;
    dependencies: string[];
}

export interface CodingPattern {
    pattern: string;
    frequency: number;
    examples: string[];
}

export interface StyleGuide {
    indentation: 'tabs' | 'spaces';
    indentSize: number;
    quotes: 'single' | 'double';
    semicolons: boolean;
    trailingComma: boolean;
}

// Enhanced CodeContext with comprehensive semantic information
export interface CodeContext {
    // Basic context (existing)
    prefix: string;
    suffix: string;
    language: string;
    filename: string;
    project: string;
    tokenCount?: number;
    
    // Enhanced semantic context
    imports: ImportInfo[];
    functions: FunctionInfo[];
    classes: ClassInfo[];
    interfaces: InterfaceInfo[];
    types: TypeInfo[];
    variables: VariableInfo[];
    
    // Scope and symbol information
    currentScope: ScopeInfo | null;
    symbolTable: Map<string, SymbolInfo>;
    dependencies: DependencyInfo[];
    
    // Project-wide context
    projectConfig: ProjectConfig | null;
    codingPatterns: CodingPattern[];
    styleGuide: StyleGuide | null;
    
    // Intelligent context
    relatedCode: RelatedCodeBlock[];
    recentEdits: EditHistory[];
    cursorIntent: CursorIntent | null;
    
    // Legacy fields
    comments: string[];
    cursorRules?: string;
}

export interface ProjectPatterns {
    namingConventions: string[];
    codeStyle: string[];
    commonImports: string[];
    frequentPatterns: string[];
}

export interface FIMTemplate {
    prefix: string;
    suffix: string;
    middle: string;
    eos?: string;
}

export const FIM_TEMPLATES: Record<string, FIMTemplate> = {
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

export class ContextEngine {
    private maxContextLength: number = 4000;
    private projectPatterns: Map<string, CodingPattern[]> = new Map();
    private semanticAnalyzer: SemanticAnalyzer;
    private contextAnalyzer: ContextAnalyzer;
    private contextOptimizer: ContextOptimizer;
    private stateManager: StateManager | null = null;
    private contextWindowBuilder: ContextWindowBuilder | null = null;
    
    // Adaptive context support
    private currentModelSize: ModelSize = ModelSize.SMALL;
    private currentModelName: string = '';

    constructor() {
        this.loadProjectPatterns();
        this.semanticAnalyzer = new SemanticAnalyzer();
        this.contextAnalyzer = new ContextAnalyzer();
        this.contextOptimizer = new ContextOptimizer();
    }
    
    /**
     * Set current model information for adaptive context
     */
    setModelInfo(modelName: string, parameterCount?: string): void {
        this.currentModelName = modelName;
        this.currentModelSize = AdaptiveContextManager.detectModelSize(modelName, parameterCount);
        
        // Update max context length based on model size
        const config = AdaptiveContextManager.getContextConfig(this.currentModelSize);
        this.maxContextLength = config.maxContextLength;
        
        console.log(`[ContextEngine] Model: ${modelName}, Size: ${this.currentModelSize}, MaxContext: ${this.maxContextLength}`);
    }
    
    /**
     * Get current model size
     */
    getModelSize(): ModelSize {
        return this.currentModelSize;
    }

    /**
     * Set the state manager for event-based context
     */
    public setStateManager(stateManager: StateManager): void {
        this.stateManager = stateManager;
    }

    /**
     * Set the context window builder
     */
    public setContextWindowBuilder(builder: ContextWindowBuilder): void {
        this.contextWindowBuilder = builder;
    }

    async buildContext(document: vscode.TextDocument, position: vscode.Position): Promise<CodeContext> {
        const text = document.getText();
        const offset = document.offsetAt(position);
        const language = document.languageId;

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
        let recentEdits: EditHistory[] = [];
        let cursorHistory: any[] = [];
        let userPatterns: any = null;
        
        if (this.stateManager) {
            const state = this.stateManager.getState();
            const docState = state.openDocuments.get(document.uri.toString());
            
            if (docState) {
                // Get cursor movement patterns for current doc
                cursorHistory = state.cursorHistory
                    .filter(cursor => cursor.uri.toString() === document.uri.toString())
                    .slice(-10);
                
                // Analyze user patterns
                userPatterns = this.analyzeUserPatterns(docState.recentEdits, cursorHistory);
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
        } else {
            // Fallback to semantic analyzer
            recentEdits = await this.withTimeout(
                this.semanticAnalyzer.getRecentEditsEnhanced(document.uri), 
                50, 
                []
            );
        }
        
        const cursorRules = await this.withTimeout(
            this.loadCursorRules(document.uri), 
            50, 
            undefined
        );

        let imports: any[] = [];
        let functions: any[] = [];
        let classes: any[] = [];
        let interfaces: any[] = [];
        let types: TypeInfo[] = [];
        let variables: VariableInfo[] = [];
        let comments: string[] = [];
        let projectConfig: ProjectConfig | null = null;

        if (!isLargeFile) {
            // Run enhanced extractions in parallel using semanticAnalyzer
            const results = await Promise.all([
                this.semanticAnalyzer.extractImportsEnhanced(document),
                this.semanticAnalyzer.extractFunctionsEnhanced(document),
                this.semanticAnalyzer.extractClassesEnhanced(document),
                this.semanticAnalyzer.extractInterfacesEnhanced(document),
                this.semanticAnalyzer.extractTypesEnhanced(document),
                this.semanticAnalyzer.extractVariablesEnhanced(document),
                Promise.resolve(this.extractComments(document)), // Use local for now as semanticAnalyzer doesn't have it
                this.semanticAnalyzer.getProjectConfig(document.uri)
            ]);

            [imports, functions, classes, interfaces, types, variables, comments, projectConfig] = results;
        } else {
            console.log(`[ContextEngine] ⚠️ Large file detected (${(text.length/1024).toFixed(1)}KB), skipping deep analysis`);
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
        let dependencies: DependencyInfo[] = [];
        let relatedCode: RelatedCodeBlock[] = [];
        let codingPatterns: CodingPattern[] = [];

        const config = vscode.workspace.getConfiguration('inline');
        const enableMultiFileAnalysis = config.get<boolean>('context.enableMultiFileAnalysis', true);

        if (enableMultiFileAnalysis && !isLargeFile && imports.length > 0) {
            try {
                // Build dependency graph
                dependencies = await this.withTimeout(
                    this.contextAnalyzer.buildDependencyGraph(document.uri, imports),
                    100,
                    []
                );

                // Find similar code (based on cursor intent)
                if (cursorIntent && cursorIntent.type === 'comment_to_code') {
                    const codeContext = prefix.substring(Math.max(0, prefix.length - 200));
                    relatedCode = await this.withTimeout(
                        this.contextAnalyzer.findSimilarCode(
                            codeContext,
                            document.languageId,
                            vscode.workspace.getWorkspaceFolder(document.uri)!
                        ),
                        150,
                        []
                    );
                }

                // Detect coding patterns (cache for project)
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
                if (workspaceFolder && !this.projectPatterns.has(workspaceFolder.name)) {
                    const files = await vscode.workspace.findFiles(
                        new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'),
                        '**/node_modules/**',
                        50
                    );
                    
                    codingPatterns = await this.withTimeout(
                        this.contextAnalyzer.detectCodingPatterns(files),
                        200,
                        []
                    );
                }
            } catch (error) {
                console.warn('[ContextEngine] Multi-file analysis failed:', error);
            }
        }

        const context: CodeContext = {
            // Basic context
            prefix,
            suffix,
            language: document.languageId,
            filename: path.basename(document.uri.fsPath),
            project: this.getProjectName(document.uri),
            
            // Enhanced semantic context
            imports,
            functions,
            classes,
            interfaces,
            types,
            variables,
            
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


    private async withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
        let timer: NodeJS.Timeout;
        const timeout = new Promise<T>(resolve => {
            timer = setTimeout(() => resolve(fallback), ms);
        });
        return Promise.race([
            promise.then(val => { clearTimeout(timer); return val; }),
            timeout
        ]);
    }

    private async loadCursorRules(uri: vscode.Uri): Promise<string | undefined> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) return undefined;

        try {
            const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.cursorrules');
            // Check if file exists
            await vscode.workspace.fs.stat(rulesUri);
            const content = await vscode.workspace.fs.readFile(rulesUri);
            return new TextDecoder().decode(content);
        } catch {
            // Also try .cursorrules (no dot? no, dot is standard) or .rules
            try {
                const rulesUri = vscode.Uri.joinPath(workspaceFolder.uri, '.rules');
                await vscode.workspace.fs.stat(rulesUri);
                const content = await vscode.workspace.fs.readFile(rulesUri);
                return new TextDecoder().decode(content);
            } catch {
                return undefined;
            }
        }
    }

    private getProjectName(uri: vscode.Uri): string {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        return workspaceFolder ? workspaceFolder.name : 'unknown';
    }

    private extractImports(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const imports: string[] = [];

        const patterns = {
            python: /^import\s+.*|^from\s+.*\s+import\s+.*/gm,
            javascript: /^import\s+.*|^const\s+.*=\s*require\(.*/gm,
            typescript: /^import\s+.*|^const\s+.*=\s*require\(.*/gm,
            java: /^import\s+.*;/gm,
            cpp: /^#include\s+.*/gm,
            go: /^import\s+(\([^)]*\)|".*")/gm,
            rust: /^use\s+.*;/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                imports.push(...matches);
            }
        }

        return imports;
    }

    private extractFunctions(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const functions: string[] = [];

        const patterns = {
            python: /^def\s+\w+\s*\([^)]*\):/gm,
            javascript: /^function\s+\w+\s*\([^)]*\)\s*{|^\w+\s*:\s*function\s*\([^)]*\)\s*{|^\w+\s*=\s*\([^)]*\)\s*=>/gm,
            typescript: /^function\s+\w+\s*\([^)]*\)\s*[:{]?|^\w+\s*\([^)]*\)\s*[:{]?|^\w+\s*:\s*\([^)]*\)\s*=>/gm,
            java: /^(?:public|private|protected)?\s+.*\s+\w+\s*\([^)]*\)\s*{/gm,
            cpp: /^\w+\s+\w+\s*\([^)]*\)\s*{/gm,
            go: /^func\s+\w+\s*\([^)]*\)/gm,
            rust: /^fn\s+\w+\s*\([^)]*\)/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                functions.push(...matches);
            }
        }

        return functions;
    }

    private extractClasses(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const classes: string[] = [];

        const patterns = {
            python: /^class\s+\w+/gm,
            javascript: /^class\s+\w+/gm,
            typescript: /^class\s+\w+/gm,
            java: /^(?:public|private|protected)?\s+class\s+\w+/gm,
            cpp: /^class\s+\w+/gm,
            go: /^type\s+\w+\s+struct/gm,
            rust: /^struct\s+\w+/gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                classes.push(...matches);
            }
        }

        return classes;
    }

    private extractComments(document: vscode.TextDocument): string[] {
        const text = document.getText();
        const comments: string[] = [];

        const patterns = {
            python: /#.*$/gm,
            javascript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            typescript: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            java: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            cpp: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            go: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            rust: /\/\/.*$|\/\*[\s\S]*?\*\//gm
        };

        const pattern = patterns[document.languageId as keyof typeof patterns];
        if (pattern) {
            const matches = text.match(pattern);
            if (matches) {
                comments.push(...matches.filter(comment => comment.trim().length > 1));
            }
        }

        return comments;
    }

    private async getRecentEdits(currentUri: vscode.Uri): Promise<string[]> {
        const edits: string[] = [];
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

    async generatePrompt(context: CodeContext, templateId: string = 'default'): Promise<string> {
        let template: FIMTemplate;

        // "Universal" Support: Allow user to define custom tokens
        if (templateId === 'custom') {
            const config = vscode.workspace.getConfiguration('inline');
            const customFim = config.get<{prefix: string, suffix: string, middle: string}>('fim');
            if (customFim && customFim.prefix) {
                template = customFim;
            } else {
                template = FIM_TEMPLATES['default'];
            }
        } else {
            // Get FIM template based on ID or fallback to default
            template = FIM_TEMPLATES[templateId] || FIM_TEMPLATES['default'];
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
    private buildIntelligentHeader(context: CodeContext): string {
        // Get adaptive context configuration based on model size
        const adaptiveConfig = AdaptiveContextManager.getContextConfig(this.currentModelSize);
        
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
    private buildFileMetadata(context: CodeContext, commentPrefix: string): string {
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
    private buildTypeContext(context: CodeContext, commentPrefix: string, maxTypes: number = 5): string {
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
    private buildFunctionContext(context: CodeContext, commentPrefix: string, maxFunctions: number = 5): string {
        let section = `${commentPrefix} ═══ AVAILABLE FUNCTIONS ═══\n`;

        // Add function signatures (adaptive limit)
        const topFunctions = context.functions.slice(0, maxFunctions);
        topFunctions.forEach(func => {
            section += `${func.isAsync ? 'async ' : ''}function ${func.name}(`;
            section += func.parameters.map(p => 
                `${p.name}${p.optional ? '?' : ''}${p.type ? ': ' + p.type : ''}`
            ).join(', ');
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
    private buildExampleContext(context: CodeContext, commentPrefix: string): string {
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
    private buildScopeContext(context: CodeContext, commentPrefix: string): string {
        if (!context.currentScope) return '';

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
                if (count++ >= 5) break; // Limit to 5 variables
                section += `${commentPrefix}   ${name}: ${type.definition}\n`;
            }
        }

        section += '\n';
        return section;
    }

    /**
     * Build project rules section
     */
    private buildProjectRules(context: CodeContext, commentPrefix: string): string {
        let section = `${commentPrefix} ═══ PROJECT RULES ═══\n`;
        
        // Add cursor rules (limit to 500 chars)
        const rules = context.cursorRules!.substring(0, 500);
        const ruleLines = rules.split('\n');
        
        ruleLines.forEach(line => {
            section += `${commentPrefix} ${line}\n`;
        });

        if (context.cursorRules!.length > 500) {
            section += `${commentPrefix} ...\n`;
        }

        section += '\n';
        return section;
    }

    /**
     * Build related files context section
     */
    private buildRelatedFilesContext(context: CodeContext, commentPrefix: string, maxRelatedFiles: number = 2): string {
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

    private loadProjectPatterns(): void {
        // TODO: Load and analyze project patterns
    }

    private async extractProjectPatterns(workspaceFolder: vscode.WorkspaceFolder): Promise<CodingPattern[]> {
        const patterns: CodingPattern[] = [];

        try {
            const files = await vscode.workspace.findFiles(
                new vscode.RelativePattern(workspaceFolder, '**/*.{ts,tsx,js,jsx}'),
                '**/node_modules/**',
                50
            );

            for (const file of files.slice(0, 50)) { // Limit to 50 files for performance
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    this.analyzeFileForPatterns(document, patterns);
                } catch (error) {
                    console.error(`Failed to analyze file ${file.fsPath}:`, error);
                }
            }

            this.projectPatterns.set(workspaceFolder.name, patterns);
        } catch (error) {
            console.error('Failed to extract project patterns:', error);
        }

        return patterns;
    }

    private analyzeFileForPatterns(document: vscode.TextDocument, patterns: CodingPattern[]): void {
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
            } else {
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
            } else {
                patterns.push({
                    pattern: signature,
                    frequency: 1,
                    examples: [func.substring(0, 100)]
                });
            }
        }
    }

    analyzeComments(comments: string[]): { intent: string; requirements: string[] } {
        const intent = this.extractIntent(comments);
        const requirements = this.extractRequirements(comments);

        return { intent, requirements };
    }

    private extractIntent(comments: string[]): string {
        const commentText = comments.join(' ').toLowerCase();

        if (commentText.includes('create') || commentText.includes('implement')) {
            return 'create';
        } else if (commentText.includes('fix') || commentText.includes('bug')) {
            return 'fix';
        } else if (commentText.includes('refactor') || commentText.includes('improve')) {
            return 'refactor';
        } else if (commentText.includes('test')) {
            return 'test';
        }

        return 'complete';
    }

    private extractRequirements(comments: string[]): string[] {
        const requirements: string[] = [];

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
    private analyzeUserPatterns(edits: any[], cursorHistory: any[]): any {
        if (edits.length === 0 && cursorHistory.length === 0) {
            return null;
        }

        // Calculate typing speed (edits per minute)
        const recentEdits = edits.slice(-10);
        const typingSpeed = recentEdits.length > 1 
            ? (recentEdits.length / ((recentEdits[recentEdits.length - 1].timestamp - recentEdits[0].timestamp) / 60000))
            : 0;

        // Detect editing style
        const hasFrequentSmallEdits = recentEdits.filter(e => 
            e.changes && e.changes.length === 1 && e.changes[0].text.length < 5
        ).length > recentEdits.length * 0.7;

        // Detect cursor movement patterns
        const cursorJumps = cursorHistory.length > 1
            ? cursorHistory.filter((curr: any, i: number) => {
                if (i === 0) return false;
                const prev = cursorHistory[i - 1];
                const lineDiff = Math.abs(curr.position.line - prev.position.line);
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
    private detectPreferredEditType(edits: any[]): string {
        const types = edits.map((e: any) => e.type);
        const typeCounts: Record<string, number> = {};
        
        types.forEach((type: string) => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
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

    private getCommentPrefix(language: string): string {
        const commentStarts: Record<string, string> = {
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

    private smartTruncate(text: string, type: 'prefix' | 'suffix'): string {
        if (text.length === 0) return text;

        if (type === 'prefix') {
            const firstNewline = text.indexOf('\n');
            if (firstNewline !== -1 && firstNewline < 100) { 
                return text.substring(firstNewline + 1);
            }
        } else {
            const lastNewline = text.lastIndexOf('\n');
            if (lastNewline !== -1 && text.length - lastNewline < 100) {
                 return text.substring(0, lastNewline);
            }
        }
        return text;
    }
}
