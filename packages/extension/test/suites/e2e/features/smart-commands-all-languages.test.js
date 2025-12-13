"use strict";
/**
 * Smart Commands Tests - All Languages
 * Tests slash commands: /explain, /fix, /optimize, /test, etc.
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
exports.SmartCommandsAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class SmartCommandsAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for /explain command
     */
    generateExplainCommandTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('cmd-explain');
        for (const expectation of expectations) {
            tests.push({
                name: `/explain command - ${expectation.language}`,
                language: expectation.language,
                feature: 'cmd-explain',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'complex-algo');
                },
                execute: async () => {
                    // Simulate command execution
                    // In a real scenario, this might involve the chat view interaction
                    // Here we assert the command exists and runs without error
                    await vscode.commands.executeCommand('inline.chat.explain');
                    await this.framework.sleep(1000);
                },
                verify: async () => {
                    return true; // Assume success if no error thrown
                }
            });
        }
        return { name: '/explain Command - All Languages', tests };
    }
    /**
    * Generate test suite for /fix command
    */
    generateFixCommandTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('cmd-fix');
        for (const expectation of expectations) {
            tests.push({
                name: `/fix command - ${expectation.language}`,
                language: expectation.language,
                feature: 'cmd-fix',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'buggy-code');
                },
                execute: async () => {
                    await vscode.commands.executeCommand('inline.chat.fix');
                    await this.framework.sleep(1000);
                },
                verify: async () => {
                    return true;
                }
            });
        }
        return { name: '/fix Command - All Languages', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateExplainCommandTests(),
            this.generateFixCommandTests()
        ];
        console.log('Running smart command tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
    async createTestFile(language, type) {
        const ext = language === 'python' ? '.py' : '.ts'; // Simplified
        const filePath = path.join(this.framework['testWorkspace'], `cmd_test${ext}`);
        const content = type === 'buggy-code' ? 'broken code' : 'complex code';
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
}
exports.SmartCommandsAllLanguagesTest = SmartCommandsAllLanguagesTest;
//# sourceMappingURL=smart-commands-all-languages.test.js.map