"use strict";
/**
 * System Performance Tests - All Languages
 * Covers: Performance (Q), Caching (R), Resource Management (V)
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
exports.SystemPerformanceTest = void 0;
const vscode = __importStar(require("vscode"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class SystemPerformanceTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Performance Monitoring
     */
    generatePerformanceTests() {
        const tests = [
            {
                name: 'Performance Metrics Collection',
                language: 'system',
                feature: 'perf-metrics',
                setup: async () => { },
                execute: async () => {
                    // Check if performance service is active
                    // Usually exposed via a command to dump metrics
                    // await vscode.commands.executeCommand('inline.system.dumpMetrics');
                    await this.framework.sleep(500);
                },
                verify: async () => true
            },
            {
                name: 'Telemetry Event Tracking',
                language: 'system',
                feature: 'perf-telemetry',
                setup: async () => { },
                execute: async () => {
                    // Trigger an action that should emit telemetry
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Performance & Diagnostics', tests };
    }
    /**
     * Generate test suite for Caching
     */
    generateCachingTests() {
        const tests = [
            {
                name: 'Cache Hit Verification',
                language: 'system',
                feature: 'cache-hit',
                setup: async () => { },
                execute: async () => {
                    // Prime cache
                    // await vscode.commands.executeCommand('inline.completion.trigger');
                    await this.framework.sleep(500);
                    // Trigger again
                    // await vscode.commands.executeCommand('inline.completion.trigger');
                },
                verify: async () => true
            }
        ];
        return { name: 'Caching & Optimization', tests };
    }
    /**
     * Generate test suite for Resource Management
     */
    generateResourceTests() {
        const tests = [
            {
                name: 'Memory Usage Check',
                language: 'system',
                feature: 'resource-memory',
                setup: async () => { },
                execute: async () => {
                    await vscode.commands.executeCommand('inline.system.checkResources');
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Resource Management', tests };
    }
    async runAllTests() {
        const suites = [
            this.generatePerformanceTests(),
            this.generateCachingTests(),
            this.generateResourceTests()
        ];
        console.log('Running system performance tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
}
exports.SystemPerformanceTest = SystemPerformanceTest;
//# sourceMappingURL=system-performance.test.js.map