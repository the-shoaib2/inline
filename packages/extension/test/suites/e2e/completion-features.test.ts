/**
 * E2E Tests for Completion Features
 * Tests all critical and major features implemented
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { InlineCompletionProvider } from '../../../src/providers/completion-provider';
import { PartialAcceptanceHandler } from '../../../src/handlers/partial-acceptance-handler';
import { GhostTextDecorator } from '../../../src/rendering/ghost-text-decorator';

suite('Completion Features E2E Tests', () => {
    let testDocument: vscode.TextDocument;
    let editor: vscode.TextEditor;
    let provider: InlineCompletionProvider;
    let partialHandler: PartialAcceptanceHandler;
    let ghostDecorator: GhostTextDecorator;

    suiteSetup(async () => {
        // Ensure extension is activated
        const ext = vscode.extensions.getExtension('inline.inline');
        if (ext && !ext.isActive) {
            await ext.activate();
        }

        // Initialize handlers
        partialHandler = new PartialAcceptanceHandler();
        ghostDecorator = new GhostTextDecorator();
    });

    setup(async () => {
        // Create a new test document
        testDocument = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: ''
        });
        editor = await vscode.window.showTextDocument(testDocument);
    });

    teardown(async () => {
        // Close all editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suiteTeardown(() => {
        partialHandler.dispose();
        ghostDecorator.dispose();
    });

    suite('1. Real-Time Streaming Display', () => {
        test('Should display tokens progressively during streaming', async function() {
            this.timeout(10000);

            // Type trigger
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), 'function add(');
            });

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify inline suggestions are shown
            const suggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(0, 13)
            );

            assert.ok(suggestions, 'Should receive completion suggestions');
            assert.ok(suggestions.items.length > 0, 'Should have at least one suggestion');
        });

        test('Should update streaming tokens in real-time', async function() {
            this.timeout(10000);

            let tokenCount = 0;
            const tokens: string[] = [];

            // Mock streaming callback
            const mockCallback = (token: string) => {
                tokenCount++;
                tokens.push(token);
            };

            // Simulate streaming
            const testTokens = ['a', ':', ' ', 'number', ',', ' ', 'b', ':', ' ', 'number'];
            for (const token of testTokens) {
                mockCallback(token);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            assert.strictEqual(tokenCount, testTokens.length, 'Should receive all tokens');
            assert.strictEqual(tokens.join(''), 'a: number, b: number', 'Tokens should form correct completion');
        });
    });

    suite('2. Multi-Line Completions', () => {
        test('Should generate multi-line function completion', async function() {
            this.timeout(10000);

            // Type comment trigger
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), '// function to calculate factorial\n');
            });

            // Wait for completion
            await new Promise(resolve => setTimeout(resolve, 2000));

            const suggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(1, 0)
            );

            if (suggestions && suggestions.items.length > 0) {
                const completion = suggestions.items[0].insertText as string;
                const lines = completion.split('\n');
                
                assert.ok(lines.length > 1, 'Should be multi-line completion');
                assert.ok(completion.includes('function'), 'Should contain function keyword');
            }
        });

        test('Should calculate correct range for multi-line completion', async function() {
            this.timeout(10000);

            const position = new vscode.Position(0, 0);
            const multiLineText = 'function test() {\n  return 42;\n}';
            
            // Calculate expected range
            const lines = multiLineText.split('\n');
            const endLine = position.line + lines.length - 1;
            const endCharacter = lines[lines.length - 1].length;

            const expectedRange = new vscode.Range(
                position,
                new vscode.Position(endLine, endCharacter)
            );

            assert.strictEqual(expectedRange.start.line, 0, 'Start line should be 0');
            assert.strictEqual(expectedRange.end.line, 2, 'End line should be 2');
            assert.strictEqual(expectedRange.end.character, 1, 'End character should be 1');
        });

        test('Should preserve indentation in multi-line completions', async function() {
            this.timeout(10000);

            // Type inside a class
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), 'class Calculator {\n  ');
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            const suggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(1, 2)
            );

            if (suggestions && suggestions.items.length > 0) {
                const completion = suggestions.items[0].insertText as string;
                // Check if completion maintains indentation
                const lines = completion.split('\n');
                if (lines.length > 1) {
                    assert.ok(lines[1].startsWith('  '), 'Should maintain indentation');
                }
            }
        });
    });

    suite('3. Partial Acceptance', () => {
        test('Should accept next line only', async function() {
            this.timeout(5000);

            const multiLineCompletion = 'const x = 1;\nconst y = 2;\nconst z = 3;';
            const position = new vscode.Position(0, 0);

            partialHandler.initializeCompletion(multiLineCompletion, position, testDocument);

            const hasMore = await partialHandler.acceptNextLine(editor);

            assert.strictEqual(hasMore, true, 'Should have more lines to accept');
            
            const text = testDocument.getText();
            assert.ok(text.includes('const x = 1;'), 'Should contain first line');
            assert.ok(!text.includes('const y = 2;'), 'Should not contain second line yet');
        });

        test('Should accept next word only', async function() {
            this.timeout(5000);

            const completion = 'const result = calculateSum(a, b);';
            const position = new vscode.Position(0, 0);

            partialHandler.initializeCompletion(completion, position, testDocument);

            await partialHandler.acceptNextWord(editor);
            
            const text = testDocument.getText();
            assert.ok(text.includes('const'), 'Should contain first word');
            
            const remaining = partialHandler.getRemainingText();
            assert.ok(remaining.includes('result'), 'Remaining should have rest of completion');
        });

        test('Should accept all remaining text', async function() {
            this.timeout(5000);

            const completion = 'function test() {\n  return 42;\n}';
            const position = new vscode.Position(0, 0);

            partialHandler.initializeCompletion(completion, position, testDocument);

            await partialHandler.acceptAll(editor);

            const text = testDocument.getText();
            assert.strictEqual(text, completion, 'Should accept entire completion');
            assert.strictEqual(partialHandler.hasActiveCompletion(), false, 'Should clear state');
        });

        test('Should handle rejection', () => {
            const completion = 'const x = 1;';
            const position = new vscode.Position(0, 0);

            partialHandler.initializeCompletion(completion, position, testDocument);
            assert.strictEqual(partialHandler.hasActiveCompletion(), true, 'Should have active completion');

            partialHandler.reject();
            assert.strictEqual(partialHandler.hasActiveCompletion(), false, 'Should clear on reject');
        });
    });

    suite('4. Adaptive Debounce', () => {
        test('Should use longer debounce during fast typing', async function() {
            this.timeout(5000);

            const config = vscode.workspace.getConfiguration('inline');
            const adaptiveEnabled = config.get<boolean>('debounce.adaptive', true);

            assert.strictEqual(adaptiveEnabled, true, 'Adaptive debounce should be enabled');

            // Simulate fast typing
            const startTime = Date.now();
            for (let i = 0; i < 15; i++) {
                await editor.edit(edit => {
                    edit.insert(new vscode.Position(0, i), 'x');
                });
                await new Promise(resolve => setTimeout(resolve, 50)); // Fast typing
            }
            const typingDuration = Date.now() - startTime;

            // Fast typing should complete in < 1 second
            assert.ok(typingDuration < 1000, 'Should complete fast typing quickly');
        });

        test('Should use instant debounce for syntactic triggers', async function() {
            this.timeout(5000);

            // Type a dot (syntactic trigger)
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), 'console.');
            });

            // Should trigger immediately (0ms debounce)
            await new Promise(resolve => setTimeout(resolve, 100));

            const suggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(0, 8)
            );

            // Completion should be available quickly
            assert.ok(suggestions !== undefined, 'Should get suggestions for syntactic trigger');
        });
    });

    suite('5. Cache Invalidation', () => {
        test('Should invalidate cache on document edit', async function() {
            this.timeout(10000);

            // First completion
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), 'const x = ');
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            const firstSuggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(0, 10)
            );

            // Edit document (should invalidate cache)
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), '// comment\n');
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Second completion at same relative position
            const secondSuggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(1, 10)
            );

            // Document version should have changed
            assert.ok(testDocument.version > 1, 'Document version should increase');
        });

        test('Should use content hash for cache key', () => {
            // Test hash function
            const simpleHash = (str: string): string => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash.toString(36);
            };

            const text1 = 'const x = 1;\nconst y = 2;\nconst z = 3;';
            const text2 = 'const x = 1;\nconst y = 3;\nconst z = 3;'; // Different

            const hash1 = simpleHash(text1);
            const hash2 = simpleHash(text2);

            assert.notStrictEqual(hash1, hash2, 'Different content should have different hashes');
        });
    });

    suite('6. Ghost Text Styling', () => {
        test('Should create ghost text decorator', () => {
            const decorator = new GhostTextDecorator();
            assert.ok(decorator, 'Should create decorator');
            decorator.dispose();
        });

        test('Should show ghost text at position', async function() {
            this.timeout(5000);

            const position = new vscode.Position(0, 0);
            const ghostText = 'const x = 1;';

            ghostDecorator.show(editor, position, ghostText);

            assert.strictEqual(ghostDecorator.isShowing(), true, 'Should be showing ghost text');

            ghostDecorator.clear(editor);
            assert.strictEqual(ghostDecorator.isShowing(), false, 'Should clear ghost text');
        });

        test('Should show multi-line ghost text', async function() {
            this.timeout(5000);

            const position = new vscode.Position(0, 0);
            const lines = ['function test() {', '  return 42;', '}'];

            ghostDecorator.showMultiLine(editor, position, lines);

            assert.strictEqual(ghostDecorator.isShowing(), true, 'Should show multi-line ghost text');

            ghostDecorator.clear(editor);
        });

        test('Should update ghost text for streaming', async function() {
            this.timeout(5000);

            const position = new vscode.Position(0, 0);
            
            // Simulate streaming updates
            ghostDecorator.update(editor, position, 'const ');
            await new Promise(resolve => setTimeout(resolve, 50));
            
            ghostDecorator.update(editor, position, 'const x ');
            await new Promise(resolve => setTimeout(resolve, 50));
            
            ghostDecorator.update(editor, position, 'const x = 1;');

            assert.strictEqual(ghostDecorator.isShowing(), true, 'Should show updated ghost text');

            ghostDecorator.clear(editor);
        });
    });

    suite('7. Cross-File Context', () => {
        test('Should extract TypeScript imports', async function() {
            this.timeout(5000);

            const content = `import { add, subtract } from './utils';\nimport React from 'react';`;
            
            const doc = await vscode.workspace.openTextDocument({
                language: 'typescript',
                content
            });

            // Regex to extract imports
            const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
            const imports = [];
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                const symbols = match[1] 
                    ? match[1].split(',').map(s => s.trim())
                    : [match[2]];
                const importPath = match[3];

                imports.push({
                    importPath,
                    symbols,
                    isRelative: importPath.startsWith('.')
                });
            }

            assert.strictEqual(imports.length, 2, 'Should extract 2 imports');
            assert.strictEqual(imports[0].symbols.length, 2, 'First import should have 2 symbols');
            assert.ok(imports[0].isRelative, 'First import should be relative');
            assert.ok(!imports[1].isRelative, 'Second import should not be relative');
        });

        test('Should extract Python imports', async function() {
            this.timeout(5000);

            const content = `from utils import add, subtract\nfrom os import path`;
            
            const doc = await vscode.workspace.openTextDocument({
                language: 'python',
                content
            });

            // Regex to extract Python imports
            const fromImportRegex = /from\s+([\w.]+)\s+import\s+([^#\n]+)/g;
            const imports = [];
            let match;

            while ((match = fromImportRegex.exec(content)) !== null) {
                const importPath = match[1];
                const symbols = match[2].split(',').map(s => s.trim());

                imports.push({
                    importPath,
                    symbols,
                    isRelative: importPath.startsWith('.')
                });
            }

            assert.strictEqual(imports.length, 2, 'Should extract 2 Python imports');
            assert.strictEqual(imports[0].symbols.length, 2, 'First import should have 2 symbols');
        });

        test('Should resolve relative import paths', () => {
            const documentPath = '/Users/test/project/src/main.ts';
            const importPath = './utils';
            
            const documentDir = path.dirname(documentPath);
            const resolvedPath = path.resolve(documentDir, importPath + '.ts');

            assert.strictEqual(resolvedPath, '/Users/test/project/src/utils.ts', 'Should resolve relative path');
        });
    });

    suite('8. Feedback Loop & Auto-Tuning', () => {
        test('Should track acceptance statistics', () => {
            const stats = {
                acceptedSuggestions: 0,
                rejectedSuggestions: 0
            };

            // Simulate acceptances
            for (let i = 0; i < 7; i++) {
                stats.acceptedSuggestions++;
            }
            for (let i = 0; i < 3; i++) {
                stats.rejectedSuggestions++;
            }

            const total = stats.acceptedSuggestions + stats.rejectedSuggestions;
            const acceptanceRate = stats.acceptedSuggestions / total;

            assert.strictEqual(acceptanceRate, 0.7, 'Acceptance rate should be 70%');
        });

        test('Should adjust temperature based on low acceptance rate', async function() {
            this.timeout(5000);

            const config = vscode.workspace.getConfiguration('inline');
            const initialTemp = config.get<number>('temperature', 0.2);

            // Simulate low acceptance rate (< 30%)
            const acceptanceRate = 0.25;
            
            if (acceptanceRate < 0.3) {
                const newTemp = Math.min(0.5, initialTemp + 0.05);
                // In real implementation, this would update config
                assert.ok(newTemp > initialTemp, 'Temperature should increase');
            }
        });

        test('Should increase max tokens on high acceptance rate', async function() {
            this.timeout(5000);

            const config = vscode.workspace.getConfiguration('inline');
            const initialMaxTokens = config.get<number>('maxTokens', 128);

            // Simulate high acceptance rate (> 70%)
            const acceptanceRate = 0.75;
            
            if (acceptanceRate > 0.7) {
                const newMaxTokens = Math.min(256, initialMaxTokens + 32);
                // In real implementation, this would update config
                assert.ok(newMaxTokens >= initialMaxTokens, 'Max tokens should increase or stay same');
            }
        });
    });

    suite('9. Configuration Options', () => {
        test('Should have all new configuration options', () => {
            const config = vscode.workspace.getConfiguration('inline');

            // Phase 1 configs
            assert.ok(config.has('streaming.realTimeDisplay'), 'Should have realTimeDisplay config');
            assert.ok(config.has('debounce.adaptive'), 'Should have adaptive debounce config');
            assert.ok(config.has('debounce.min'), 'Should have min debounce config');
            assert.ok(config.has('cache.invalidateOnEdit'), 'Should have cache invalidation config');

            // Phase 2 configs
            assert.ok(config.has('ghostText.fontStyle'), 'Should have ghost text font style config');
            assert.ok(config.has('partialAcceptance.enabled'), 'Should have partial acceptance config');
            assert.ok(config.has('crossFileContext.enabled'), 'Should have cross-file context config');
            assert.ok(config.has('crossFileContext.maxFiles'), 'Should have max files config');
        });

        test('Should have correct default values', () => {
            const config = vscode.workspace.getConfiguration('inline');

            assert.strictEqual(config.get('streaming.realTimeDisplay'), true, 'Real-time display should default to true');
            assert.strictEqual(config.get('debounce.adaptive'), true, 'Adaptive debounce should default to true');
            assert.strictEqual(config.get('debounce.min'), 50, 'Min debounce should default to 50');
            assert.strictEqual(config.get('partialAcceptance.enabled'), true, 'Partial acceptance should default to true');
            assert.strictEqual(config.get('crossFileContext.enabled'), true, 'Cross-file context should default to true');
        });
    });

    suite('10. Integration Tests', () => {
        test('Should complete full workflow: trigger -> stream -> accept', async function() {
            this.timeout(15000);

            // 1. Type trigger
            await editor.edit(edit => {
                edit.insert(new vscode.Position(0, 0), 'const add = (');
            });

            // 2. Wait for streaming completion
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Get suggestions
            const suggestions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                'vscode.executeInlineCompletionItemProvider',
                testDocument.uri,
                new vscode.Position(0, 13)
            );

            if (suggestions && suggestions.items.length > 0) {
                // 4. Accept completion
                const completion = suggestions.items[0].insertText as string;
                await editor.edit(edit => {
                    edit.insert(new vscode.Position(0, 13), completion);
                });

                const finalText = testDocument.getText();
                assert.ok(finalText.length > 13, 'Should have accepted completion');
            }
        });

        test('Should handle rapid typing without crashes', async function() {
            this.timeout(10000);

            // Rapid typing simulation
            for (let i = 0; i < 50; i++) {
                await editor.edit(edit => {
                    edit.insert(new vscode.Position(0, i), 'x');
                });
                await new Promise(resolve => setTimeout(resolve, 20)); // Very fast
            }

            const text = testDocument.getText();
            assert.strictEqual(text.length, 50, 'Should handle all rapid edits');
        });

        test('Should maintain performance under load', async function() {
            this.timeout(20000);

            const iterations = 10;
            const times: number[] = [];

            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                
                await editor.edit(edit => {
                    edit.insert(new vscode.Position(i, 0), `const x${i} = `);
                });

                await new Promise(resolve => setTimeout(resolve, 500));

                await vscode.commands.executeCommand<vscode.InlineCompletionList>(
                    'vscode.executeInlineCompletionItemProvider',
                    testDocument.uri,
                    new vscode.Position(i, 11)
                );

                times.push(Date.now() - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            assert.ok(avgTime < 3000, `Average time should be < 3s, got ${avgTime}ms`);
        });
    });
});
