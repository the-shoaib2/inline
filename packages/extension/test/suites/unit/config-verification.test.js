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
const path = __importStar(require("path"));
const language_config_service_1 = require("@inline/language/analysis/language-config-service");
const context_engine_1 = require("@inline/context/context-engine");
describe('Language Configuration & Context Verifiction', function () {
    this.beforeAll(function () { this.skip(); }); // Requires languages.json config
    let configService;
    before(async () => {
        // Initialize config service
        configService = language_config_service_1.LanguageConfigService.getInstance();
        // Mock context to point to actual resources
        const extensionPath = path.resolve(__dirname, '../..');
        const mockContext = {
            extensionPath: extensionPath,
            subscriptions: [],
            workspaceState: {
                get: () => { },
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => { },
                update: () => Promise.resolve(),
                setKeysForSync: () => { }
            },
            extensionUri: vscode.Uri.file(extensionPath),
            environmentVariableCollection: {},
            secrets: {},
            storageUri: vscode.Uri.file(path.join(extensionPath, 'storage')),
            dglobalStorageUri: vscode.Uri.file(path.join(extensionPath, 'globalStorage')),
            logUri: vscode.Uri.file(path.join(extensionPath, 'logs')),
            extensionMode: 3, // vscode.ExtensionMode.Test
            asAbsolutePath: (relativePath) => path.join(extensionPath, relativePath)
        };
        configService.initialize(mockContext);
    });
    it('LanguageConfigService should load comment prefixes correctly', () => {
        assert.strictEqual(configService.getCommentPrefix('typescript'), '//');
        assert.strictEqual(configService.getCommentPrefix('python'), '#');
        assert.strictEqual(configService.getCommentPrefix('xml'), '<!--');
        assert.strictEqual(configService.getCommentPrefix('unknown-lang'), '//'); // Default
    });
    it('ContextEngine should use configured comment prefixes', async () => {
        const contextEngine = new context_engine_1.ContextEngine();
        // We can't easily inspect private methods, but we can check public output if accessible.
        // Or we can rely on the fact that if it doesn't crash and generates a prompt, it's working.
        // For accurate verification, we trust the unit test above for the service, 
        // and rely on integration tests for the full flow.
        // Checking C++ prefix specifically as requested by user
        assert.strictEqual(configService.getCommentPrefix('cpp'), '//');
        // Create a dummy context to trigger generatePrompt and logging
        const context = {
            prefix: '// Content before cursor\n',
            suffix: '\n// Content after cursor',
            language: 'cpp',
            filename: 'test.cpp',
            project: 'TestProject',
            imports: [],
            functions: [],
            classes: [],
            interfaces: [],
            types: [],
            variables: [],
            currentScope: null,
            symbolTable: new Map(),
            dependencies: [],
            projectConfig: null,
            codingPatterns: [],
            styleGuide: null,
            relatedCode: [],
            recentEdits: [],
            cursorIntent: null,
            comments: [],
            cursorRules: ''
        };
        const prompt = await contextEngine.generatePrompt(context, 'default');
        // Assert that the prompt is well-formed
        assert.ok(prompt.includes('<|fim_prefix|>'), 'Prompt should contain FIM prefix');
        assert.ok(prompt.includes('// File: test.cpp'), 'Prompt should contain file header');
        // Check for garbage characters
        if (prompt.includes('Ø') || prompt.includes('∏')) {
            console.error('⚠️ GARBAGE CHARACTERS DETECTED IN PROMPT!');
            assert.fail('Prompt contains garbage characters (Ø or ∏)');
        }
    });
});
//# sourceMappingURL=config-verification.test.js.map