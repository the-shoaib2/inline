
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestGenerator } from '../../src/generation/test-generator';
import { registerAllStrategies } from '../../src/strategy-registration';
import * as vscode from 'vscode';

// Mock vscode
vi.mock('vscode', () => ({
    workspace: {
        getWorkspaceFolder: vi.fn(),
        fs: {
            readFile: vi.fn()
        }
    },
    Uri: {
        joinPath: vi.fn()
    }
}));

describe('Test Generator E2E - Strategy Pattern', () => {
    let generator: TestGenerator;
    const mockInference: any = {
        generateCompletion: vi.fn()
    };
    const mockDocument: any = {
        languageId: 'typescript',
        getText: vi.fn().mockReturnValue('function add(a, b) { return a + b; }'),
        uri: { fsPath: '/test/file.ts' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        registerAllStrategies();
        generator = new TestGenerator(mockInference);
    });

    it('should use default strategy (Jest) for TypeScript', async () => {
        mockInference.generateCompletion.mockResolvedValue('test("add", () => { expect(add(1, 2)).toBe(3); });');
        
        const result = await generator.generateTests(mockDocument, {} as any);
        
        expect(result.framework).toBe('jest');
        expect(result.testCount).toBe(1);
    });

    it('should use Python strategy for Python', async () => {
        const pythonDoc = {
            ...mockDocument,
            languageId: 'python',
            getText: vi.fn().mockReturnValue('def add(a, b): return a + b')
        };
        mockInference.generateCompletion.mockResolvedValue('def test_add(): assert add(1, 2) == 3');
        
        const result = await generator.generateTests(pythonDoc, {} as any);
        
        expect(result.framework).toBe('pytest');
        expect(result.testCount).toBe(1);
    });

    it('should detect vitest from package.json', async () => {
        (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({ uri: {} });
        (vscode.workspace.fs.readFile as any).mockResolvedValue(Buffer.from(JSON.stringify({
            devDependencies: { vitest: '^1.0.0' }
        })));

        mockInference.generateCompletion.mockResolvedValue('test("add", () => { expect(1).toBe(1); });');
        
        const result = await generator.generateTests(mockDocument, {} as any);
        
        expect(result.framework).toBe('vitest');
    });
});
