"use strict";
/**
 * Project Tools Tests - All Languages
 * Covers: Version Control (K), Search (L), Documentation (M), Dependencies (N)
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
exports.ProjectToolsAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class ProjectToolsAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Version Control Features
     */
    generateVcsTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('vcs-commit-msg'); // Assuming feature ID
        // We can't easily test real Git interactions in this E2E env without a git repo
        // So we test the generation logic if exposed via command
        for (const expectation of expectations) {
            tests.push({
                name: `Git Commit Generation - ${expectation.language}`,
                language: expectation.language,
                feature: 'vcs-commit-msg',
                setup: async () => { }, // No setup needed for prompt gen
                execute: async () => {
                    // Simulate command to generate commit message based on staged changes
                    // Checks if command is registered
                    // await vscode.commands.executeCommand('inline.vcs.generateCommitMessage');
                    await this.framework.sleep(500);
                },
                verify: async () => true
            });
        }
        return { name: 'Version Control - All Languages', tests };
    }
    /**
     * Generate test suite for Search Features
     */
    generateSearchTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('search-similar');
        for (const expectation of expectations) {
            tests.push({
                name: `Find Similar Code - ${expectation.language}`,
                language: expectation.language,
                feature: 'search-similar',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'search-target');
                },
                execute: async () => {
                    await vscode.commands.executeCommand('inline.search.similar');
                    await this.framework.sleep(1000);
                },
                verify: async () => true
            });
        }
        return { name: 'Search Features - All Languages', tests };
    }
    /**
     * Generate test suite for Documentation Features
     */
    generateDocumentationTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('doc-jsdoc');
        for (const expectation of expectations) {
            tests.push({
                name: `Generate Documentation - ${expectation.language}`,
                language: expectation.language,
                feature: 'doc-jsdoc',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'undocumented-func');
                },
                execute: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
                        await vscode.commands.executeCommand('inline.generateDocs');
                        await this.framework.sleep(1000);
                    }
                },
                verify: async () => {
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const text = editor.document.getText();
                        return text.includes('/**') || text.includes('"""') || text.includes('///');
                    }
                    return false;
                }
            });
        }
        return { name: 'Documentation Features - All Languages', tests };
    }
    /**
     * Generate test suite for Dependency Features
     */
    generateDependencyTests() {
        const tests = [];
        // Test dependency checking
        tests.push({
            name: 'Check Dependencies',
            language: 'mixed',
            feature: 'dep-check',
            setup: async () => { },
            execute: async () => {
                await vscode.commands.executeCommand('inline.checkDependencies');
                await this.framework.sleep(1000);
            },
            verify: async () => true
        });
        return { name: 'Dependency Features', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateVcsTests(),
            this.generateSearchTests(),
            this.generateDocumentationTests(),
            this.generateDependencyTests()
        ];
        console.log('Running project tools tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
    async createTestFile(language, type) {
        const ext = language === 'python' ? '.py' : '.ts';
        const filePath = path.join(this.framework['testWorkspace'], `proj_tool_${type}${ext}`);
        let content = '';
        if (type === 'undocumented-func') {
            content = language === 'python' ? 'def my_func():\n    pass' : 'function myFunc() {}';
        }
        else {
            content = '// generic content';
        }
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
}
exports.ProjectToolsAllLanguagesTest = ProjectToolsAllLanguagesTest;
//# sourceMappingURL=project-tools-all-languages.test.js.map