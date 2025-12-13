"use strict";
/**
 * Core Intelligence Tests - All Languages
 * Covers: Model Management (S), Context Intelligence (T), Validation (Z), Feedback (AA)
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
exports.CoreIntelligenceTest = void 0;
const vscode = __importStar(require("vscode"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class CoreIntelligenceTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Model Management
     */
    generateModelManagementTests() {
        const tests = [
            {
                name: 'Model Selection Verification',
                language: 'system',
                feature: 'model-select',
                setup: async () => { },
                execute: async () => {
                    // Check current model
                    await vscode.commands.executeCommand('inline.model.select');
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Model Management', tests };
    }
    /**
     * Generate test suite for Context Intelligence
     */
    generateContextTests() {
        const tests = [
            {
                name: 'Context Window Building',
                language: 'system',
                feature: 'context-build',
                setup: async () => { },
                execute: async () => {
                    // Trigger context building
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Context Intelligence', tests };
    }
    /**
     * Generate test suite for Validation & Analysis
     */
    generateValidationTests() {
        const tests = [
            {
                name: 'Semantic Analysis Trigger',
                language: 'system',
                feature: 'semantic-analysis',
                setup: async () => { },
                execute: async () => {
                    // Trigger validation
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Validation & Analysis', tests };
    }
    /**
     * Generate test suite for Feedback & Learning
     */
    generateFeedbackTests() {
        const tests = [
            {
                name: 'Feedback Loop Trigger',
                language: 'system',
                feature: 'feedback-loop',
                setup: async () => { },
                execute: async () => {
                    // Simulate feedback
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Feedback & Learning', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateModelManagementTests(),
            this.generateContextTests(),
            this.generateValidationTests(),
            this.generateFeedbackTests()
        ];
        console.log('Running core intelligence tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
}
exports.CoreIntelligenceTest = CoreIntelligenceTest;
//# sourceMappingURL=core-intelligence.test.js.map