import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * E2E Test Suite for Inline Code Suggestions
 * 
 * This test verifies that the completion provider generates code suggestions
 * based on comments and context.
 */

suite('Inline Code Suggestions E2E Tests', () => {
    let testDocument: vscode.TextDocument;
    let testEditor: vscode.TextEditor;

    suiteSetup(async function() {
        // Increase timeout for model loading
        this.timeout(60000);

        // Wait for extension to activate
        const ext = vscode.extensions.getExtension('inline.inline');
        if (ext && !ext.isActive) {
            await ext.activate();
        }

        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
    });

    setup(async function() {
        this.timeout(10000);

        // Create a new test document
        testDocument = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: ''
        });

        testEditor = await vscode.window.showTextDocument(testDocument);
    });

    teardown(async () => {
        // Close the test document
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should generate code suggestion from comment', async function() {
        this.timeout(30000);

        // Insert a comment that should trigger a suggestion
        const comment = '// Create a function that adds two numbers\n';
        await testEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });

        // Move cursor to end of comment
        const position = new vscode.Position(1, 0);
        testEditor.selection = new vscode.Selection(position, position);

        // Wait for suggestion delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Request inline completions
        const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
            'vscode.executeInlineCompletionItemProvider',
            testDocument.uri,
            position
        );

        // Verify we got completions
        assert.ok(completions, 'Should receive completion list');
        assert.ok(completions.items.length > 0, 'Should have at least one completion item');

        // Verify the completion contains relevant code
        const firstCompletion = completions.items[0];
        const completionText = typeof firstCompletion.insertText === 'string' 
            ? firstCompletion.insertText 
            : firstCompletion.insertText.value;

        console.log('Generated suggestion:', completionText);

        // Check that the completion looks like a function
        assert.ok(
            completionText.includes('function') || completionText.includes('=>'),
            'Completion should contain function-like code'
        );
    });

    test('Should generate TypeScript function with types', async function() {
        this.timeout(30000);

        const comment = '// Write a TypeScript function to check if a string is a palindrome\n';
        await testEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });

        const position = new vscode.Position(1, 0);
        testEditor.selection = new vscode.Selection(position, position);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
            'vscode.executeInlineCompletionItemProvider',
            testDocument.uri,
            position
        );

        assert.ok(completions?.items.length > 0, 'Should generate completion');

        const completionText = typeof completions.items[0].insertText === 'string'
            ? completions.items[0].insertText
            : completions.items[0].insertText.value;

        console.log('Generated TypeScript suggestion:', completionText);

        // Verify it contains TypeScript-specific syntax
        assert.ok(
            completionText.includes('string') || completionText.includes('boolean') || completionText.includes(':'),
            'Should contain TypeScript type annotations'
        );
    });

    test('Should generate class definition from comment', async function() {
        this.timeout(30000);

        const comment = '// Create a User class with name and email properties\n';
        await testEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });

        const position = new vscode.Position(1, 0);
        testEditor.selection = new vscode.Selection(position, position);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
            'vscode.executeInlineCompletionItemProvider',
            testDocument.uri,
            position
        );

        assert.ok(completions?.items.length > 0, 'Should generate completion');

        const completionText = typeof completions.items[0].insertText === 'string'
            ? completions.items[0].insertText
            : completions.items[0].insertText.value;

        console.log('Generated class suggestion:', completionText);

        assert.ok(
            completionText.includes('class') || completionText.includes('User'),
            'Should contain class definition'
        );
    });

    test('Should handle multiple sequential completions without errors', async function() {
        this.timeout(60000);

        const testCases = [
            '// Create a function to add two numbers\n',
            '// Write a function to multiply two numbers\n',
            '// Create a function to divide two numbers\n'
        ];

        for (const comment of testCases) {
            // Clear document
            await testEditor.edit(editBuilder => {
                const fullRange = new vscode.Range(
                    testDocument.positionAt(0),
                    testDocument.positionAt(testDocument.getText().length)
                );
                editBuilder.delete(fullRange);
                editBuilder.insert(new vscode.Position(0, 0), comment);
            });

            const position = new vscode.Position(1, 0);
            testEditor.selection = new vscode.Selection(position, position);

            await new Promise(resolve => setTimeout(resolve, 1000));

            const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                position
            );

            assert.ok(completions?.items.length > 0, `Should generate completion for: ${comment}`);
            console.log(`✓ Generated suggestion for: ${comment.trim()}`);

            // Wait between requests to avoid overwhelming the model
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('✓ All sequential completions succeeded without "No sequences left" error');
    });

    test('Should generate multi-line suggestions', async function() {
        this.timeout(30000);

        const comment = '// Implement a binary search algorithm\n';
        await testEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), comment);
        });

        const position = new vscode.Position(1, 0);
        testEditor.selection = new vscode.Selection(position, position);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
            'vscode.executeInlineCompletionItemProvider',
            testDocument.uri,
            position
        );

        assert.ok(completions?.items.length > 0, 'Should generate completion');

        const completionText = typeof completions.items[0].insertText === 'string'
            ? completions.items[0].insertText
            : completions.items[0].insertText.value;

        console.log('Generated multi-line suggestion:', completionText);

        // Check if it's multi-line
        const lineCount = completionText.split('\n').length;
        assert.ok(lineCount > 1, 'Should generate multi-line code');
    });

    test('Should respect context and file type', async function() {
        this.timeout(30000);

        // Add some existing code context
        const context = `interface User {\n    name: string;\n    email: string;\n}\n\n`;
        const comment = '// Create a function to validate a User object\n';

        await testEditor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(0, 0), context + comment);
        });

        const position = new vscode.Position(6, 0);
        testEditor.selection = new vscode.Selection(position, position);

        await new Promise(resolve => setTimeout(resolve, 1000));

        const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
            'vscode.executeInlineCompletionItemProvider',
            testDocument.uri,
            position
        );

        assert.ok(completions?.items.length > 0, 'Should generate completion');

        const completionText = typeof completions.items[0].insertText === 'string'
            ? completions.items[0].insertText
            : completions.items[0].insertText.value;

        console.log('Generated context-aware suggestion:', completionText);

        // Should reference the User type from context
        assert.ok(
            completionText.toLowerCase().includes('user') || completionText.includes('validate'),
            'Should be contextually relevant'
        );
    });
});
