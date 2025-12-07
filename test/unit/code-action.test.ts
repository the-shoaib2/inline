
import * as assert from 'assert';
import * as vscode from 'vscode';
import { InlineCodeActionProvider } from '../../src/core/providers/code-action-provider';
import { ModelManager } from '../../src/inference/model-manager';

describe('Code Action Provider Tests', () => {
    let provider: InlineCodeActionProvider;
    let mockModelManager: any;
    let mockDocument: any;
    let mockRange: any;
    let mockContext: any;

    beforeEach(() => {
        mockModelManager = {} as ModelManager;
        provider = new InlineCodeActionProvider(mockModelManager);
        
        mockDocument = {
            getText: () => 'const x = 1'
        };
        mockRange = { isEmpty: true };
        mockContext = { diagnostics: [] };
    });

    it('Should provide Fix Action when diagnostics exist', async () => {
        mockContext.diagnostics = [{ message: 'Missing semicolon' }];
        
        const actions = await provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        // Should have organize imports + fix action
        assert.ok(actions.length >= 1, 'Should return at least 1 action');
        const fixAction = actions.find(a => a.title === '✨ Fix with AI');
        assert.ok(fixAction, 'Should have Fix with AI action');
        assert.strictEqual(fixAction?.command?.command, 'inline.fixCode');
    });

    it('Should provide Optimize/Explain actions when selection exists', async () => {
        mockRange = { isEmpty: false };
        mockContext.diagnostics = [];

        const actions = await provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        // Expect Optimize and Explain (plus organize imports)
        const titles = actions.map(a => a.title);
        assert.ok(titles.includes('⚡ Optimize Selection'));
        assert.ok(titles.includes('💡 Explain Code'));
    });

    it('Should return organize imports action even with no selection and no errors', async () => {
        mockRange = { isEmpty: true };
        mockContext.diagnostics = [];

        const actions = await provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        // Should have at least organize imports action
        assert.ok(actions.length >= 1, 'Should have at least organize imports action');
        const organizeAction = actions.find(a => a.title === '📦 Organize Imports');
        assert.ok(organizeAction, 'Should have Organize Imports action');
    });
});
