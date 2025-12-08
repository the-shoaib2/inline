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
import { LanguageConfigService } from '@language/analysis/language-config-service';
import { TreeSitterService } from '@language/parsers/tree-sitter-service';
import { NativeLoader } from '@platform/native/native-loader';

import type {
    ImportInfo, FunctionInfo, ClassInfo, InterfaceInfo, TypeInfo, VariableInfo,
    ParameterInfo, PropertyInfo, SymbolInfo, ScopeInfo, CursorIntent,
    ProjectConfig, StyleGuide, EditHistory
} from '@context/context-engine';

/**
 * Decorator information extracted from code
 */
export interface DecoratorInfo {
    name: string;
    arguments?: string;
    lineNumber: number;
    target?: 'class' | 'method' | 'property' | 'parameter';
}

/**
 * Generic type parameter information
 */
export interface GenericInfo {
    name: string;
    constraint?: string;
    defaultType?: string;
    lineNumber: number;
}

/**
 * Performs semantic analysis on code documents.
 * Extracts structural information for context building.
 */
export class SemanticAnalyzer {
    private treeSitterService: TreeSitterService;

    constructor() {
        this.treeSitterService = TreeSitterService.getInstance();
    }
    /**
     * Extract all import statements with detailed metadata.
     * Handles named, default, and namespace imports.
     * Supports JavaScript, TypeScript, and Python.
     *
     * @param document VS Code document to analyze
     * @returns Array of import information with module and line number
     */
    async extractImportsEnhanced(document: vscode.TextDocument): Promise<ImportInfo[]> {
        const native = NativeLoader.getInstance();
        if (native.isAvailable()) {
            try {
                return native.extractImports(document.getText(), document.languageId);
            } catch (error) {
                console.warn('[SemanticAnalyzer] Native extraction failed, fallback to regex:', error);
            }
        }

        const text = document.getText();
        const imports: ImportInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.imports) {
            return imports;
        }

        if (language === 'typescript' || language === 'javascript') {
            for (const patternString of patterns.imports) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const namedImports = match[1];
                        const defaultImport = match[2];
                        const namespaceImport = match[3];
                        const module = match[4];

                        if (module) {
                            if (namedImports) {
                                // Handle: import { a, b } from 'module'
                                const importNames = namedImports.split(',').map(i => i.trim());
                                imports.push({
                                    module,
                                    imports: importNames,
                                    isDefault: false,
                                    lineNumber
                                });
                            } else if (defaultImport) {
                                // Handle: import x from 'module'
                                imports.push({
                                    module,
                                    imports: [defaultImport],
                                    isDefault: true,
                                    lineNumber
                                });
                            } else if (namespaceImport) {
                                // Handle: import * as x from 'module'
                                imports.push({
                                    module,
                                    imports: [namespaceImport],
                                    isDefault: false,
                                    alias: namespaceImport,
                                    lineNumber
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[SemanticAnalyzer] Error in import extraction for ${language}:`, e);
                }
            }
        } else if (language === 'python') {
            for (const patternString of patterns.imports) {
                 try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const fullMatch = match[0];

                        // Distinguish Python import patterns (from/import)
                        if (fullMatch.startsWith('from')) {
                             const module = match[1];
                             const importNames = match[2]?.split(',').map(i => i.trim());
                             if (module && importNames) {
                                imports.push({
                                    module,
                                    imports: importNames,
                                    isDefault: false,
                                    lineNumber
                                });
                             }
                        } else {
                            const module = match[1];
                            const alias = match[2];
                            if (module) {
                                imports.push({
                                    module,
                                    imports: [alias || module],
                                    isDefault: false,
                                    alias,
                                    lineNumber
                                });
                            }
                        }
                    }
                 } catch (e) {
                     console.error(`[SemanticAnalyzer] Error in import extraction for ${language}:`, e);
                 }
            }
        }

        return imports;
    }

    /**
     * Extract detailed function information with parameters and types
     */
    async extractFunctionsEnhanced(document: vscode.TextDocument): Promise<FunctionInfo[]> {
        const native = NativeLoader.getInstance();
        if (native.isAvailable()) {
            try {
                return native.extractFunctions(document.getText(), document.languageId);
            } catch (error) {
                console.warn('[SemanticAnalyzer] Native extraction failed, fallback to regex:', error);
            }
        }

        const text = document.getText();
        const functions: FunctionInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.functions) {
            return functions;
        }

        if (language === 'typescript' || language === 'javascript') {
            for (const patternString of patterns.functions) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;

                        // Heuristic for group mapping based on the complex regex in languages.json
                        const name = match[1] || match[2];
                        if (!name) continue; // Skip if no name captured (e.g. simple patterns)

                        const paramsStr = match[3] || '';
                        const returnType = match[4]?.trim();

                        const parameters = this.parseParameters(paramsStr);
                        const isAsync = match[0].includes('async');
                        const isExported = match[0].includes('export');

                        functions.push({
                            name,
                            signature: match[0].trim(),
                            parameters,
                            returnType,
                            lineNumber,
                            isAsync,
                            isExported
                        });
                    }
                } catch (e) {
                     console.error(`[SemanticAnalyzer] Error in function extraction for ${language}:`, e);
                }
            }
        } else if (language === 'python') {
            for (const patternString of patterns.functions) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;

                        // Python regex: def name(params) -> returnType
                        const name = match[1];
                        if (!name) continue;

                        const paramsStr = match[2];
                        const returnType = match[3]?.trim();

                        const parameters = this.parseParameters(paramsStr || '');
                        const isAsync = match[0].includes('async');

                        functions.push({
                            name,
                            signature: match[0].trim(),
                            parameters,
                            returnType,
                            lineNumber,
                            isAsync,
                            isExported: false
                        });
                    }
                } catch (e) {
                    console.error(`[SemanticAnalyzer] Error in function extraction for ${language}:`, e);
                }
            }
        }

        return functions;
    }

    /**
     * Extract detailed class information with methods and properties
     */
    async extractClassesEnhanced(document: vscode.TextDocument): Promise<ClassInfo[]> {
        const text = document.getText();
        const classes: ClassInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.classes) {
            return classes;
        }

        if (language === 'typescript' || language === 'javascript') {
            for (const patternString of patterns.classes) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const name = match[1];
                        if (!name) continue;

                        const extendsClass = match[2];
                        const implementsInterfaces = match[3]?.split(',').map(i => i.trim());
                        const isExported = match[0].includes('export');

                        classes.push({
                            name,
                            extends: extendsClass,
                            implements: implementsInterfaces,
                            methods: [],
                            properties: [],
                            lineNumber,
                            isExported
                        });
                    }
                } catch (e) {
                     console.error(`[SemanticAnalyzer] Error in class extraction for ${language}:`, e);
                }
            }
        } else if (language === 'python') {
            for (const patternString of patterns.classes) {
                 try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const name = match[1];
                        if (!name) continue;

                        const bases = match[2]?.split(',').map(b => b.trim());

                        classes.push({
                            name,
                            extends: bases?.[0],
                            implements: bases?.slice(1),
                            methods: [],
                            properties: [],
                            lineNumber,
                            isExported: false
                        });
                    }
                 } catch (e) {
                     console.error(`[SemanticAnalyzer] Error in class extraction for ${language}:`, e);
                 }
            }
        }

        return classes;
    }

    /**
     * Extract TypeScript/Java interfaces
     */
    async extractInterfacesEnhanced(document: vscode.TextDocument): Promise<InterfaceInfo[]> {
        const text = document.getText();
        const interfaces: InterfaceInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.interfaces) {
            return interfaces;
        }

        if (language === 'typescript') {
            for (const patternString of patterns.interfaces) {
               try {
                   const regex = new RegExp(patternString, 'gm');
                   let match;
                   while ((match = regex.exec(text)) !== null) {
                       const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                       const name = match[1];
                       if (!name) continue;

                       const extendsInterfaces = match[2]?.split(',').map(i => i.trim());

                       interfaces.push({
                           name,
                           extends: extendsInterfaces,
                           properties: [],
                           methods: [],
                           lineNumber
                       });
                   }
               } catch (e) {
                   console.error(`[SemanticAnalyzer] Error in interface extraction for ${language}:`, e);
               }
            }
        }

        return interfaces;
    }

    /**
     * Extract type definitions
     */
    async extractTypesEnhanced(document: vscode.TextDocument): Promise<TypeInfo[]> {
        const text = document.getText();
        const types: TypeInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.types) {
            return types;
        }

        if (language === 'typescript') {
             for (const patternString of patterns.types) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const name = match[1];
                        if (!name) continue;

                        const definition = match[2].trim();

                        types.push({
                            name,
                            definition,
                            lineNumber
                        });
                    }
                } catch (e) {
                    console.error(`[SemanticAnalyzer] Error in type extraction for ${language}:`, e);
                }
            }
        }

        return types;
    }

    /**
     * Extract variable declarations with types
     */
    async extractVariablesEnhanced(document: vscode.TextDocument): Promise<VariableInfo[]> {
        const text = document.getText();
        const variables: VariableInfo[] = [];
        const language = document.languageId;
        const patterns = LanguageConfigService.getInstance().getPatterns(language);

        if (!patterns || !patterns.variables) {
            return variables;
        }

        if (language === 'typescript' || language === 'javascript') {
            for (const patternString of patterns.variables) {
                try {
                    const regex = new RegExp(patternString, 'gm');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                        const isConst = match[1] === 'const';
                        const name = match[2];
                        if (!name) continue;

                        const type = match[3]?.trim();
                        const value = match[4]?.trim();

                        variables.push({
                            name,
                            type,
                            value,
                            isConst,
                            lineNumber
                        });
                    }
                } catch (e) {
                    console.error(`[SemanticAnalyzer] Error in variable extraction for ${language}:`, e);
                }
             }
        }

        return variables;
    }

    /**
     * Parse function parameters
     */
    private parseParameters(paramsStr: string): ParameterInfo[] {
        if (!paramsStr || paramsStr.trim().length === 0) {
            return [];
        }

        const params = paramsStr.split(',').map(p => p.trim());
        return params.map(param => {
            // Match: name: type = defaultValue
            // Match: name?: type
            const match = param.match(/(\w+)(\?)?(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/);

            if (match) {
                return {
                    name: match[1],
                    type: match[3]?.trim(),
                    optional: !!match[2],
                    defaultValue: match[4]?.trim()
                };
            }

            return {
                name: param,
                type: undefined,
                optional: false
            };
        });
    }

    /**
     * Build symbol table using VS Code's symbol provider
     */
    async buildSymbolTable(document: vscode.TextDocument): Promise<Map<string, SymbolInfo>> {
        const symbolTable = new Map<string, SymbolInfo>();

        try {
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (symbols) {
                this.processSymbols(symbols, symbolTable, document);
            }
        } catch (error) {
            console.warn('[SemanticAnalyzer] Failed to get symbols:', error);
        }

        return symbolTable;
    }

    private processSymbols(
        symbols: vscode.DocumentSymbol[],
        symbolTable: Map<string, SymbolInfo>,
        document: vscode.TextDocument
    ): void {
        for (const symbol of symbols) {
            const location = new vscode.Location(document.uri, symbol.range);

            symbolTable.set(symbol.name, {
                name: symbol.name,
                kind: symbol.kind,
                location,
                documentation: symbol.detail
            });

            // Process children recursively
            if (symbol.children && symbol.children.length > 0) {
                this.processSymbols(symbol.children, symbolTable, document);
            }
        }
    }

    /**
     * Detect cursor intent based on context
     */
    detectCursorIntent(
        document: vscode.TextDocument,
        position: vscode.Position,
        prefix: string,
        suffix: string
    ): CursorIntent | null {
        const line = document.lineAt(position.line).text;
        const textBefore = line.substring(0, position.character).trim();
        const textAfter = line.substring(position.character).trim();

        // Detect comment to code
        if (textBefore.match(/^(\/\/|#|\/\*)/)) {
            return {
                type: 'comment_to_code',
                confidence: 0.9,
                suggestedContext: ['functions', 'classes', 'similar_code'],
                detectedPatterns: ['comment_intent']
            };
        }

        // Detect function call
        if (textBefore.endsWith('(') || textAfter.startsWith(')')) {
            return {
                type: 'function_call',
                confidence: 0.85,
                suggestedContext: ['function_signatures', 'parameters'],
                detectedPatterns: ['function_invocation']
            };
        }

        // Detect variable declaration
        if (textBefore.match(/(const|let|var)\s+\w*$/)) {
            return {
                type: 'variable_declaration',
                confidence: 0.8,
                suggestedContext: ['types', 'similar_variables'],
                detectedPatterns: ['variable_init']
            };
        }

        // Detect import statement
        if (textBefore.match(/^import\s+/)) {
            return {
                type: 'import',
                confidence: 0.95,
                suggestedContext: ['available_modules', 'common_imports'],
                detectedPatterns: ['import_statement']
            };
        }

        // Detect type annotation
        if (textBefore.endsWith(':') && document.languageId === 'typescript') {
            return {
                type: 'type_annotation',
                confidence: 0.9,
                suggestedContext: ['types', 'interfaces'],
                detectedPatterns: ['type_hint']
            };
        }

        return {
            type: 'unknown',
            confidence: 0.5,
            suggestedContext: [],
            detectedPatterns: []
        };
    }

    /**
     * Analyze current scope
     */
    analyzeCurrentScope(
        document: vscode.TextDocument,
        position: vscode.Position,
        functions: FunctionInfo[],
        classes: ClassInfo[]
    ): ScopeInfo | null {
        const lineNumber = position.line;

        // Find enclosing function
        for (const func of functions) {
            if (func.lineNumber <= lineNumber) {
                // Simplified - would need to check end of function
                return {
                    type: 'function',
                    name: func.name,
                    variables: new Map(),
                    lineRange: { start: func.lineNumber, end: func.lineNumber + 20 } // Approximate
                };
            }
        }

        // Find enclosing class
        for (const cls of classes) {
            if (cls.lineNumber <= lineNumber) {
                return {
                    type: 'class',
                    name: cls.name,
                    variables: new Map(),
                    lineRange: { start: cls.lineNumber, end: cls.lineNumber + 50 } // Approximate
                };
            }
        }

        return {
            type: 'global',
            variables: new Map(),
            lineRange: { start: 0, end: document.lineCount }
        };
    }

    /**
     * Get project configuration
     */
    async getProjectConfig(uri: vscode.Uri): Promise<ProjectConfig | null> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (!workspaceFolder) {
            return null;
        }

        const config: ProjectConfig = {
            hasTypeScript: false,
            hasJavaScript: false,
            dependencies: []
        };

        try {
            // Check for package.json
            const packageJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, 'package.json');
            const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
            const packageJson = JSON.parse(new TextDecoder().decode(packageJsonContent));

            config.dependencies = [
                ...Object.keys(packageJson.dependencies || {}),
                ...Object.keys(packageJson.devDependencies || {})
            ];

            // Detect framework
            if (config.dependencies.includes('react')) {
                config.framework = 'react';
            } else if (config.dependencies.includes('vue')) {
                config.framework = 'vue';
            } else if (config.dependencies.includes('@angular/core')) {
                config.framework = 'angular';
            }

            // Detect package manager
            if (packageJson.packageManager?.includes('pnpm')) {
                config.packageManager = 'pnpm';
            } else if (packageJson.packageManager?.includes('yarn')) {
                config.packageManager = 'yarn';
            } else {
                config.packageManager = 'npm';
            }
        } catch (error) {
            // No package.json or error reading it
        }

        try {
            // Check for tsconfig.json
            const tsconfigUri = vscode.Uri.joinPath(workspaceFolder.uri, 'tsconfig.json');
            await vscode.workspace.fs.stat(tsconfigUri);
            config.hasTypeScript = true;
        } catch {
            // No tsconfig.json
        }

        return config;
    }

    /**
     * Detect coding style guide
     */
    detectStyleGuide(text: string): StyleGuide | null {
        const lines = text.split('\n');

        // Detect indentation
        let tabCount = 0;
        let spaceCount = 0;
        let spaceSizes: number[] = [];

        for (const line of lines.slice(0, 100)) { // Sample first 100 lines
            if (line.startsWith('\t')) {
                tabCount++;
            } else if (line.startsWith(' ')) {
                const spaces = line.match(/^ +/)?.[0].length || 0;
                if (spaces > 0) {
                    spaceCount++;
                    spaceSizes.push(spaces);
                }
            }
        }

        const indentation: 'tabs' | 'spaces' = tabCount > spaceCount ? 'tabs' : 'spaces';
        const indentSize = indentation === 'spaces'
            ? Math.round(spaceSizes.reduce((a, b) => a + b, 0) / spaceSizes.length) || 2
            : 4;

        // Detect quotes
        const singleQuotes = (text.match(/'/g) || []).length;
        const doubleQuotes = (text.match(/"/g) || []).length;
        const quotes: 'single' | 'double' = singleQuotes > doubleQuotes ? 'single' : 'double';

        // Detect semicolons
        const semicolons = (text.match(/;/g) || []).length > lines.length * 0.5;

        // Detect trailing commas
        const trailingComma = (text.match(/,\s*[\]})]/g) || []).length > 5;

        return {
            indentation,
            indentSize,
            quotes,
            semicolons,
            trailingComma
        };
    }

    /**
     * Get enhanced recent edits with history
     */
    async getRecentEditsEnhanced(currentUri: vscode.Uri): Promise<EditHistory[]> {
        const edits: EditHistory[] = [];

        // Get visible text editors (other tabs)
        for (const editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.toString() !== currentUri.toString()) {
                const text = editor.document.getText();
                if (text.length > 0) {
                    edits.push({
                        timestamp: Date.now(),
                        file: editor.document.fileName,
                        changes: text.substring(0, 500) // First 500 chars
                    });
                }
            }
        }

        return edits.slice(0, 3); // Limit to top 3 files
    }

    /**
     * Extract decorators using Tree-sitter (NEW CAPABILITY)
     * 
     * Accurately detects decorators in TypeScript and Python:
     * - TypeScript: @Component, @Injectable, @Input(), etc.
     * - Python: @property, @staticmethod, @app.route('/path'), etc.
     * 
     * This was impossible with regex due to complex syntax variations.
     */
    async extractDecorators(document: vscode.TextDocument): Promise<DecoratorInfo[]> {
        const native = NativeLoader.getInstance();
        if (native.isAvailable()) {
            try {
                return native.extractDecorators(document.getText(), document.languageId);
            } catch (error) {
                console.warn('[SemanticAnalyzer] Native extraction failed, fallback to Tree-sitter:', error);
            }
        }

        const decorators: DecoratorInfo[] = [];
        const language = document.languageId;

        // Only use Tree-sitter if supported
        if (!this.treeSitterService.isSupported(language)) {
            return decorators;
        }

        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            
            if (!tree) {
                return decorators;
            }

            // Get decorator query for this language
            const queries = this.treeSitterService.getLanguageQueries(language);
            if (!queries.decorators) {
                return decorators;
            }

            // Execute query
            const matches = this.treeSitterService.query(tree, queries.decorators);

            // Process matches
            for (const match of matches) {
                for (const capture of match.captures) {
                    if (['decorator.name', 'decorator.simple_name', 'attribute.name', 'annotation.name'].includes(capture.name)) {
                        const lineNumber = capture.node.startPosition.row;
                        const name = capture.node.text;

                        // Find corresponding args if any
                        const argsCapture = match.captures.find(c => ['decorator.args', 'attribute.args', 'annotation.args'].includes(c.name));
                        const args = argsCapture?.node.text;

                        decorators.push({
                            name,
                            arguments: args,
                            lineNumber
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('[SemanticAnalyzer] Failed to extract decorators:', error);
        }

        return decorators;
    }

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
    async extractGenerics(document: vscode.TextDocument): Promise<GenericInfo[]> {
        const generics: GenericInfo[] = [];
        const language = document.languageId;

        // Only TypeScript/JavaScript support generics
        if (!this.treeSitterService.isSupported(language)) {
            return generics;
        }

        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            
            if (!tree) {
                return generics;
            }

            // Get generics query for this language
            const queries = this.treeSitterService.getLanguageQueries(language);
            if (!queries.generics) {
                return generics;
            }

            // Execute query
            const matches = this.treeSitterService.query(tree, queries.generics);

            // Process matches
            for (const match of matches) {
                for (const capture of match.captures) {
                    if (capture.name === 'generic.param') {
                        const lineNumber = capture.node.startPosition.row;
                        const name = capture.node.text;

                        // Find corresponding constraint if any
                        const constraintCapture = match.captures.find(c => c.name === 'generic.constraint');
                        const constraint = constraintCapture?.node.text;

                        generics.push({
                            name,
                            constraint,
                            lineNumber
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('[SemanticAnalyzer] Failed to extract generics:', error);
        }

        return generics;
    }
}
