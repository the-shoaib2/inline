"use strict";
/**
 * Navigation Tests - All Languages
 * Tests code navigation features: Go to Definition, Find References, etc.
 */
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
exports.NavigationAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class NavigationAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Go to Definition
     */
    generateGoToDefinitionTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-go-to-def');
        for (const expectation of expectations) {
            tests.push({
                name: `Go to Definition - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-go-to-def',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `navigation${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'definition');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    // Position cursor on a usage
                    const position = this.getUsagePosition(expectation.language);
                    // Trigger definition command
                    await vscode.commands.executeCommand('editor.action.revealDefinition');
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    // Check if cursor moved to the definition line
                    const currentPos = editor.selection.active;
                    const expectedPos = this.getDefinitionPosition(expectation.language);
                    return currentPos.line === expectedPos.line;
                }
            });
        }
        return { name: 'Go to Definition - All Languages', tests };
    }
    /**
     * Generate test suite for Find References
     */
    generateFindReferencesTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-find-references');
        for (const expectation of expectations) {
            tests.push({
                name: `Find References - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-find-references',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `references${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'references');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    const position = this.getDefinitionPosition(expectation.language);
                    // Execute command to find references (returns array of locations)
                    // We can't easily capture the UI result, so we use the API
                    await vscode.commands.executeCommand('editor.action.referenceSearch.trigger');
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const position = this.getDefinitionPosition(expectation.language);
                    const references = await vscode.commands.executeCommand('vscode.executeReferenceProvider', editor.document.uri, position);
                    // Should find at least the definition and one usage
                    return references !== undefined && references.length >= 2;
                }
            });
        }
        return { name: 'Find References - All Languages', tests };
    }
    /**
     * Generate test suite for Navigate to Symbol
     */
    generateSymbolNavigationTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('nav-symbol');
        for (const expectation of expectations) {
            tests.push({
                name: `Navigate to Symbol - ${expectation.language}`,
                language: expectation.language,
                feature: 'nav-symbol',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `symbols${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'symbols');
                },
                execute: async () => {
                    // We verify the symbol provider is working
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    await vscode.commands.executeCommand('workbench.action.gotoSymbol');
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri);
                    return symbols !== undefined && symbols.length > 0;
                }
            });
        }
        return { name: 'Symbol Navigation - All Languages', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateGoToDefinitionTests(),
            this.generateFindReferencesTests(),
            this.generateSymbolNavigationTests()
        ];
        console.log('Running navigation tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);
        const stats = this.framework.getStatistics();
        console.log('\n=== Navigation Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);
        await this.framework.saveReport(path.join(this.framework['testWorkspace'], 'navigation-test-report.html'));
    }
    getExtension(language) {
        const extensions = {
            'typescript': '.ts',
            'javascript': '.js',
            'python': '.py',
            'java': '.java',
            'go': '.go',
            'rust': '.rs',
            'cpp': '.cpp',
            'c': '.c'
        };
        return extensions[language] || `.${language}`;
    }
    async createTestFile(filePath, language, testType) {
        const content = this.getTestContent(language, testType);
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }
    getTestContent(language, testType) {
        // Should return content with a definition and a usage
        // Definition at line 0, Usage at line 5 (approx)
        const templates = {
            'typescript': {
                'definition': 'function targetFunction() { return 1; }\n\n\n\ntargetFunction();\n',
                'references': 'function targetFunction() { return 1; }\n\n\n\ntargetFunction();\n',
                'symbols': 'class MyClass {\n  method() {}\n}\n'
            },
            'python': {
                'definition': 'def target_function():\n    return 1\n\n\n\ntarget_function()\n',
                'references': 'def target_function():\n    return 1\n\n\n\ntarget_function()\n',
                'symbols': 'class MyClass:\n    def method(self):\n        pass\n'
            }
        };
        return templates[language]?.[testType] || '// Test content placeholder';
    }
    getDefinitionPosition(language) {
        return new vscode.Position(0, 9); // 'targetFunction' or 'target_function'
    }
    getUsagePosition(language) {
        if (language === 'python')
            return new vscode.Position(5, 0);
        return new vscode.Position(4, 0);
    }
}
exports.NavigationAllLanguagesTest = NavigationAllLanguagesTest;
//# sourceMappingURL=navigation-all-languages.test.js.map