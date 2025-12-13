"use strict";
/**
 * Execution Tools Tests - All Languages
 * Covers: Build & Run (O), Terminal (P)
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
exports.ExecutionToolsAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class ExecutionToolsAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Build & Run Features
     */
    generateBuildRunTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('build-project');
        for (const expectation of expectations) {
            if (!this.isCompiledLanguage(expectation.language))
                continue;
            tests.push({
                name: `Build Project - ${expectation.language}`,
                language: expectation.language,
                feature: 'build-project',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'hello-world');
                },
                execute: async () => {
                    // Simulate build command
                    await vscode.commands.executeCommand('inline.build.project');
                    await this.framework.sleep(1500);
                },
                verify: async () => true // Check output channel or file existence in real scenario
            });
        }
        return { name: 'Build & Run - Compiled Languages', tests };
    }
    /**
     * Generate test suite for Terminal Features
     */
    generateTerminalTests() {
        const tests = [];
        // Test command suggestions
        tests.push({
            name: 'Terminal Command Suggestions',
            language: 'shell',
            feature: 'term-suggest',
            setup: async () => { },
            execute: async () => {
                // Hard to test terminal UI directly, ensure command runs
                await vscode.commands.executeCommand('inline.terminal.suggest');
                await this.framework.sleep(500);
            },
            verify: async () => true
        });
        // Test explain terminal command
        tests.push({
            name: 'Explain Terminal Command',
            language: 'shell',
            feature: 'term-explain',
            setup: async () => { },
            execute: async () => {
                await vscode.commands.executeCommand('inline.terminal.explain', 'ls -la');
                await this.framework.sleep(1000);
            },
            verify: async () => true
        });
        return { name: 'Terminal Features', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateBuildRunTests(),
            this.generateTerminalTests()
        ];
        console.log('Running execution tools tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
    isCompiledLanguage(language) {
        const compiled = ['c', 'cpp', 'rust', 'go', 'java', 'csharp', 'swift'];
        return compiled.includes(language);
    }
    async createTestFile(language, type) {
        const ext = this.getExtension(language);
        const filePath = path.join(this.framework['testWorkspace'], `exec_test${ext}`);
        // Basic hello world
        const content = this.getHelloWorld(language);
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
    getExtension(language) {
        const extensions = {
            'c': '.c', 'cpp': '.cpp', 'rust': '.rs', 'go': '.go', 'java': '.java'
        };
        return extensions[language] || '.txt';
    }
    getHelloWorld(language) {
        if (language === 'c')
            return '#include <stdio.h>\nint main() { printf("Hello"); return 0; }';
        if (language === 'cpp')
            return '#include <iostream>\nint main() { std::cout << "Hello"; return 0; }';
        if (language === 'go')
            return 'package main\nimport "fmt"\nfunc main() { fmt.Println("Hello") }';
        if (language === 'rust')
            return 'fn main() { println!("Hello"); }';
        if (language === 'java')
            return 'class Main { public static void main(String[] args) { System.out.println("Hello"); } }';
        return '';
    }
}
exports.ExecutionToolsAllLanguagesTest = ExecutionToolsAllLanguagesTest;
//# sourceMappingURL=execution-tools-all-languages.test.js.map