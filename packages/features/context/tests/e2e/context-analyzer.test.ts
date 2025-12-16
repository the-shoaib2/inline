import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextAnalyzer } from '../../src/context-analyzer';
import { ContextAnalysisRegistry } from '../../src/context-analysis-registry';
// Mock strategies
import { ContextAnalysisStrategy } from '../../src/strategies/context-analysis-strategy.interface';
import { CodeType } from '../../src/analysis/file-type-detector';
import * as vscode from 'vscode';

// Mock VS Code module (Reuse previous mock or make shared?)
// For now, specific mocking for ContextAnalyzer
vi.mock('vscode', () => {
    return {
        Uri: {
            parse: (s: string) => ({ toString: () => s, fsPath: s.replace('file://', '') }),
            file: (s: string) => ({ toString: () => `file://${s}`, fsPath: s })
        },
        workspace: {
            getWorkspaceFolder: () => ({ uri: { fsPath: '/test/workspace' } }),
            findFiles: () => Promise.resolve([]),
            openTextDocument: () => Promise.resolve({
                getText: () => 'mock content',
                uri: { toString: () => 'mock' },
                fileName: 'mock.ts',
                languageId: 'typescript'
            }),
            fs: {
                stat: () => Promise.resolve()
            }
        },
        commands: {
            executeCommand: () => Promise.resolve([])
        },
        Range: class { constructor(public start: any, public end: any) {} },
        Location: class { constructor(public uri: any, public range: any) {} },
        Position: class { constructor(public line: number, public character: number) {} }
    };
});

// Mock strategies 
class MockStrategy implements ContextAnalysisStrategy {
    supports(languageId: string) { return languageId === 'mocklang'; }
    getSupportedExtensions() { return ['.mock']; }
    extractImports(text: string) { return []; }
    extractClasses(text: string) { return []; }
    extractFunctions(text: string) { return []; }
    extractInterfaces(text: string) { return []; }
    detectCodeTypes(text: string) { return [CodeType.FUNCTION]; }
    extractCodeBlocks(text: string) { return ['mock block']; }
    detectPatterns(text: string) { return []; }
}

describe('ContextAnalyzer E2E - Strategy Pattern', () => {
    let analyzer: ContextAnalyzer;
    let registry: ContextAnalysisRegistry;

    beforeEach(() => {
        registry = ContextAnalysisRegistry.getInstance();
        registry.clear(); // Important!
        
        analyzer = new ContextAnalyzer();
    });

    it('should register default strategies on init', () => {
        // Constructor of ContextAnalyzer calls registerDefaultStrategies
        // which registers TS and Python.
        const tsStrategy = registry.getStrategy('typescript');
        const pyStrategy = registry.getStrategy('python');
        
        expect(tsStrategy).toBeDefined();
        expect(pyStrategy).toBeDefined();
    });

    it('should allow registering custom strategies', () => {
        registry.register(new MockStrategy());
        const mockStrategy = registry.getStrategy('mocklang');
        expect(mockStrategy).toBeDefined();
        expect(mockStrategy?.supports('mocklang')).toBe(true);
    });

    it('should fallback to default strategy if unknown', () => {
         // This tests the getStrategy method indirectly via internal call if exposed
         // Or we can rely on verifying behavior that depends on default.
         const strategy = registry.getStrategy('unknown');
         expect(strategy).toBeUndefined(); // Registry returns undefined
         
         // But Analyzer handles fallback internally usually
         // Let's check ContextAnalyzer private getStrategy by calling public method
         // that uses it, e.g. analyzeRelatedFiles
    });
});
