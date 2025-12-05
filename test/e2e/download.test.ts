import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Download Manager E2E Tests', () => {
    const extensionId = 'inline.inline';
    let extension: vscode.Extension<any>;
    let api: any;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension(extensionId)!;
        await extension.activate();
        api = extension.exports;
    });

    test('Should handle download from URL', async () => {
        const webviewProvider = api.webviewProvider;
        assert.ok(webviewProvider, 'WebviewProvider should be available');

        // Mock DownloadManager
        let downloadCalled = false;
        let downloadUrl = '';

        const originalDownloadManager = webviewProvider['_downloadManager'];

        const mockDownloadManager = {
            download: async (options: any) => {
                downloadCalled = true;
                downloadUrl = options.url;
                // Simulate success
                if (options.onProgress) options.onProgress({ progress: 50, speed: 1000, eta: 10 });
                if (options.onComplete) await options.onComplete(options.destPath);
            }
        };

        webviewProvider['_downloadManager'] = mockDownloadManager;

        try {
            // Trigger downloadFromUrl
            const testUrl = 'https://huggingface.co/test/model.gguf';
            await webviewProvider['downloadFromUrl'](testUrl);

            assert.ok(downloadCalled, 'Download method should be called');
            assert.strictEqual(downloadUrl, testUrl, 'Should download from correct URL');

        } finally {
            // Restore original
            webviewProvider['_downloadManager'] = originalDownloadManager;
        }
    });

    test('Should open models folder', async () => {
        // We can't easily verify the external window opening, 
        // but we can verify the command execution doesn't throw
        try {
            await vscode.commands.executeCommand('inline.openModelsFolder');
            assert.ok(true, 'Command executed successfully');
        } catch (error) {
            assert.fail(`Command failed: ${error}`);
        }
    });

    test('Should check for updates', async () => {
        // Verify command execution
        try {
            await vscode.commands.executeCommand('inline.checkForUpdates');
            assert.ok(true, 'Command executed successfully');
        } catch (error) {
            assert.fail(`Command failed: ${error}`);
        }
    });
});
