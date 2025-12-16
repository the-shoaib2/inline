import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { SymbolExtractor } from '../../src/services/symbol-extractor';
import { InlineRenameProvider } from '../../src/providers/rename-provider';
import { InlineReferenceProvider } from '../../src/providers/reference-provider';
import { SymbolIndex } from '../../src/services/symbol-index';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';
import { SymbolExtractorRegistry } from '../../src/symbol-extractor-registry';

// Mock TreeSitterService
const mockTreeSitterService = {
    parse: vi.fn(),
    query: vi.fn(),
    getLanguageQueries: vi.fn().mockReturnValue({}),
} as unknown as TreeSitterService;

// Mock VS Code types
const mockUri = { fsPath: '/test/path.ts', toString: () => 'file:///test/path.ts' } as vscode.Uri;
const mockDocument = {
    uri: mockUri,
    languageId: 'typescript',
    getText: vi.fn().mockReturnValue('const testVariable = 123;'),
    getWordRangeAtPosition: vi.fn(),
    lineCount: 10
} as unknown as vscode.TextDocument;

// Mock wrapper for SymbolIndex to allow casting
const mockSymbolIndex = {
    findSymbol: vi.fn().mockReturnValue([]),
    index: {
        fileIndex: new Map([
           ['file:///test/path.ts', []]
        ])
    }
} as unknown as SymbolIndex;


describe('Navigation E2E - Strategy Pattern', () => {
    let symbolExtractor: SymbolExtractor;
    let renameProvider: InlineRenameProvider;
    let referenceProvider: InlineReferenceProvider;

    beforeEach(() => {
        // Reset registry
        const registry = SymbolExtractorRegistry.getInstance();
        registry.clear(); // Clear existing
        // Re-instantiate to re-register defaults
        symbolExtractor = new SymbolExtractor(mockTreeSitterService);
        
        renameProvider = new InlineRenameProvider(mockSymbolIndex, symbolExtractor, mockTreeSitterService);
        referenceProvider = new InlineReferenceProvider(mockSymbolIndex, symbolExtractor, mockTreeSitterService);
    });

    it('should validate identifiers using strategy', async () => {
        expect(symbolExtractor.isValidIdentifier('validVar', 'typescript')).toBe(true);
        expect(symbolExtractor.isValidIdentifier('123invalid', 'typescript')).toBe(false);
        expect(symbolExtractor.isValidIdentifier('valid_python', 'python')).toBe(true);
    });

    it('should find identifier nodes using strategy', () => {
        // Mock AST node structure
        const mockRoot = {
            type: 'program',
            children: [
                {
                    type: 'variable_declaration',
                    children: [
                        {
                            type: 'variable_declarator',
                            children: [
                                { type: 'identifier', text: 'testVariable' },
                                { type: 'number', text: '123' }
                            ]
                        }
                    ]
                }
            ],
            text: 'const testVariable = 123;'
        };
        
        // Recursive structure for children
        const addParent = (node: any) => {
            if (node.children) {
                node.children.forEach((c: any) => {
                    c.parent = node;
                    addParent(c);
                });
            }
        };
        addParent(mockRoot);

        const nodes = symbolExtractor.findIdentifierNodes(mockRoot, 'testVariable', 'typescript');
        expect(nodes.length).toBe(1);
        expect(nodes[0].text).toBe('testVariable');
        expect(nodes[0].type).toBe('identifier');
    });

    it('RenameProvider should validate name via strategy', async () => {
        vi.spyOn(mockDocument, 'getWordRangeAtPosition').mockReturnValue({} as vscode.Range);
        
        // Mock symbol check failure to avoid later errors, we strictly check validation first
        
        const result = await renameProvider.provideRenameEdits(
            mockDocument,
            { line: 0, character: 0 } as vscode.Position,
            '123Invalid', // Invalid name
            {} as vscode.CancellationToken
        );

        expect(result).toBeUndefined(); // Should return undefined for invalid name
    });
});

// Helper class to expose ReferenceProvider for testing if needed, 
// strictly InlineReferenceProvider is exported.
// Mock VS Code
vi.mock('vscode', () => ({
    Uri: { parse: (path: string) => ({ fsPath: path, toString: () => path }) },
    Range: class { 
        constructor(public start: any, public end: any) {}
        contains(pos: any) { return true; } // Simplified
    },
    Position: class { constructor(public line: number, public character: number) {} },
    WorkspaceEdit: class { replace() {} },
    window: {
        showErrorMessage: vi.fn(),
    },
    workspace: {
        openTextDocument: vi.fn(),
    }
}));

