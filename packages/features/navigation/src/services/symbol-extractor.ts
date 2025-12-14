import * as vscode from 'vscode';
import Parser from 'web-tree-sitter';
import { TreeSitterService, QueryMatch } from '@inline/language/parsers/tree-sitter-service';
import { Symbol, SymbolKind, SymbolLocation, Scope, ScopeType, SymbolReference } from '../models/symbol';

/**
 * Extract symbols from Tree-sitter AST using query files
 */
export class SymbolExtractor {
    constructor(private treeSitterService: TreeSitterService) {}

    /**
     * Extract all symbols from a document using Tree-sitter queries
     */
    async extractSymbols(
        document: vscode.TextDocument
    ): Promise<Symbol[]> {
        const tree = await this.treeSitterService.parse(
            document.getText(),
            document.languageId
        );

        if (!tree) {
            return [];
        }

        const symbols: Symbol[] = [];
        const rootScope = this.createRootScope(document);

        // Load language-specific queries
        const queries = this.treeSitterService.getLanguageQueries(document.languageId);

        // Extract functions using queries
        if (queries.functions) {
            const functionSymbols = this.extractSymbolsFromQuery(
                tree,
                queries.functions,
                document,
                rootScope,
                SymbolKind.Function,
                document.languageId
            );
            symbols.push(...functionSymbols);
            functionSymbols.forEach(s => rootScope.symbols.set(s.name, s));
        }

        // Extract classes using queries
        if (queries.classes) {
            const classSymbols = this.extractSymbolsFromQuery(
                tree,
                queries.classes,
                document,
                rootScope,
                SymbolKind.Class,
                document.languageId
            );
            symbols.push(...classSymbols);
            classSymbols.forEach(s => rootScope.symbols.set(s.name, s));
        }

        // Extract imports using queries
        if (queries.imports) {
            const importSymbols = this.extractSymbolsFromQuery(
                tree,
                queries.imports,
                document,
                rootScope,
                SymbolKind.Module,
                document.languageId
            );
            symbols.push(...importSymbols);
            importSymbols.forEach(s => rootScope.symbols.set(s.name, s));
        }

        // Extract decorators using queries
        if (queries.decorators) {
            const decoratorSymbols = this.extractSymbolsFromQuery(
                tree,
                queries.decorators,
                document,
                rootScope,
                SymbolKind.Property, // Use Property kind for decorators
                document.languageId
            );
            symbols.push(...decoratorSymbols);
            decoratorSymbols.forEach(s => rootScope.symbols.set(s.name, s));
        }

        // Extract generics using queries
        if (queries.generics) {
            const genericSymbols = this.extractSymbolsFromQuery(
                tree,
                queries.generics,
                document,
                rootScope,
                SymbolKind.TypeAlias, // Use TypeAlias for generic type parameters
                document.languageId
            );
            symbols.push(...genericSymbols);
            genericSymbols.forEach(s => rootScope.symbols.set(s.name, s));
        }

        // Also extract variables using traditional AST traversal (as fallback)
        this.extractVariablesFromNode(tree.rootNode, document, rootScope, symbols);

        return symbols;
    }

    /**
     * Extract symbols from a Tree-sitter query
     */
    private extractSymbolsFromQuery(
        tree: any,
        queryString: string,
        document: vscode.TextDocument,
        scope: Scope,
        kind: SymbolKind,
        languageId: string
    ): Symbol[] {
        const symbols: Symbol[] = [];
        
        // Skip empty or comment-only queries
        const trimmedQuery = queryString.trim();
        if (!trimmedQuery || trimmedQuery.startsWith(';')) {
            return symbols;
        }

        try {
            const matches = this.treeSitterService.query(tree, queryString, languageId);

            for (const match of matches) {
                for (const capture of match.captures) {
                    const node = capture.node;
                    const symbol = this.extractSymbolFromNode(node, document, scope, kind);
                    if (symbol) {
                        symbols.push(symbol);
                    }
                }
            }
        } catch (error) {
            // Query execution failed, skip silently
            console.warn(`Failed to execute query for ${languageId}:`, error);
        }

        return symbols;
    }

    /**
     * Extract a symbol from a syntax node
     */
    private extractSymbolFromNode(
        node: any,
        document: vscode.TextDocument,
        scope: Scope,
        kind: SymbolKind
    ): Symbol | null {
        // Try to get the name from various field names
        let nameNode = node.childForFieldName('name');
        
        // Fallback strategies for different node types
        if (!nameNode) {
            // For some languages, the name might be in different fields
            nameNode = node.childForFieldName('identifier') 
                    || node.childForFieldName('declarator')
                    || node.childForFieldName('type_identifier');
        }

        // If still no name node, try to find identifier child
        if (!nameNode) {
            for (const child of node.children) {
                if (child.type === 'identifier' || child.type === 'type_identifier') {
                    nameNode = child;
                    break;
                }
            }
        }

        // If we still can't find a name, skip this node
        if (!nameNode || !nameNode.text) {
            return null;
        }

        const name = nameNode.text;
        const location: SymbolLocation = {
            uri: document.uri,
            range: this.nodeToRange(node),
            selectionRange: this.nodeToRange(nameNode),
        };

        return {
            name,
            kind,
            location,
            scope,
            definition: this.nodeToRange(node),
            references: [],
            documentation: this.extractDocumentation(node),
        };
    }

    /**
     * Extract variables from AST (fallback method)
     */
    private extractVariablesFromNode(
        node: any,
        document: vscode.TextDocument,
        scope: Scope,
        symbols: Symbol[]
    ): void {
        // Common variable declaration node types across languages
        const variableNodeTypes = [
            'variable_declaration',
            'lexical_declaration',
            'const_declaration',
            'let_declaration',
            'var_declaration',
        ];

        if (variableNodeTypes.includes(node.type)) {
            const variableSymbols = this.extractVariableSymbols(node, document, scope);
            variableSymbols.forEach(symbol => {
                symbols.push(symbol);
                scope.symbols.set(symbol.name, symbol);
            });
        }

        // Recursively process children
        for (const child of node.children) {
            this.extractVariablesFromNode(child, document, scope, symbols);
        }
    }

    /**
     * Extract variable symbols from a declaration node
     */
    private extractVariableSymbols(
        node: any,
        document: vscode.TextDocument,
        scope: Scope
    ): Symbol[] {
        const symbols: Symbol[] = [];

        // Handle different variable declaration patterns
        const declarators = node.descendantsOfType('variable_declarator');
        
        for (const declarator of declarators) {
            const nameNode = declarator.childForFieldName('name') 
                          || declarator.childForFieldName('identifier');
            if (!nameNode) {
                continue;
            }

            const name = nameNode.text;
            const location: SymbolLocation = {
                uri: document.uri,
                range: this.nodeToRange(declarator),
                selectionRange: this.nodeToRange(nameNode),
            };

            symbols.push({
                name,
                kind: this.isConstant(node) ? SymbolKind.Constant : SymbolKind.Variable,
                location,
                scope,
                definition: this.nodeToRange(declarator),
                references: [],
            });
        }

        return symbols;
    }

    /**
     * Check if variable is a constant
     */
    private isConstant(node: any): boolean {
        // Check for const keyword in the node text or type
        return node.text.trim().startsWith('const ') || 
               node.type === 'const_declaration';
    }

    /**
     * Extract documentation from node
     */
    private extractDocumentation(node: any): string | undefined {
        // Look for JSDoc or comment above the node
        const previousSibling = node.previousSibling;
        if (previousSibling && previousSibling.type === 'comment') {
            return previousSibling.text;
        }
        return undefined;
    }

    /**
     * Convert syntax node to VS Code range
     */
    private nodeToRange(node: any): vscode.Range {
        return new vscode.Range(
            new vscode.Position(node.startPosition.row, node.startPosition.column),
            new vscode.Position(node.endPosition.row, node.endPosition.column)
        );
    }

    /**
     * Create root scope for a document
     */
    private createRootScope(document: vscode.TextDocument): Scope {
        return {
            type: ScopeType.Module,
            range: new vscode.Range(
                new vscode.Position(0, 0),
                new vscode.Position(document.lineCount - 1, 0)
            ),
            symbols: new Map(),
            children: [],
        };
    }

    /**
     * Find symbol at position
     */
    async findSymbolAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position
    ): Promise<Symbol | null> {
        const symbols = await this.extractSymbols(document);
        
        for (const symbol of symbols) {
            if (symbol.location.range.contains(position)) {
                return symbol;
            }
        }

        return null;
    }
}
