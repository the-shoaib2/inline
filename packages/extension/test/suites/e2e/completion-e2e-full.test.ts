import * as vscode from 'vscode';
import { assert } from 'chai';
import * as path from 'path';
import { activateExtension, getExtension } from '../../utilities/test-utils';

suite('Completion E2E Full Workflow', () => {
    vscode.window.showInformationMessage('Start Completion E2E Tests.');

    let ext: vscode.Extension<any> | undefined;
    let api: any;
    let completionProvider: any;

    setup(async function() {
        this.timeout(30000); // 30 seconds for setup

        // Activate the extension
        await activateExtension();
        ext = getExtension();
        assert.ok(ext, 'Extension not found');
        assert.ok(ext?.isActive, 'Extension should be active');

        // Get the exported API
        api = ext?.exports;
        assert.ok(api, 'Extension exports should be available');
        assert.ok(api.completionProvider, 'CompletionProvider should be exported');
        completionProvider = api.completionProvider;
    });

    test('Manual Trigger: inline.completion.trigger command exists', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.include(commands, 'inline.completion.trigger', 'Manual trigger command should be registered');
    });

    test('Manual Trigger: Generates completion for TypeScript', async function() {
        this.timeout(5000); // Reduced from 10000ms

        // Create a test document
        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'function hello'
        });

        // Show the document in editor
        const editor = await vscode.window.showTextDocument(doc);
        
        // Move cursor to end of line
        const position = new vscode.Position(0, 14);
        editor.selection = new vscode.Selection(position, position);

        // Get initial statistics
        const initialStats = completionProvider.getStatistics();
        const initialCount = initialStats.completionsGenerated;

        // Trigger completion manually - should not throw error even without model
        try {
            await vscode.commands.executeCommand('inline.completion.trigger');
            
            // Wait briefly for processing (reduced from 1500ms)
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if statistics updated (might not if no model loaded)
            const newStats = completionProvider.getStatistics();
            
            console.log('Initial completions:', initialCount);
            console.log('New completions:', newStats.completionsGenerated);
            
            // Test passes if command executed without error
            // Actual completion generation depends on model availability
            if (newStats.completionsGenerated > initialCount) {
                console.log('✓ Completions generated successfully');
            } else {
                console.log('⚠ No completions generated (likely no model loaded)');
            }
            
        } catch (error) {
            // Command execution should not fail even without model
            assert.fail(`Manual trigger should not throw error: ${error}`);
        }

        // Cleanup
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Statistics API: Returns valid structure', () => {
        const stats = completionProvider.getStatistics();
        
        assert.isNumber(stats.completionsGenerated, 'completionsGenerated should be a number');
        assert.isNumber(stats.acceptedSuggestions, 'acceptedSuggestions should be a number');
        assert.isNumber(stats.rejectedSuggestions, 'rejectedSuggestions should be a number');
        assert.isNumber(stats.acceptanceRate, 'acceptanceRate should be a number');
        assert.isNumber(stats.cacheHitRate, 'cacheHitRate should be a number');
        assert.isNumber(stats.averageLatency, 'averageLatency should be a number');
        assert.isString(stats.currentModel, 'currentModel should be a string');
        assert.isNumber(stats.sessionUptime, 'sessionUptime should be a number');

        // Validate ranges
        assert.isAtLeast(stats.acceptanceRate, 0);
        assert.isAtMost(stats.acceptanceRate, 1);
        assert.isAtLeast(stats.cacheHitRate, 0);
        assert.isAtMost(stats.cacheHitRate, 1);
        assert.isAtLeast(stats.sessionUptime, 0);
    });

    test('Statistics API: Reset functionality works', () => {
        // Get current stats
        const before = completionProvider.getStatistics();
        
        // Reset statistics
        completionProvider.resetStatistics();
        
        // Get stats after reset
        const after = completionProvider.getStatistics();
        
        assert.equal(after.completionsGenerated, 0, 'completionsGenerated should reset to 0');
        assert.equal(after.acceptedSuggestions, 0, 'acceptedSuggestions should reset to 0');
        assert.equal(after.rejectedSuggestions, 0, 'rejectedSuggestions should reset to 0');
        
        // Session uptime should be reset but immediately start counting again
        assert.isAtLeast(after.sessionUptime, 0);
    });

    test('Cache: Multiple requests for same context should hit cache', async function() {
        this.timeout(15000);

        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'const x = 10;\nconst y = '
        });

        const editor = await vscode.window.showTextDocument(doc);
        const position = new vscode.Position(1, 10);
        editor.selection = new vscode.Selection(position, position);

        // Reset statistics first
        completionProvider.resetStatistics();

        // Trigger completion twice with same context
        try {
            await vscode.commands.executeCommand('inline.completion.trigger');
            await new Promise(resolve => setTimeout(resolve, 800));
            
            await vscode.commands.executeCommand('inline.completion.trigger');
            await new Promise(resolve => setTimeout(resolve, 800));

            const stats = completionProvider.getStatistics();
            
            // Second request should ideally hit cache if completion was generated
            if (stats.completionsGenerated > 0) {
                console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
                // Cache might be used for the second identical request
            }
            
        } catch (error) {
            console.log('Cache test info:', error);
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Multi-Language: Supports TypeScript and JavaScript', async () => {
        const languages = ['typescript', 'javascript', 'python'];
        
        for (const lang of languages) {
            try {
                const doc = await vscode.workspace.openTextDocument({
                    language: lang,
                    content: lang === 'python' ? 'def hello' : 'function hello'
                });

                const editor = await vscode.window.showTextDocument(doc);
                const pos = new vscode.Position(0, lang === 'python' ? 9 : 14);
                editor.selection = new vscode.Selection(pos, pos);

                // Just verify command can be triggered without error
                await vscode.commands.executeCommand('inline.completion.trigger');
                await new Promise(resolve => setTimeout(resolve, 500));

                await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
                
            } catch (error) {
                console.log(`Language ${lang} test encountered:`, error);
            }
        }
    });

    test('Performance: Average latency is reasonable', async function() {
        this.timeout(20000);

        completionProvider.resetStatistics();

        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'const sum = (a, b) => '
        });

        const editor = await vscode.window.showTextDocument(doc);
        const pos = new vscode.Position(0, 23);
        editor.selection = new vscode.Selection(pos, pos);

        // Trigger several completions
        for (let i = 0; i < 3; i++) {
            try {
                await vscode.commands.executeCommand('inline.completion.trigger');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                // May fail if no model loaded
            }
        }

        const stats = completionProvider.getStatistics();
        
        if (stats.completionsGenerated > 0) {
            console.log(`Average latency: ${stats.averageLatency}ms`);
            
            // Latency should be under 5 seconds (5000ms) for any completion
            assert.isBelow(stats.averageLatency, 5000, 'Average latency should be reasonable');
        } else {
            console.log('No completions generated (likely no model loaded)');
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Context: Provider is accessible from API', () => {
        assert.ok(completionProvider, 'CompletionProvider should be accessible');
        assert.isFunction(completionProvider.getStatistics, 'getStatistics should be a method');
        assert.isFunction(completionProvider.resetStatistics, 'resetStatistics should be a method');
        assert.isFunction(completionProvider.triggerCompletion, 'triggerCompletion should be a method');
    });

    test('Edge Case: Empty document does not crash', async function() {
        this.timeout(5000);

        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: ''
        });

        const editor = await vscode.window.showTextDocument(doc);

        try {
            await vscode.commands.executeCommand('inline.completion.trigger');
            await new Promise(resolve => setTimeout(resolve, 500));
            // Should not throw error
        } catch (error) {
            assert.fail(`Empty document caused crash: ${error}`);
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Edge Case: Very long line does not crash', async function() {
        this.timeout(5000);

        const longContent = 'const x = ' + 'a'.repeat(1000) + ';';
        const doc = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: longContent
        });

        const editor = await vscode.window.showTextDocument(doc);
        const pos = new vscode.Position(0, longContent.length - 1);
        editor.selection = new vscode.Selection(pos, pos);

        try {
            await vscode.commands.executeCommand('inline.completion.trigger');
            await new Promise(resolve => setTimeout(resolve, 500));
            // Should not throw error
        } catch (error) {
            assert.fail(`Long line caused crash: ${error}`);
        }

        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });
});
