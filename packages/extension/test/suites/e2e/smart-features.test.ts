import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, createTestDocument, getExtension } from '../../utilities/test-utils';

suite('Smart Features E2E Tests', () => {
    
    suiteSetup(async () => {
        await activateExtension();
    });

    test('Code Actions should be available for selection', async () => {
        const document = await createTestDocument('function test() { console.log("hello"); }');
        const editor = await vscode.window.showTextDocument(document);
        
        // Select the function
        const selection = new vscode.Selection(0, 0, 0, 30);
        editor.selection = selection;

        // Execute code action provider
        const codeActions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
            'vscode.executeCodeActionProvider',
            document.uri,
            selection
        );

        assert.ok(codeActions, 'Code actions should be returned');
        
        // Look for our specific actions
        const hasOptimize = codeActions.some(a => a.title === '⚡ Optimize Selection');
        const hasRefactor = codeActions.some(a => a.title === '🛠️ Refactor Block');
        const hasFormat = codeActions.some(a => a.title === '📝 Format Block');

        assert.ok(hasOptimize, 'Optimize action should be present');
        assert.ok(hasRefactor, 'Refactor action should be present');
        assert.ok(hasFormat, 'Format action should be present');
    });

    test('Hover should show AI options on selection', async () => {
        const document = await createTestDocument('const x = 10;');
        const editor = await vscode.window.showTextDocument(document);
        
        // Select 'x'
        const selection = new vscode.Selection(0, 6, 0, 7);
        editor.selection = selection;

        // Execute hover provider at position
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
            'vscode.executeHoverProvider',
            document.uri,
            new vscode.Position(0, 6)
        );

        assert.ok(hovers && hovers.length > 0, 'Hover should be returned');
        
        // Check content
        const hoverContent = (hovers[0].contents[0] as vscode.MarkdownString).value;
        assert.ok(hoverContent.includes('AI Smart Actions'), 'Hover should contain AI Smart Actions header');
        assert.ok(hoverContent.includes('inline.optimizeCode'), 'Hover should contain Optimize command');
        assert.ok(hoverContent.includes('inline.formatCode'), 'Hover should contain Format command');
    });
});
