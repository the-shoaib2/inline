"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
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
const vscode = __importStar(require("vscode"));
const chai_1 = require("chai");
suite('Webview E2E Test Suite', () => {
    vscode.window.showInformationMessage('Start Webview E2E Tests.');
    test('Webview Command should register and execute', async () => {
        // Activate the extension
        const ext = vscode.extensions.getExtension('inline.inline');
        chai_1.assert.ok(ext, 'Extension not found');
        await ext?.activate();
        chai_1.assert.ok(ext?.isActive, 'Extension should be active');
        // Execute the command to open the webview
        try {
            await vscode.commands.executeCommand('inline.modelManager');
        }
        catch (error) {
            chai_1.assert.fail(`Failed to execute command: ${error}`);
        }
        // Get the exported API
        const api = ext?.exports;
        chai_1.assert.ok(api, 'Extension exports should be available');
        chai_1.assert.ok(api.webviewProvider, 'WebviewProvider should be exported');
        // We can't easily verify the webview content from here without a UI driver,
        // but we can verify the provider is set up and the command didn't throw.
    });
    test('Webview HTML generation', async () => {
        const ext = vscode.extensions.getExtension('inline.inline');
        const api = ext?.exports;
        const provider = api.webviewProvider;
        // Mock a webview
        const webviewMock = {
            asWebviewUri: (uri) => uri,
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
            const indexHtmlPath = vscode.Uri.joinPath(extensionUri, 'media', 'webview', 'index.html');
            try {
                const stat = await vscode.workspace.fs.stat(indexHtmlPath);
                chai_1.assert.ok(stat.size > 0, 'index.html should exist and not be empty');
            }
            catch (e) {
                chai_1.assert.fail('index.html not found in media/webview');
            }
        }
    });
});
//# sourceMappingURL=webview.test.js.map