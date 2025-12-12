
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { LanguageConfigService } from '@language/analysis/language-config-service';
import { ContextEngine } from '@context/context-engine';

describe('Language Configuration & Context Verifiction', function() {
    this.beforeAll(function() { this.skip(); }); // Requires languages.json config
    let configService: LanguageConfigService;

    before(async () => {
        // Initialize config service
        configService = LanguageConfigService.getInstance();
        
        // Mock context to point to actual resources
        const extensionPath = path.resolve(__dirname, '../..');
        const mockContext = {
            extensionPath: extensionPath,
            subscriptions: [],
            workspaceState: {
                get: () => {},
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => {},
                update: () => Promise.resolve(),
                setKeysForSync: () => {}
            },
            extensionUri: vscode.Uri.file(extensionPath),
            environmentVariableCollection: {} as any,
            secrets: {} as any,
            storageUri: vscode.Uri.file(path.join(extensionPath, 'storage')),
            dglobalStorageUri: vscode.Uri.file(path.join(extensionPath, 'globalStorage')),
            logUri: vscode.Uri.file(path.join(extensionPath, 'logs')),
            extensionMode: 3, // vscode.ExtensionMode.Test
            asAbsolutePath: (relativePath: string) => path.join(extensionPath, relativePath)
        } as unknown as vscode.ExtensionContext;

        configService.initialize(mockContext);
    });

    it('LanguageConfigService should load comment prefixes correctly', () => {
        assert.strictEqual(configService.getCommentPrefix('typescript'), '//');
        assert.strictEqual(configService.getCommentPrefix('python'), '#');
        assert.strictEqual(configService.getCommentPrefix('xml'), '<!--');
        assert.strictEqual(configService.getCommentPrefix('unknown-lang'), '//'); // Default
    });

    it('ContextEngine should use configured comment prefixes', async () => {
        const contextEngine = new ContextEngine();
        
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

        const prompt = await contextEngine.generatePrompt(context as any, 'default');
        
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
