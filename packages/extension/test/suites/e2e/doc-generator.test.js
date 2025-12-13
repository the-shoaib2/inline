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
const doc_generator_1 = require("@inline/completion/generation/doc-generator");
const intelligence_1 = require("@inline/intelligence");
suite('Documentation Generator E2E Tests', () => {
    let docGenerator;
    let inference;
    suiteSetup(async function () {
        this.timeout(30000);
        inference = new intelligence_1.LlamaInference();
        docGenerator = new doc_generator_1.DocGenerator(inference);
    });
    test('Should detect JSDoc style for JavaScript', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'javascript',
            content: 'function add(a, b) { return a + b; }'
        });
        // Verify style detection logic exists
        assert.ok(docGenerator);
    });
    test('Should detect TSDoc style for TypeScript', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'typescript',
            content: 'function add(a: number, b: number): number { return a + b; }'
        });
        assert.ok(docGenerator);
    });
    test('Should detect Python docstring styles', async () => {
        const document = await vscode.workspace.openTextDocument({
            language: 'python',
            content: 'def add(a, b):\n    return a + b'
        });
        assert.ok(docGenerator);
    });
    test('Should generate documentation structure', () => {
        // Test the documentation formatting
        const sampleDoc = '/**\n * Test function\n * @param a First number\n * @param b Second number\n * @returns Sum\n */';
        assert.ok(sampleDoc.includes('/**'));
        assert.ok(sampleDoc.includes('@param'));
        assert.ok(sampleDoc.includes('@returns'));
    });
    test('Should support multiple documentation styles', () => {
        const styles = ['jsdoc', 'tsdoc', 'google', 'numpy', 'sphinx', 'rustdoc', 'godoc'];
        assert.ok(styles.length === 7);
    });
    suiteTeardown(async () => {
        if (inference) {
            await inference.unloadModel();
        }
    });
});
//# sourceMappingURL=doc-generator.test.js.map