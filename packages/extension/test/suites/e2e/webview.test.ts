import * as vscode from 'vscode';
import { assert } from 'chai';
import * as path from 'path';

suite('Webview E2E Test Suite', () => {
    vscode.window.showInformationMessage('Start Webview E2E Tests.');

    test('Webview Command should register and execute', async () => {
        // Activate the extension
        const ext = vscode.extensions.getExtension('ratulhasan.inline-ai-codes');
        assert.ok(ext, 'Extension not found');

        await ext?.activate();
        assert.ok(ext?.isActive, 'Extension should be active');

        // Execute the command to open the webview
        try {
            await vscode.commands.executeCommand('inline.modelManager');
        } catch (error) {
            assert.fail(`Failed to execute command: ${error}`);
        }

        // Get the exported API
        const api = ext?.exports;
        assert.ok(api, 'Extension exports should be available');
        assert.ok(api.webviewProvider, 'WebviewProvider should be exported');

        // We can't easily verify the webview content from here without a UI driver,
        // but we can verify the provider is set up and the command didn't throw.
    });

    test('Webview HTML generation', async () => {
        const ext = vscode.extensions.getExtension('ratulhasan.inline-ai-codes');
        const api = ext?.exports;
        const provider = api.webviewProvider;

        // Mock a webview
        const webviewMock = {
            asWebviewUri: (uri: vscode.Uri) => uri,
            options: {},
            html: '',
            onDidReceiveMessage: () => { },
            cspSource: 'vscode-webview-resource:'
        };

        const webviewViewMock = {
            webview: webviewMock,
            visible: true,
            onDidChangeVisibility: () => { },
            dispose: () => { }
        };

        // Manually trigger resolveWebviewView to test HTML generation
        // Note: This might fail if resolveWebviewView expects a real WebviewView with more properties,
        // or if it tries to post messages immediately.
        // But we can try to call the private method _getHtmlForWebview if we cast to any,
        // or just rely on the fact that resolveWebviewView calls it.

        // Let's just check if we can access the HTML generation logic or resources.
        // Since we refactored to use built assets, we want to make sure index.html exists.

        const extensionUri = ext?.extensionUri;
        if (extensionUri) {
            const indexHtmlPath = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.html');
            try {
                const stat = await vscode.workspace.fs.stat(indexHtmlPath);
                assert.ok(stat.size > 0, 'index.html should exist and not be empty');
            } catch (e) {
                assert.fail('index.html not found in out/webview');
            }
        }
    });
});
