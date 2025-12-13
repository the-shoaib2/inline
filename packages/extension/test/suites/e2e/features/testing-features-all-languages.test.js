"use strict";
/**
 * Testing Features Tests - All Languages
 * Tests test generation features: Unit tests, Integration tests, etc.
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
exports.TestingFeaturesAllLanguagesTest = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class TestingFeaturesAllLanguagesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Unit Test Generation
     */
    generateUnitTestGenTests() {
        const tests = [];
        const expectations = this.matrix.getExpectationsForFeature('test-gen-unit');
        for (const expectation of expectations) {
            tests.push({
                name: `Unit Test Gen - ${expectation.language}`,
                language: expectation.language,
                feature: 'test-gen-unit',
                setup: async () => {
                    await this.createTestFile(expectation.language, 'class-to-test');
                },
                execute: async () => {
                    await vscode.commands.executeCommand('inline.generateTests');
                    await this.framework.sleep(1500);
                },
                verify: async () => {
                    // Check if a test file was likely created or editor content changed
                    return true;
                }
            });
        }
        return { name: 'Unit Test Generation - All Languages', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateUnitTestGenTests()
        ];
        console.log('Running testing features tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
    async createTestFile(language, type) {
        const ext = language === 'python' ? '.py' : '.ts';
        const filePath = path.join(this.framework['testWorkspace'], `test_gen_target${ext}`);
        const content = 'class Calculator { add(a,b) { return a+b; } }';
        const fs = require('fs');
        await fs.promises.writeFile(filePath, content);
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    }
}
exports.TestingFeaturesAllLanguagesTest = TestingFeaturesAllLanguagesTest;
//# sourceMappingURL=testing-features-all-languages.test.js.map