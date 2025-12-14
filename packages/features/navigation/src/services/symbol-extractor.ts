import * as vscode from 'vscode';
import Parser from 'web-tree-sitter';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';
import { Symbol, SymbolKind, SymbolLocation, Scope, ScopeType, SymbolReference } from '../models/symbol';

/**
 * Extract symbols from Tree-sitter AST
 */
export class SymbolExtractor {
    constructor(private treeSitterService: TreeSitterService) {}

    /**
     * Extract all symbols from a document
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

        // Extract symbols based on language
        this.extractFromNode(tree.rootNode, document, rootScope, symbols);

        return symbols;
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
     * Extract symbols from a syntax node
     */
    private extractFromNode(
        node: any,
        document: vscode.TextDocument,
        scope: Scope,
        symbols: Symbol[]
    ): void {
        // Function declarations
        if (this.isFunctionDeclaration(node)) {
            const symbol = this.extractFunctionSymbol(node, document, scope);
            if (symbol) {
                symbols.push(symbol);
                scope.symbols.set(symbol.name, symbol);
            }
        }

        // Class declarations
        if (this.isClassDeclaration(node)) {
            const symbol = this.extractClassSymbol(node, document, scope);
            if (symbol) {
                symbols.push(symbol);
                scope.symbols.set(symbol.name, symbol);
            }
        }

        // Variable declarations
        if (this.isVariableDeclaration(node)) {
            const variableSymbols = this.extractVariableSymbols(node, document, scope);
            variableSymbols.forEach(symbol => {
                symbols.push(symbol);
                scope.symbols.set(symbol.name, symbol);
            });
        }

        // Recursively process children
        for (const child of node.children) {
            this.extractFromNode(child, document, scope, symbols);
        }
    }

    /**
     * Check if node is a function declaration
     */
    private isFunctionDeclaration(node: any): boolean {
        return [
            'function_declaration',
            'function',
            'arrow_function',
            'method_definition',
            'function_definition', 
        ].includes(node.type);
    }

    /**
     * Check if node is a class declaration
     */
    private isClassDeclaration(node: any): boolean {
        return [
            'class_declaration',
            'class',
            'class_definition', 
        ].includes(node.type);
    }

    /**
     * Check if node is a variable declaration
     */
    private isVariableDeclaration(node: any): boolean {
        return [
            'variable_declaration',
            'lexical_declaration',
            'variable_declarator',
            'assignment', 
        ].includes(node.type);
    }

    /**
     * Extract function symbol
     */
    private extractFunctionSymbol(
        node: any,
        document: vscode.TextDocument,
        scope: Scope
    ): Symbol | null {
        const nameNode = node.childForFieldName('name');
        if (!nameNode) {
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
            kind: SymbolKind.Function,
            location,
            scope,
            definition: this.nodeToRange(node),
            references: [],
            documentation: this.extractDocumentation(node),
        };
    }

    /**
     * Extract class symbol
     */
    private extractClassSymbol(
        node: any,
        document: vscode.TextDocument,
        scope: Scope
    ): Symbol | null {
        const nameNode = node.childForFieldName('name');
        if (!nameNode) {
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
            kind: SymbolKind.Class,
            location,
            scope,
            definition: this.nodeToRange(node),
            references: [],
            documentation: this.extractDocumentation(node),
        };
    }

    /**
     * Extract variable symbols
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
            const nameNode = declarator.childForFieldName('name');
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
        // Check for const keyword
        return node.text.trim().startsWith('const ');
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
