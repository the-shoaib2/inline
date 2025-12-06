// Enhanced extraction methods for ContextEngine
// This file contains the implementation of type-aware semantic analysis methods

import * as vscode from 'vscode';

// Import types from context-engine (will be available at runtime)
import type {
    ImportInfo, FunctionInfo, ClassInfo, InterfaceInfo, TypeInfo, VariableInfo,
    ParameterInfo, PropertyInfo, SymbolInfo, ScopeInfo, CursorIntent,
    ProjectConfig, StyleGuide, EditHistory
} from '../core/context-engine';

export class SemanticAnalyzer {
    /**
     * Extract detailed import information with type awareness
     */
    async extractImportsEnhanced(document: vscode.TextDocument): Promise<ImportInfo[]> {
        const text = document.getText();
        const imports: ImportInfo[] = [];
        const lines = text.split('\n');

        const language = document.languageId;

        if (language === 'typescript' || language === 'javascript') {
            // Match: import { foo, bar } from 'module'
            // Match: import foo from 'module'
            // Match: import * as foo from 'module'
            const importRegex = /^import\s+(?:{([^}]+)}|(\w+)|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/gm;
            let match;
            
            while ((match = importRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const namedImports = match[1];
                const defaultImport = match[2];
                const namespaceImport = match[3];
                const module = match[4];

                if (namedImports) {
                    const importNames = namedImports.split(',').map(i => i.trim());
                    imports.push({
                        module,
                        imports: importNames,
                        isDefault: false,
                        lineNumber
                    });
                } else if (defaultImport) {
                    imports.push({
                        module,
                        imports: [defaultImport],
                        isDefault: true,
                        lineNumber
                    });
                } else if (namespaceImport) {
                    imports.push({
                        module,
                        imports: [namespaceImport],
                        isDefault: false,
                        alias: namespaceImport,
                        lineNumber
                    });
                }
            }
        } else if (language === 'python') {
            // Match: from module import foo, bar
            // Match: import module
            const fromImportRegex = /^from\s+([\w.]+)\s+import\s+(.+)/gm;
            const importRegex = /^import\s+([\w.]+)(?:\s+as\s+(\w+))?/gm;
            
            let match;
            while ((match = fromImportRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const module = match[1];
                const importNames = match[2].split(',').map(i => i.trim());
                
                imports.push({
                    module,
                    imports: importNames,
                    isDefault: false,
                    lineNumber
                });
            }
            
            while ((match = importRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const module = match[1];
                const alias = match[2];
                
                imports.push({
                    module,
                    imports: [alias || module],
                    isDefault: false,
                    alias,
                    lineNumber
                });
            }
        }

        return imports;
    }

    /**
     * Extract detailed function information with parameters and types
     */
    async extractFunctionsEnhanced(document: vscode.TextDocument): Promise<FunctionInfo[]> {
        const text = document.getText();
        const functions: FunctionInfo[] = [];
        const language = document.languageId;

        if (language === 'typescript' || language === 'javascript') {
            // Match: function name(param1: type1, param2: type2): returnType {
            // Match: const name = (param1: type1) => returnType {
            // Match: async function name(...) {
            
            const functionRegex = /(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)(?:\s*:\s*([^{=]+))?\s*=>)/gm;
            let match;
            
            while ((match = functionRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1] || match[2];
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
        } else if (language === 'python') {
            // Match: def name(param1: type1, param2: type2) -> returnType:
            const functionRegex = /^(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/gm;
            let match;
            
            while ((match = functionRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1];
                const paramsStr = match[2];
                const returnType = match[3]?.trim();
                
                const parameters = this.parseParameters(paramsStr);
                const isAsync = match[0].includes('async');
                
                functions.push({
                    name,
                    signature: match[0].trim(),
                    parameters,
                    returnType,
                    lineNumber,
                    isAsync,
                    isExported: false // Python doesn't have explicit exports
                });
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

        if (language === 'typescript' || language === 'javascript') {
            // Match: class Name extends Base implements Interface {
            const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/gm;
            let match;
            
            while ((match = classRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1];
                const extendsClass = match[2];
                const implementsInterfaces = match[3]?.split(',').map(i => i.trim());
                const isExported = match[0].includes('export');
                
                // Extract methods and properties (simplified - would need full AST parsing for accuracy)
                const methods: FunctionInfo[] = [];
                const properties: PropertyInfo[] = [];
                
                classes.push({
                    name,
                    extends: extendsClass,
                    implements: implementsInterfaces,
                    methods,
                    properties,
                    lineNumber,
                    isExported
                });
            }
        } else if (language === 'python') {
            // Match: class Name(Base):
            const classRegex = /^class\s+(\w+)(?:\(([^)]+)\))?:/gm;
            let match;
            
            while ((match = classRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1];
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

        if (language === 'typescript') {
            // Match: interface Name extends Base {
            const interfaceRegex = /(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{/gm;
            let match;
            
            while ((match = interfaceRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1];
                const extendsInterfaces = match[2]?.split(',').map(i => i.trim());
                
                interfaces.push({
                    name,
                    extends: extendsInterfaces,
                    properties: [],
                    methods: [],
                    lineNumber
                });
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

        if (language === 'typescript') {
            // Match: type Name = definition
            const typeRegex = /(?:export\s+)?type\s+(\w+)\s*=\s*([^;]+);/gm;
            let match;
            
            while ((match = typeRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const name = match[1];
                const definition = match[2].trim();
                
                types.push({
                    name,
                    definition,
                    lineNumber
                });
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

        if (language === 'typescript' || language === 'javascript') {
            // Match: const/let/var name: type = value
            const varRegex = /(const|let|var)\s+(\w+)(?:\s*:\s*([^=]+))?\s*=\s*([^;]+);/gm;
            let match;
            
            while ((match = varRegex.exec(text)) !== null) {
                const lineNumber = text.substring(0, match.index).split('\n').length - 1;
                const isConst = match[1] === 'const';
                const name = match[2];
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
}
