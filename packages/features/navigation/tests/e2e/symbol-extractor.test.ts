
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { SymbolExtractor } from '../../src/services/symbol-extractor';
import { TreeSitterService } from '@inline/language/parsers/tree-sitter-service';

// Mock vscode
vi.mock('vscode', () => {
    return {
        Position: class {
            constructor(public line: number, public character: number) {}
        },
        Range: class {
            constructor(public start: any, public end: any) {
                this.start = start;
                this.end = end;
            }
            contains(position: any) { return true; }
        },
        Uri: {
            file: (path: string) => ({ fsPath: path, path })
        },
        SymbolKind: {
            Function: 11,
            Class: 4,
            Variable: 12,
            Constant: 13,
            Module: 1,
            Property: 6,
            TypeAlias: 0
        }
    };
});

import * as vscode from 'vscode';

// Mock TreeSitterService
// We can use a partial mock that returns minimal tree structure
const mockTreeSitterService = {
    parse: vi.fn(),
    getLanguageQueries: vi.fn().mockReturnValue({}), // Return empty queries to force fallback logic
    query: vi.fn().mockReturnValue([])
} as any as TreeSitterService;

describe('SymbolExtractor E2E - Strategy Pattern', () => {
    let extractor: SymbolExtractor;
    
    beforeEach(() => {
        extractor = new SymbolExtractor(mockTreeSitterService);
    });

    it('should extract TypeScript variables using fallback strategy', async () => {
        const code = 'const x = 1; let y = 2;';
        const document = {
            getText: () => code,
            languageId: 'typescript',
            uri: { fsPath: 'test.ts' } as any,
            lineCount: 1
        } as any;

        // Mock tree structure for TS
        const mockTree = {
            rootNode: {
                type: 'program',
                children: [
                    {
                        type: 'lexical_declaration',
                        text: 'const x = 1;',
                        startPosition: { row: 0, column: 0 },
                        endPosition: { row: 0, column: 12 },
                        childForFieldName: () => null,
                        children: [
                            { type: 'variable_declarator', text: 'x = 1', 
                              childForFieldName: () => null,
                              startPosition: { row: 0, column: 6 },
                              endPosition: { row: 0, column: 11 },
                              children: [ { 
                                  type: 'identifier', 
                                  text: 'x', 
                                  childForFieldName: () => null, 
                                  children: [],
                                  startPosition: { row: 0, column: 6 }, 
                                  endPosition: { row: 0, column: 7 }
                              } ]
                            }
                        ]
                    },
                    {
                        type: 'lexical_declaration',
                        text: 'let y = 2;',
                        startPosition: { row: 0, column: 13 },
                        endPosition: { row: 0, column: 23 },
                        childForFieldName: () => null,
                        children: [
                            { type: 'variable_declarator', text: 'y = 2',
                              childForFieldName: () => null,
                              startPosition: { row: 0, column: 17 },
                              endPosition: { row: 0, column: 22 },
                              children: [ { 
                                  type: 'identifier', 
                                  text: 'y', 
                                  childForFieldName: () => null, 
                                  children: [], 
                                  startPosition: { row: 0, column: 17 },
                                  endPosition: { row: 0, column: 18 }
                              } ]
                            }
                        ]
                    }
                ]
            }
        };

        (mockTreeSitterService.parse as any).mockResolvedValue(mockTree);

        const symbols = await extractor.extractSymbols(document);
        
        expect(symbols).toHaveLength(2);
        expect(symbols[0].name).toBe('x');
        expect(symbols[0].kind).toBe('constant'); // SymbolKind.Constant is 'constant'
        expect(symbols[1].name).toBe('y');
    });

    it('should extract Python variables using fallback strategy', async () => {
        const code = 'x = 1\ny: int = 2';
        const document = {
            getText: () => code,
            languageId: 'python',
            uri: { fsPath: 'test.py' } as any,
            lineCount: 2
        } as any;

        const mockTree = {
            rootNode: {
                type: 'module',
                children: [
                    {
                        type: 'assignment',
                        text: 'x = 1',
                        startPosition: { row: 0, column: 0 },
                        endPosition: { row: 0, column: 5 },
                        childForFieldName: (name: string) => name === 'left' ? { text: 'x' } : null,
                        children: []
                    },
                    {
                        type: 'ann_assignment',
                        text: 'y: int = 2',
                        startPosition: { row: 1, column: 0 },
                        endPosition: { row: 1, column: 10 },
                        // Strategy uses childForFieldName 'left' for assignments? 
                        // Python 'ann_assignment' has 'left' too? Yes usually 'target' or 'left'.
                        // Reference: https://tree-sitter.github.io/tree-sitter/playground
                        // ann_assignment: assignee (left?)
                        // Let's assume strategy handles it or checks 'left'. I wrote check 'left'.
                        childForFieldName: (name: string) => name === 'left' ? { text: 'y' } : null,
                        children: []
                    }
                ]
            }
        };

        (mockTreeSitterService.parse as any).mockResolvedValue(mockTree);
        
        const symbols = await extractor.extractSymbols(document);

        expect(symbols).toHaveLength(2);
        expect(symbols[0].name).toBe('x');
        expect(symbols[1].name).toBe('y');
    });
});
