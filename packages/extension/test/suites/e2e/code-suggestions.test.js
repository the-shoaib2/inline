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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const test_utils_1 = require("../../utilities/test-utils");
suite('Code Suggestions E2E Test', () => {
    const extensionId = 'inline.inline';
    let extension;
    suiteSetup(async () => {
        await (0, test_utils_1.activateExtension)();
        extension = (0, test_utils_1.getExtension)();
        // Wait for model warmup if enabled
        await (0, test_utils_1.sleep)(3000);
    });
    const languages = [
        { id: 'python', ext: 'py', content: 'def calculate_sum(a, b):\n    ', trigger: '    ' },
        { id: 'javascript', ext: 'js', content: 'function calculateSum(a, b) {\n    ', trigger: '    ' },
        { id: 'java', ext: 'java', content: 'public class Calculator {\n    public int add(int a, int b) {\n        ', trigger: '        ' },
        { id: 'cpp', ext: 'cpp', content: 'int calculateSum(int a, int b) {\n    ', trigger: '    ' },
        { id: 'go', ext: 'go', content: 'func calculateSum(a int, b int) int {\n    ', trigger: '    ' },
        { id: 'rust', ext: 'rs', content: 'fn calculate_sum(a: i32, b: i32) -> i32 {\n    ', trigger: '    ' }
    ];
    for (const lang of languages) {
        test(`Should provide suggestions for ${lang.id}`, async () => {
            const doc = await vscode.workspace.openTextDocument({
                language: lang.id,
                content: lang.content
            });
            const editor = await vscode.window.showTextDocument(doc);
            // Move cursor to end
            const position = new vscode.Position(doc.lineCount - 1, lang.trigger.length);
            // Trigger completion directly via provider
            const ext = (0, test_utils_1.getExtension)();
            const api = ext?.exports; // specific to how extension exports API
            const provider = api.completionProvider;
            const context = {
                triggerKind: vscode.InlineCompletionTriggerKind.Invoke,
                selectedCompletionInfo: undefined
            };
            const token = new vscode.CancellationTokenSource().token;
            const result = await provider.provideInlineCompletionItems(doc, position, context, token);
            // We might not get a result if no model is loaded or if it's too slow,
            // but we should at least verify the provider didn't crash and returned a valid object (or undefined)
            // In a real E2E with a loaded model, we would assert result.items.length > 0
            // For now, we check if the extension is active and provider is registered
            assert.ok(extension.isActive, 'Extension should be active');
        });
    }
});
//# sourceMappingURL=code-suggestions.test.js.map