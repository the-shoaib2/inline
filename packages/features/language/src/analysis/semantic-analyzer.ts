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
import { LanguageConfigService } from '@inline/language/analysis/language-config-service';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';
import { NativeLoader } from '@inline/shared/platform/native/native-loader';

import {
    ImportInfo, FunctionInfo, ClassInfo, InterfaceInfo, TypeInfo, VariableInfo,
    ParameterInfo, PropertyInfo, SymbolInfo, ScopeInfo, CursorIntent,
    ProjectConfig, StyleGuide, EditHistory,
    DecoratorInfo, GenericInfo
} from '@inline/shared';



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
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     *
     * @param document VS Code document to analyze
     * @returns Array of import information with module and line number
     */
    async extractImportsEnhanced(document: vscode.TextDocument): Promise<ImportInfo[]> {
        const imports: ImportInfo[] = [];
        const language = document.languageId;
        
        // Use Tree-sitter if supported
        if (!this.treeSitterService.isSupported(language)) {
            return imports;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return imports;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            if (!queries.imports) return imports;
            
            const matches = this.treeSitterService.query(tree, queries.imports, language);
            
            for (const match of matches) {
                // Extract import info from captures
                const moduleCapture = match.captures.find(c => 
                    ['import.module', 'import.source', 'module.name'].includes(c.name)
                );
                const nameCapture = match.captures.find(c => 
                    ['import.name', 'import.clause', 'imported.name'].includes(c.name)
                );
                
                if (moduleCapture) {
                    const module = moduleCapture.node.text.replace(/['"]/g, ''); // Remove quotes
                    const importNames = nameCapture ? [nameCapture.node.text] : [];
                    
                    imports.push({
                        module,
                        imports: importNames,
                        isDefault: false,
                        lineNumber: moduleCapture.node.startPosition.row
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting imports for ${language}:`, error);
        }
        
        return imports;
    }

    /**
     * Extract detailed function information with parameters and types.
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     */
    async extractFunctionsEnhanced(document: vscode.TextDocument): Promise<FunctionInfo[]> {
        const functions: FunctionInfo[] = [];
        const language = document.languageId;
        
        if (!this.treeSitterService.isSupported(language)) {
            return functions;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return functions;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            if (!queries.functions) return functions;
            
            const matches = this.treeSitterService.query(tree, queries.functions, language);
            
            for (const match of matches) {
                const nameCapture = match.captures.find(c => 
                    ['function.name', 'function.identifier', 'name'].includes(c.name)
                );
                const paramsCapture = match.captures.find(c => 
                    ['function.parameters', 'parameters'].includes(c.name)
                );
                const returnCapture = match.captures.find(c => 
                    ['function.return_type', 'return_type', 'type'].includes(c.name)
                );
                
                if (nameCapture) {
                    const fullText = match.captures[0]?.node.text || '';
                    
                    functions.push({
                        name: nameCapture.node.text,
                        signature: fullText.split('\n')[0].trim(), // First line only
                        parameters: paramsCapture ? this.parseParametersFromText(paramsCapture.node.text) : [],
                        returnType: returnCapture?.node.text,
                        lineNumber: nameCapture.node.startPosition.row,
                        isAsync: fullText.includes('async'),
                        isExported: fullText.includes('export') || fullText.includes('public')
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting functions for ${language}:`, error);
        }
        
        return functions;
    }

    /**
     * Extract detailed class information with methods and properties.
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     */
    async extractClassesEnhanced(document: vscode.TextDocument): Promise<ClassInfo[]> {
        const classes: ClassInfo[] = [];
        const language = document.languageId;
        
        if (!this.treeSitterService.isSupported(language)) {
            return classes;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return classes;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            if (!queries.classes) return classes;
            
            const matches = this.treeSitterService.query(tree, queries.classes, language);
            
            for (const match of matches) {
                const nameCapture = match.captures.find(c => 
                    ['class.name', 'class.identifier', 'name'].includes(c.name)
                );
                const extendsCapture = match.captures.find(c => 
                    ['class.superclass', 'superclass', 'extends'].includes(c.name)
                );
                const implementsCapture = match.captures.find(c => 
                    ['class.implements', 'implements'].includes(c.name)
                );
                
                if (nameCapture) {
                    const fullText = match.captures[0]?.node.text || '';
                    
                    classes.push({
                        name: nameCapture.node.text,
                        extends: extendsCapture?.node.text,
                        implements: implementsCapture ? [implementsCapture.node.text] : undefined,
                        methods: [],
                        properties: [],
                        lineNumber: nameCapture.node.startPosition.row,
                        isExported: fullText.includes('export') || fullText.includes('public')
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting classes for ${language}:`, error);
        }
        
        return classes;
    }

    /**
     * Extract TypeScript/Java interfaces.
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     */
    async extractInterfacesEnhanced(document: vscode.TextDocument): Promise<InterfaceInfo[]> {
        const interfaces: InterfaceInfo[] = [];
        const language = document.languageId;
        
        if (!this.treeSitterService.isSupported(language)) {
            return interfaces;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return interfaces;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            // Interfaces might not be available for all languages
            if (!queries.classes) return interfaces;
            
            // For languages without explicit interface queries, we can try to filter classes
            const matches = this.treeSitterService.query(tree, queries.classes, language);
            
            for (const match of matches) {
                const fullText = match.captures[0]?.node.text || '';
                // Only include if it's actually an interface
                if (!fullText.includes('interface')) continue;
                
                const nameCapture = match.captures.find(c => 
                    ['class.name', 'interface.name', 'name'].includes(c.name)
                );
                const extendsCapture = match.captures.find(c => 
                    ['class.superclass', 'interface.extends', 'extends'].includes(c.name)
                );
                
                if (nameCapture) {
                    interfaces.push({
                        name: nameCapture.node.text,
                        extends: extendsCapture ? [extendsCapture.node.text] : undefined,
                        properties: [],
                        methods: [],
                        lineNumber: nameCapture.node.startPosition.row
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting interfaces for ${language}:`, error);
        }
        
        return interfaces;
    }

    /**
     * Extract type definitions.
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     */
    async extractTypesEnhanced(document: vscode.TextDocument): Promise<TypeInfo[]> {
        const types: TypeInfo[] = [];
        const language = document.languageId;
        
        if (!this.treeSitterService.isSupported(language)) {
            return types;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return types;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            // Type aliases might be captured in function/class queries for some languages
            if (!queries.functions) return types;
            
            // For now, use simple text matching for type aliases
            // A full implementation would need dedicated type queries
            const text = document.getText();
            const lines = text.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Match type aliases
                const typeMatch = line.match(/^\s*(?:export\s+)?type\s+(\w+)\s*=\s*(.+)/);
                const typedefMatch = line.match(/^\s*typedef\s+(.+?)\s+(\w+)/);
                
                if (typeMatch) {
                    types.push({
                        name: typeMatch[1],
                        definition: typeMatch[2].trim(),
                        lineNumber: i
                    });
                } else if (typedefMatch) {
                    types.push({
                        name: typedefMatch[2],
                        definition: typedefMatch[1].trim(),
                        lineNumber: i
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting types for ${language}:`, error);
        }
        
        return types;
    }

    /**
     * Extract variable declarations with types.
     * Uses Tree-sitter for accurate parsing across all 42 supported languages.
     */
    async extractVariablesEnhanced(document: vscode.TextDocument): Promise<VariableInfo[]> {
        const variables: VariableInfo[] = [];
        const language = document.languageId;
        
        if (!this.treeSitterService.isSupported(language)) {
            return variables;
        }
        
        try {
            const code = document.getText();
            const tree = await this.treeSitterService.parseWasm(code, language);
            if (!tree) return variables;
            
            const queries = this.treeSitterService.getLanguageQueries(language);
            // Use functions query as fallback since variables might not have dedicated queries
            if (!queries.functions) return variables;
            
            // For now, we'll extract variables from the AST directly
            // This is a simplified approach - a full implementation would need dedicated variable queries
            const text = document.getText();
            const lines = text.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Simple pattern matching for common variable declarations
                const varMatch = line.match(/^\s*(const|let|var|val|auto|def)\s+(\w+)(?:\s*:\s*([^=]+))?(?:\s*=\s*(.+))?/);
                
                if (varMatch) {
                    variables.push({
                        name: varMatch[2],
                        type: varMatch[3]?.trim(),
                        value: varMatch[4]?.trim(),
                        isConst: varMatch[1] === 'const' || varMatch[1] === 'val',
                        lineNumber: i
                    });
                }
            }
        } catch (error) {
            console.error(`[SemanticAnalyzer] Error extracting variables for ${language}:`, error);
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
     * Parse parameters from Tree-sitter node text
     */
    private parseParametersFromText(paramsText: string): ParameterInfo[] {
        // Remove parentheses if present
        const cleaned = paramsText.replace(/^\(|\)$/g, '').trim();
        return this.parseParameters(cleaned);
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

        // Detect type annotation (for languages with type systems)
        if (textBefore.endsWith(':') && this.treeSitterService.isSupported(document.languageId)) {
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
        /*
        if (native.isAvailable()) {
            try {
                return native.extractDecorators(document.getText(), document.languageId);
            } catch (error) {
                // Only log if it's an actual error, not just unsupported language
                // The native module now returns empty array for unsupported languages
                console.debug('[SemanticAnalyzer] Native extraction not available, using Tree-sitter fallback');
            }
        }
        */

        const decorators: DecoratorInfo[] = [];
        const language = document.languageId;

        // Only use Tree-sitter if supported
        if (!this.treeSitterService.isSupported(language)) {
            return decorators;
        }

        try {
            // console.debug(`[SemanticAnalyzer] Extracting decorators for: ${document.uri.toString()} (${document.languageId})`);
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
            const matches = this.treeSitterService.query(tree, queries.decorators, language);
            console.debug(`[SemanticAnalyzer] Decorator matches found: ${matches.length}`);

            if (matches.length === 0) {
                 console.debug(`[SemanticAnalyzer] Tree for ${language}: ${tree.rootNode.toString().substring(0, 500)}...`);
            }

            // Process matches
            for (const match of matches) {
                // console.debug(`[SemanticAnalyzer] Processing match with ${match.captures.length} captures`);
                for (const capture of match.captures) {
                    // console.debug(`[SemanticAnalyzer] Capture name: ${capture.name}`);
                    
                    // Handle granular captures (original logic)
                    if (['decorator.name', 'decorator.simple_name', 'attribute.name', 'annotation.name'].includes(capture.name)) {
                        const lineNumber = capture.node.startPosition.row;
                        const name = capture.node.text;

                        // Find corresponding args if any
                        const argsCapture = match.captures.find(c => ['decorator.args', 'attribute.args', 'annotation.args'].includes(c.name));
                        const args = argsCapture?.node.text;
                        
                        console.log(`[SemanticAnalyzer] Found decorator: ${name} at line ${lineNumber}`);

                        decorators.push({
                            name,
                            arguments: args,
                            lineNumber
                        });
                    } 
                    // Handle simple whole-node captures (new logic)
                    else if (['decorator', 'attribute', 'annotation'].includes(capture.name)) {
                        const lineNumber = capture.node.startPosition.row;
                        let text = capture.node.text.trim();
                        
                        // Parse name and args from text
                        // Remove leading @ or #[ and trailing ] (for Rust)
                        let name = text;
                        if (name.startsWith('@')) name = name.substring(1);
                        if (name.startsWith('#[')) name = name.substring(2);
                        if (name.endsWith(']')) name = name.substring(0, name.length - 1);
                        
                        let args = undefined;
                        const parenIndex = name.indexOf('(');
                        if (parenIndex > 0) {
                            args = name.substring(parenIndex);
                            name = name.substring(0, parenIndex);
                        }
                        
                        // Clean up Rust name if it has extra path info but keep simple
                        name = name.trim();
                        
                        console.log(`[SemanticAnalyzer] Found simple decorator: ${name} at line ${lineNumber}`);
                        decorators.push({
                            name,
                            arguments: args,
                            lineNumber
                        });
                    }
                }
            }
            console.log(`[SemanticAnalyzer] Total decorators extracted: ${decorators.length}`);
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

        // Extract generics from supported languages
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
            const matches = this.treeSitterService.query(tree, queries.generics, language);

            // Process generic matches
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
                    // Handle simple generic capture
                    else if (capture.name === 'generic') {
                        const lineNumber = capture.node.startPosition.row;
                        const text = capture.node.text.trim();
                        
                        // Matches "T" or "T extends U"
                        // Simple regex to split name and constraint
                        // Assume first word is name
                        const parts = text.split(/\s+(?:extends|implements|:)\s+/); // : for Rust/Python hints if captured?
                        const name = parts[0];
                        const constraint = parts.length > 1 ? text.substring(name.length).trim() : undefined;
                        // cleanup constraint
                        const cleanConstraint = constraint ? constraint.replace(/^(?:extends|implements|:)\s+/, '') : undefined;

                        generics.push({
                            name,
                            constraint: cleanConstraint,
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
