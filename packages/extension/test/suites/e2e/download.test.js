"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
suite('Download Manager E2E Tests', () => {
    const extensionId = 'ratulhasan.inline';
    let extension;
    let api;
    suiteSetup(async () => {
        extension = vscode.extensions.getExtension(extensionId);
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
            download: async (options) => {
                downloadCalled = true;
                downloadUrl = options.url;
                // Simulate success
                if (options.onProgress)
                    options.onProgress({ progress: 50, speed: 1000, eta: 10 });
                if (options.onComplete)
                    await options.onComplete(options.destPath);
            }
        };
        webviewProvider['_downloadManager'] = mockDownloadManager;
        try {
            // Trigger downloadFromUrl
            const testUrl = 'https://huggingface.co/test/model.gguf';
            await webviewProvider['downloadFromUrl'](testUrl);
            assert.ok(downloadCalled, 'Download method should be called');
            assert.strictEqual(downloadUrl, testUrl, 'Should download from correct URL');
        }
        finally {
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
        }
        catch (error) {
            assert.fail(`Command failed: ${error}`);
        }
    });
    test('Should check for updates', async () => {
        // Verify command execution
        try {
            await vscode.commands.executeCommand('inline.checkForUpdates');
            assert.ok(true, 'Command executed successfully');
        }
        catch (error) {
            assert.fail(`Command failed: ${error}`);
        }
    });
});
//# sourceMappingURL=download.test.js.map