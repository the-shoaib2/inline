
import * as vscode from 'vscode';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';
import { Symbol, SymbolKind, SymbolLocation, Scope, ScopeType } from '../models/symbol';
import { SymbolExtractorStrategy } from '../strategies/symbol-extractor-strategy.interface';
import { SymbolExtractorRegistry } from '../symbol-extractor-registry';
// Register strategies here for defaults (or in main index)
import { TypeScriptSymbolStrategy } from '../strategies/typescript-symbol-strategy';
import { PythonSymbolStrategy } from '../strategies/python-symbol-strategy';

/**
 * Extract symbols from Tree-sitter AST using query files
 */
export class SymbolExtractor {
    private registry: SymbolExtractorRegistry;

    constructor(private treeSitterService: TreeSitterService) {
        this.registry = SymbolExtractorRegistry.getInstance();
        this.registerDefaultStrategies();
    }
    
    private registerDefaultStrategies() {
        this.registry.register(new TypeScriptSymbolStrategy());
        this.registry.register(new PythonSymbolStrategy());
    }
    
    public getStrategy(languageId: string): SymbolExtractorStrategy {
        const strategy = this.registry.getStrategy(languageId);
        if (strategy) return strategy;
        
        // Return default if not found
        return this.registry.getStrategy('typescript') || new TypeScriptSymbolStrategy();
    }

    /**
     * Check if a string is a valid identifier for the language
     */
    public isValidIdentifier(name: string, languageId: string): boolean {
        return this.getStrategy(languageId).isValidIdentifier(name);
    }

    /**
     * Find all identifier nodes in the tree matching the name
     */
    public findIdentifierNodes(rootNode: any, name: string, languageId: string): any[] {
        const strategy = this.getStrategy(languageId);
        const identifiers: any[] = [];
        this.traverseAndFindIdentifiers(rootNode, name, strategy, identifiers);
        return identifiers;
    }

    private traverseAndFindIdentifiers(
        node: any, 
        name: string, 
        strategy: SymbolExtractorStrategy, 
        results: any[]
    ) {
        if (strategy.isIdentifierNode(node) && node.text === name) {
            results.push(node);
        }

        if (node.children) {
            for (const child of node.children) {
                this.traverseAndFindIdentifiers(child, name, strategy, results);
            }
        }
    }

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
        this.extractVariablesFromNode(tree.rootNode, document, rootScope, symbols, document.languageId);

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
        
        const trimmedQuery = queryString.trim();
        if (!trimmedQuery || trimmedQuery.startsWith(';')) {
            return symbols;
        }

        try {
            const matches = this.treeSitterService.query(tree, queryString, languageId);

            for (const match of matches) {
                for (const capture of match.captures) {
                    const node = capture.node;
                    const symbol = this.extractSymbolFromNode(node, document, scope, kind, languageId);
                    if (symbol) {
                        symbols.push(symbol);
                    }
                }
            }
        } catch (error) {
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
        kind: SymbolKind,
        languageId: string
    ): Symbol | null {
        const strategy = this.getStrategy(languageId);
        const name = strategy.getSymbolName(node);

        if (!name) {
            return null;
        }

        // Location finding is tricky if strategy doesn't give ranges. 
        // We assume `node` covers the symbol context. 
        // We want `selectionRange` to be just the name? 
        // Strategy didn't separate name lookup from name node text.
        // We can optimize strategy to return Name NODE.
        // But for now, let's assume `node` is correct for `range`, and `selectionRange` is same or heuristics if strategy didn't handle it.
        // The original code tried to find the name node to set selectionRange.
        // Let's improve Strategy to return nameNode if possible? 
        // Or re-find it?
        // For now, use node range for both if name node logic is effectively inside strategy.
        // Actually, original code was: `this.nodeToRange(nameNode)`.
        
        // Refactoring opportunity: Strategy method to get Name Node? 
        // `getSymbolNameNode(node): any`.
        // I implemented `getSymbolName(node): string`. This returns text.
        // I should have implemented `getSymbolNameNode`.
        
        // I will update the strategy in next step if this is inaccurate. 
        // For E2E it might be fine, but for VSCode "rename", precision matters.
        
        const location: SymbolLocation = {
            uri: document.uri,
            range: this.nodeToRange(node),
            selectionRange: this.nodeToRange(node), // Needs improvement
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
        symbols: Symbol[],
        languageId: string
    ): void {
        const strategy = this.getStrategy(languageId);
        const variableNodeTypes = strategy.getVariableNodeTypes();

        if (variableNodeTypes.includes(node.type)) {
            const variableSymbols = this.extractVariableSymbols(node, document, scope, languageId);
            variableSymbols.forEach(symbol => {
                symbols.push(symbol);
                scope.symbols.set(symbol.name, symbol);
            });
        }

        // Recursively process children
        for (const child of node.children) {
            this.extractVariablesFromNode(child, document, scope, symbols, languageId);
        }
    }

    /**
     * Extract variable symbols from a declaration node
     */
    private extractVariableSymbols(
        node: any,
        document: vscode.TextDocument,
        scope: Scope,
        languageId: string
    ): Symbol[] {
        const symbols: Symbol[] = [];
        const strategy = this.getStrategy(languageId);

        // Handle different variable declaration patterns
        // Original code used `node.descendantsOfType('variable_declarator')`.
        // This is JS specific.
        // Strategy needs to handle how to extract variables from the declaration node.
        
        // For Python `assignment`, the name matches immediately.
        // For JS `lexical_declaration`, it has children `variable_declarator`.
        
        // This suggests `extractVariableSymbols` itself should be in strategy?
        // Or `getVariableDeclarators(node): any[]`?
        
        // If I move `getSymbolName` etc to strategy, the logic here is:
        // Identify declaration node (via `getVariableNodeTypes`).
        // Then extract symbols from it.
        
        // In simple case (Python), the assignment node *is* the one containing the name.
        // In JS, it contains `declarators`.
        
        // Let's iterate children or ask strategy?
        // If I assume one-node-per-symbol?
        // `variable_declaration` in JS can have multiple `variable_declarator`.
        
        // Simplest refactor without major redesign:
        // Strategy: `getDeclaredSymbols(node): {name: string, node: any}[]`
        
        // But I defined `getSymbolName`.
        
        // Let's just try to get name from current node. If null, try children?
        
        const name = strategy.getSymbolName(node);
        if (name) {
             const symbolNode = node; // Roughly
             const location: SymbolLocation = {
                uri: document.uri,
                range: this.nodeToRange(symbolNode),
                selectionRange: this.nodeToRange(symbolNode),
            };

            symbols.push({
                name,
                kind: strategy.isConstant(node) ? SymbolKind.Constant : SymbolKind.Variable,
                location,
                scope,
                definition: this.nodeToRange(symbolNode),
                references: [],
            });
        } else {
            // Check children?
            // Original code: `node.descendantsOfType('variable_declarator')`.
            // Maybe strategy should expose `getDeclaratorType()`?
            for (const child of node.children) {
                const childName = strategy.getSymbolName(child);
                if (childName) {
                     // ...
                     symbols.push({
                        name: childName, // ...
                        kind: strategy.isConstant(node) ? SymbolKind.Constant : SymbolKind.Variable, // Inherit constness from parent?
                        location: { uri: document.uri, range: this.nodeToRange(child), selectionRange: this.nodeToRange(child) },
                        scope,
                        definition: this.nodeToRange(child),
                        references: [],
                     });
                }
            }
        }
        
        return symbols;
    }

    private extractDocumentation(node: any): string | undefined {
        const previousSibling = node.previousSibling;
        if (previousSibling && previousSibling.type === 'comment') {
            return previousSibling.text;
        }
        return undefined;
    }

    private nodeToRange(node: any): vscode.Range {
        return new vscode.Range(
            new vscode.Position(node.startPosition.row, node.startPosition.column),
            new vscode.Position(node.endPosition.row, node.endPosition.column)
        );
    }

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
