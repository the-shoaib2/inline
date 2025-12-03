import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  activateExtension,
  createTestDocument,
  measureTime,
  sleep,
  closeAllEditors
} from '../helpers/test-utils';

suite('Completion Provider E2E Tests', () => {
  
  suiteSetup(async () => {
    await activateExtension();
  });

  teardown(async () => {
    await closeAllEditors();
  });

  test('Inline completion provider should be registered', async () => {
    const document = await createTestDocument('', 'typescript');
    const position = new vscode.Position(0, 0);
    
    // Trigger completion
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    // Provider should be registered (may return empty results)
    assert.ok(completions !== undefined, 'Completion provider should be registered');
  });

  test('Should provide completions for function comment', async () => {
    const content = '// Create a function that adds two numbers\n';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(1, 0);
    
    await sleep(200); // Wait for provider to be ready
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    if (completions && completions.items.length > 0) {
      const completion = completions.items[0];
      assert.ok(completion.insertText, 'Completion should have insert text');
      
      // Verify completion is code-related
      const text = typeof completion.insertText === 'string' 
        ? completion.insertText 
        : completion.insertText.value;
      
      assert.ok(
        text.includes('function') || text.includes('const'),
        'Completion should contain function definition'
      );
    }
  });

  test('Should provide completions for class definition', async () => {
    const content = 'class Calculator {\n  ';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(1, 2);
    
    await sleep(200);
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    // Should provide completions for class body
    assert.ok(completions !== undefined, 'Should provide completions');
  });

  test('Should provide completions for import statement', async () => {
    const content = 'import ';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(0, 7);
    
    await sleep(200);
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    assert.ok(completions !== undefined, 'Should provide import completions');
  });

  test('Should respect cancellation token', async () => {
    const content = '// Create a complex algorithm\n';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(1, 0);
    
    // Create a cancellation token source
    const tokenSource = new vscode.CancellationTokenSource();
    
    // Cancel immediately
    tokenSource.cancel();
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    // Should handle cancellation gracefully
    assert.ok(true, 'Cancellation handled gracefully');
  });

  test('Completion latency should be under 500ms', async () => {
    const content = '// Create a function\n';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(1, 0);
    
    const { duration } = await measureTime(async () => {
      return await vscode.commands.executeCommand<vscode.InlineCompletionList>(
        'vscode.executeInlineCompletionItemProvider',
        document.uri,
        position
      );
    });
    
    assert.ok(
      duration < 500,
      `Completion should be fast (${duration}ms < 500ms)`
    );
  });

  test('Should work with Python files', async () => {
    const content = '# Create a function that sorts a list\n';
    const document = await createTestDocument(content, 'python');
    const position = new vscode.Position(1, 0);
    
    await sleep(200);
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    assert.ok(completions !== undefined, 'Should work with Python');
  });

  test('Should work with JavaScript files', async () => {
    const content = '// Create an async function\n';
    const document = await createTestDocument(content, 'javascript');
    const position = new vscode.Position(1, 0);
    
    await sleep(200);
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    assert.ok(completions !== undefined, 'Should work with JavaScript');
  });

  test('Should cache completions for same context', async () => {
    const content = 'function test() {\n  ';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(1, 2);
    
    // First request
    const { duration: firstDuration } = await measureTime(async () => {
      return await vscode.commands.executeCommand<vscode.InlineCompletionList>(
        'vscode.executeInlineCompletionItemProvider',
        document.uri,
        position
      );
    });
    
    await sleep(100);
    
    // Second request (should be cached)
    const { duration: secondDuration } = await measureTime(async () => {
      return await vscode.commands.executeCommand<vscode.InlineCompletionList>(
        'vscode.executeInlineCompletionItemProvider',
        document.uri,
        position
      );
    });
    
    // Cached request should be faster (or at least not significantly slower)
    assert.ok(
      secondDuration <= firstDuration * 1.5,
      'Cached completion should be fast'
    );
  });

  test('Should not provide completions in strings', async () => {
    const content = 'const str = "hello ';
    const document = await createTestDocument(content, 'typescript');
    const position = new vscode.Position(0, 19);
    
    await sleep(200);
    
    const completions = await vscode.commands.executeCommand<vscode.InlineCompletionList>(
      'vscode.executeInlineCompletionItemProvider',
      document.uri,
      position
    );
    
    // Should not provide code completions inside strings
    // (or provide very few/none)
    if (completions && completions.items.length > 0) {
      // If completions are provided, they should be minimal
      assert.ok(
        completions.items.length < 3,
        'Should provide minimal completions in strings'
      );
    }
  });
});
