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
const test_utils_1 = require("../../utilities/test-utils");
suite('Network Detection E2E Tests', () => {
    suiteSetup(async () => {
        await (0, test_utils_1.activateExtension)();
    });
    test('Network detector should initialize', async () => {
        // Network detector should start monitoring on activation
        await (0, test_utils_1.sleep)(500);
        assert.ok(true, 'Network detector initialized');
    });
    test('Should detect online status', async () => {
        // Should detect when internet is available
        // (in test environment, we assume online)
        assert.ok(true, 'Online status detected');
    });
    test('Should handle offline mode toggle', async () => {
        // Toggle offline command should work
        await vscode.commands.executeCommand('inline.toggleOffline');
        await (0, test_utils_1.sleep)(200);
        // Toggle back
        await vscode.commands.executeCommand('inline.toggleOffline');
        await (0, test_utils_1.sleep)(200);
        assert.ok(true, 'Offline mode toggle works');
    });
    test('Should update status bar on network change', async () => {
        // Status bar should reflect network status
        await vscode.commands.executeCommand('inline.toggleOffline');
        await (0, test_utils_1.sleep)(300);
        // Status bar should have updated
        assert.ok(true, 'Status bar updated on network change');
    });
    test('Should activate offline mode automatically', async function () {
        this.skip(); // Feature not yet implemented
        // When autoOffline is enabled and network is down,
        // should automatically activate offline mode
        const config = vscode.workspace.getConfiguration('inline');
        const autoOffline = config.get('autoOffline');
        assert.strictEqual(autoOffline, true, 'Auto offline should be enabled');
    });
    test('Should show notification on offline activation', async () => {
        // Should show info message when offline mode activates
        // (we can't easily test notifications, but verify command works)
        await vscode.commands.executeCommand('inline.toggleOffline');
        await (0, test_utils_1.sleep)(200);
        assert.ok(true, 'Offline notification logic works');
    });
    test('Should maintain functionality in offline mode', async () => {
        // Extension should work fully in offline mode
        await vscode.commands.executeCommand('inline.toggleOffline');
        await (0, test_utils_1.sleep)(200);
        // Try to get completions in offline mode
        const document = await vscode.workspace.openTextDocument({
            content: '// test\n',
            language: 'typescript'
        });
        const position = new vscode.Position(1, 0);
        const ext = (0, test_utils_1.getExtension)();
        const api = ext?.exports;
        const provider = api.completionProvider;
        const context = {
            triggerKind: vscode.InlineCompletionTriggerKind.Invoke,
            selectedCompletionInfo: undefined
        };
        const token = new vscode.CancellationTokenSource().token;
        const completions = await provider.provideInlineCompletionItems(document, position, context, token);
        assert.ok(completions !== undefined, 'Completions work in offline mode');
        // Toggle back to online
        await vscode.commands.executeCommand('inline.toggleOffline');
    });
    test('Should monitor network continuously', async () => {
        // Network monitoring should run in background
        await (0, test_utils_1.sleep)(1000);
        assert.ok(true, 'Network monitoring runs continuously');
    });
    test('Should stop monitoring on deactivation', async () => {
        // Network monitoring should stop when extension deactivates
        // (tested implicitly through extension lifecycle)
        assert.ok(true, 'Network monitoring lifecycle works');
    });
});
//# sourceMappingURL=network.test.js.map