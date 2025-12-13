"use strict";
/**
 * Completion Tests - All Languages
 * Tests all code completion features across all supported languages
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
exports.CompletionAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class CompletionAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for single-line completion
     */
    generateSingleLineCompletionTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-single-line');
        for (const expectation of expectations) {
            tests.push({
                name: `Single-line completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-single-line',
                setup: async () => {
                    // Create test file
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `test${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'single-line');
                },
                execute: async () => {
                    // Trigger completion
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    const position = new vscode.Position(5, 10);
                    await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                },
                verify: async () => {
                    // Verify completion was provided
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const position = new vscode.Position(5, 10);
                    const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }
        return { name: 'Single-line Completion - All Languages', tests };
    }
    /**
     * Generate test suite for multi-line completion
     */
    generateMultiLineCompletionTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-multi-line');
        for (const expectation of expectations) {
            tests.push({
                name: `Multi-line completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-multi-line',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `test${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'multi-line');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    const position = new vscode.Position(10, 0);
                    await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const position = new vscode.Position(10, 0);
                    const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                    // Verify multi-line completion
                    if (!completions || completions.items.length === 0)
                        return false;
                    const hasMultiLine = completions.items.some(item => {
                        const text = typeof item.insertText === 'string'
                            ? item.insertText
                            : item.insertText?.value || '';
                        return text.includes('\n');
                    });
                    return hasMultiLine;
                }
            });
        }
        return { name: 'Multi-line Completion - All Languages', tests };
    }
    /**
     * Generate test suite for function completion
     */
    generateFunctionCompletionTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-function');
        for (const expectation of expectations) {
            tests.push({
                name: `Function completion - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-function',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `test${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'function');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    // Position after function signature
                    const position = this.getFunctionPosition(expectation.language);
                    await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const position = this.getFunctionPosition(expectation.language);
                    const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }
        return { name: 'Function Completion - All Languages', tests };
    }
    /**
     * Generate test suite for class scaffolding
     */
    generateClassScaffoldingTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('completion-class');
        for (const expectation of expectations) {
            tests.push({
                name: `Class scaffolding - ${expectation.language}`,
                language: expectation.language,
                feature: 'completion-class',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `test${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'class');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    const position = this.getClassPosition(expectation.language);
                    await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const position = this.getClassPosition(expectation.language);
                    const completions = await vscode.commands.executeCommand('vscode.executeCompletionItemProvider', editor.document.uri, position);
                    return completions !== undefined && completions.items.length > 0;
                }
            });
        }
        return { name: 'Class Scaffolding - All Languages', tests };
    }
    /**
     * Run all completion tests
     */
    async runAllTests() {
        const suites = [
            this.generateSingleLineCompletionTests(),
            this.generateMultiLineCompletionTests(),
            this.generateFunctionCompletionTests(),
            this.generateClassScaffoldingTests()
        ];
        console.log('Running completion tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);
        const stats = this.framework.getStatistics();
        console.log('\n=== Completion Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);
        // Generate report
        await this.framework.saveReport(path.join(this.framework['testWorkspace'], 'completion-test-report.html'));
    }
    /**
     * Helper: Get file extension for language
     */
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
    /**
     * Helper: Create test file
     */
    async createTestFile(filePath, language, testType) {
        const content = this.getTestContent(language, testType);
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        // Open file in editor
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document);
    }
    /**
     * Helper: Get test content for language and type
     */
    getTestContent(language, testType) {
        // Return appropriate test content based on language and test type
        const templates = {
            'typescript': {
                'single-line': 'const x = \n',
                'multi-line': 'function test() {\n  \n}\n',
                'function': 'function calculate(a: number, b: number): number {\n  \n}\n',
                'class': 'class User {\n  \n}\n'
            },
            'python': {
                'single-line': 'x = \n',
                'multi-line': 'def test():\n    \n',
                'function': 'def calculate(a, b):\n    \n',
                'class': 'class User:\n    \n'
            }
        };
        return templates[language]?.[testType] || '';
    }
    /**
     * Helper: Get function position for language
     */
    getFunctionPosition(language) {
        // Return appropriate position based on language syntax
        return new vscode.Position(1, 4);
    }
    /**
     * Helper: Get class position for language
     */
    getClassPosition(language) {
        return new vscode.Position(1, 4);
    }
}
exports.CompletionAllLanguagesTest = CompletionAllLanguagesTest;
//# sourceMappingURL=completion-all-languages.test.js.map