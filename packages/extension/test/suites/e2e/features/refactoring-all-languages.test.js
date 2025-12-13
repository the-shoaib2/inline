"use strict";
/**
 * Refactoring Tests - All Languages
 * Tests refactoring features: Rename, Extract, Inline
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
exports.RefactoringAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class RefactoringAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Rename Symbol
     */
    generateRenameTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('refactor-rename');
        for (const expectation of expectations) {
            tests.push({
                name: `Rename Symbol - ${expectation.language}`,
                language: expectation.language,
                feature: 'refactor-rename',
                setup: async () => {
                    const ext = this.getExtension(expectation.language);
                    const testFile = path.join(this.framework['testWorkspace'], `rename${ext}`);
                    await this.createTestFile(testFile, expectation.language, 'rename');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        throw new Error('No active editor');
                    const position = new vscode.Position(0, 5); // 'oldName'
                    // Trigger rename
                    // We can't easily simulate the input box for rename
                    // But we can check if the rename provider is available and maybe mock the rename
                    // For E2E without UI it's tricky. We'll use WorkspaceEdit via provider if possible
                    // Or we just check provider availability for now as a proxy, 
                    // or use `vscode.commands.executeCommand('vscode.executeDocumentRenameProvider', ...)`
                    const workspaceEdit = await vscode.commands.executeCommand('vscode.executeDocumentRenameProvider', editor.document.uri, position, 'newName');
                    if (workspaceEdit) {
                        await vscode.workspace.applyEdit(workspaceEdit);
                    }
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return false;
                    const text = editor.document.getText();
                    return text.includes('newName') && !text.includes('oldName');
                }
            });
        }
        return { name: 'Rename Symbol - All Languages', tests };
    }
    // Extract variable/function tests are harder to automate without UI interaction
    // We can simulate them if we have custom commands, or check code actions
    async runAllTests() {
        const suites = [
            this.generateRenameTests()
            // Add others when feasible
        ];
        console.log('Running refactoring tests for all languages...');
        await this.framework.runSuitesParallel(suites, 3);
        const stats = this.framework.getStatistics();
        console.log('\n=== Refactoring Test Results ===');
        console.log(`Total: ${stats.total}`);
        console.log(`Passed: ${stats.passed}`);
        console.log(`Failed: ${stats.failed}`);
        console.log(`Pass Rate: ${stats.passRate.toFixed(2)}%`);
        await this.framework.saveReport(path.join(this.framework['testWorkspace'], 'refactoring-test-report.html'));
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
        const templates = {
            'typescript': {
                'rename': 'let oldName = 1;\nconsole.log(oldName);'
            },
            'python': {
                'rename': 'oldName = 1\nprint(oldName)'
            },
            'java': {
                'rename': 'class Test { int oldName = 1; void test() { System.out.println(oldName); } }'
            }
        };
        return templates[language]?.[testType] || '// Test content placeholder';
    }
}
exports.RefactoringAllLanguagesTest = RefactoringAllLanguagesTest;
//# sourceMappingURL=refactoring-all-languages.test.js.map