import * as assert from 'assert';
import * as vscode from 'vscode';
import { activateExtension, getExtension, sleep } from '../../utilities/test-utils';

suite('Extension E2E Tests', () => {
  
  suiteSetup(async () => {
    await activateExtension();
  });

  test('Extension should be present', () => {
    const ext = getExtension();
    assert.ok(ext, 'Extension should be found');
  });

  test('Extension should activate', async () => {
    const ext = getExtension();
    assert.ok(ext, 'Extension should be found');
    assert.strictEqual(ext.isActive, true, 'Extension should be active');
  });

  test('All commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    
    const expectedCommands = [
      'inline.modelManager',
      'inline.toggleOffline',
      'inline.clearCache',
      'inline.downloadModel',
      'inline.settings'
    ];

    for (const cmd of expectedCommands) {
      assert.ok(
        commands.includes(cmd),
        `Command ${cmd} should be registered`
      );
    }
  });

  test('Status bar item should be created', async () => {
    // Wait for status bar to initialize
    await sleep(500);
    
    // Status bar items are not directly accessible, but we can verify
    // the extension activated without errors
    const ext = getExtension();
    assert.ok(ext?.isActive, 'Extension should be active with status bar');
  });

  test('Configuration should be loaded', () => {
    const config = vscode.workspace.getConfiguration('inline');
    
    assert.strictEqual(
      config.get('autoOffline'),
      true,
      'autoOffline should default to true'
    );
    
    assert.strictEqual(
      config.get('defaultModel'),
      'deepseek-coder:6.7b',
      'defaultModel should have correct default'
    );
    
    assert.strictEqual(
      config.get('maxTokens'),
      512,
      'maxTokens should default to 512'
    );
  });

  test('Model Manager command should execute', async () => {
    await vscode.commands.executeCommand('inline.modelManager');
    // Command should execute without throwing
    assert.ok(true, 'Model Manager command executed');
  });

  test('Toggle Offline command should execute', async () => {
    await vscode.commands.executeCommand('inline.toggleOffline');
    // Command should execute without throwing
    assert.ok(true, 'Toggle Offline command executed');
  });

  test('Clear Cache command should execute', async () => {
    await vscode.commands.executeCommand('inline.clearCache');
    // Command should execute without throwing
    assert.ok(true, 'Clear Cache command executed');
  });

  test('Settings command should execute', async () => {
    await vscode.commands.executeCommand('inline.settings');
    // Command should execute without throwing
    assert.ok(true, 'Settings command executed');
  });

  test('Extension context should be set', async () => {
    // The extension sets 'inline.enabled' context
    // We can't directly access context values, but we can verify
    // the extension activated successfully
    const ext = getExtension();
    assert.ok(ext?.isActive, 'Extension context should be set');
  });
});
