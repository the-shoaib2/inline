
import * as assert from 'assert';
import * as vscode from 'vscode';
import { InlineCodeActionProvider } from '../../src/core/code-action-provider';
import { ModelManager } from '../../src/core/model-manager';

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

    it('Should provide Fix Action when diagnostics exist', () => {
        mockContext.diagnostics = [{ message: 'Missing semicolon' }];
        
        const actions = provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        assert.strictEqual(actions.length, 1, 'Should return 1 action');
        assert.strictEqual(actions[0].title, '✨ Fix with AI');
        assert.strictEqual(actions[0].command?.command, 'inline.fixCode');
    });

    it('Should provide Optimize/Explain actions when selection exists', () => {
        mockRange = { isEmpty: false };
        mockContext.diagnostics = [];

        const actions = provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        // Expect Optimize and Explain
        const titles = actions.map(a => a.title);
        assert.ok(titles.includes('⚡ Optimize Selection'));
        assert.ok(titles.includes('💡 Explain Code'));
    });

    it('Should return empty if no selection and no errors', () => {
        mockRange = { isEmpty: true };
        mockContext.diagnostics = [];

        const actions = provider.provideCodeActions(
            mockDocument,
            mockRange,
            mockContext,
            undefined as any
        );

        assert.strictEqual(actions.length, 0);
    });
});
