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
suite('Smart Features E2E Tests', () => {
    suiteSetup(async () => {
        await (0, test_utils_1.activateExtension)();
    });
    test('Code Actions should be available for selection', async function () {
        this.skip(); // Feature not yet implemented
        const document = await (0, test_utils_1.createTestDocument)('function test() { console.log("hello"); }');
        const editor = await vscode.window.showTextDocument(document);
        // Select the function
        const selection = new vscode.Selection(0, 0, 0, 30);
        editor.selection = selection;
        // Execute code action provider
        const codeActions = await vscode.commands.executeCommand('vscode.executeCodeActionProvider', document.uri, selection);
        assert.ok(codeActions, 'Code actions should be returned');
        // Look for our specific actions
        const hasOptimize = codeActions.some(a => a.title === '⚡ Optimize Selection');
        const hasRefactor = codeActions.some(a => a.title === '🛠️ Refactor Block');
        const hasFormat = codeActions.some(a => a.title === '📝 Format Block');
        assert.ok(hasOptimize, 'Optimize action should be present');
        assert.ok(hasRefactor, 'Refactor action should be present');
        assert.ok(hasFormat, 'Format action should be present');
    });
    test('Hover should show AI options on selection', async function () {
        this.skip(); // Feature not yet implemented
        const document = await (0, test_utils_1.createTestDocument)('const x = 10;');
        const editor = await vscode.window.showTextDocument(document);
        // Select 'x'
        const selection = new vscode.Selection(0, 6, 0, 7);
        editor.selection = selection;
        // Execute hover provider at position
        const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', document.uri, new vscode.Position(0, 6));
        assert.ok(hovers && hovers.length > 0, 'Hover should be returned');
        // Check content
        const hoverContent = hovers[0].contents[0].value;
        assert.ok(hoverContent.includes('AI Smart Actions'), 'Hover should contain AI Smart Actions header');
        assert.ok(hoverContent.includes('inline.optimizeCode'), 'Hover should contain Optimize command');
        assert.ok(hoverContent.includes('inline.formatCode'), 'Hover should contain Format command');
    });
});
//# sourceMappingURL=smart-features.test.js.map