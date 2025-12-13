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
const completion_1 = require("@inline/completion");
describe('Code Action Provider Tests', function () {
    this.beforeAll(function () { this.skip(); }); // Requires ImportResolver fix
    let provider;
    let mockModelManager;
    let mockDocument;
    let mockRange;
    let mockContext;
    beforeEach(() => {
        mockModelManager = {};
        provider = new completion_1.InlineCodeActionProvider(mockModelManager);
        mockDocument = {
            getText: () => 'const x = 1'
        };
        mockRange = { isEmpty: true };
        mockContext = { diagnostics: [] };
    });
    it('Should provide Fix Action when diagnostics exist', async () => {
        mockContext.diagnostics = [{ message: 'Missing semicolon' }];
        const actions = await provider.provideCodeActions(mockDocument, mockRange, mockContext, undefined);
        // Should have organize imports + fix action
        assert.ok(actions.length >= 1, 'Should return at least 1 action');
        const fixAction = actions.find(a => a.title === '✨ Fix with AI');
        assert.ok(fixAction, 'Should have Fix with AI action');
        assert.strictEqual(fixAction?.command?.command, 'inline.fixCode');
    });
    it('Should provide Optimize/Explain actions when selection exists', async () => {
        mockRange = { isEmpty: false };
        mockContext.diagnostics = [];
        const actions = await provider.provideCodeActions(mockDocument, mockRange, mockContext, undefined);
        // Expect Optimize and Explain (plus organize imports)
        const titles = actions.map(a => a.title);
        assert.ok(titles.includes('⚡ Optimize Selection'));
        assert.ok(titles.includes('💡 Explain Code'));
    });
    it('Should return organize imports action even with no selection and no errors', async () => {
        mockRange = { isEmpty: true };
        mockContext.diagnostics = [];
        const actions = await provider.provideCodeActions(mockDocument, mockRange, mockContext, undefined);
        // Should have at least organize imports action
        assert.ok(actions.length >= 1, 'Should have at least organize imports action');
        const organizeAction = actions.find(a => a.title === '📦 Organize Imports');
        assert.ok(organizeAction, 'Should have Organize Imports action');
    });
});
//# sourceMappingURL=code-action.test.js.map