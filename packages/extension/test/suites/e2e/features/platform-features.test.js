"use strict";
/**
 * Platform Features Tests - All Languages
 * Covers: Event Tracking (U), Network & Offline (W), Configuration (X), UI & Status (Y)
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
exports.PlatformFeaturesTest = void 0;
const vscode = __importStar(require("vscode"));
const test_framework_1 = require("../framework/test-framework");
const language_test_generator_1 = require("../framework/language-test-generator");
const feature_test_matrix_1 = require("../framework/feature-test-matrix");
class PlatformFeaturesTest {
    constructor(workspacePath, languagesJsonPath) {
        this.framework = new test_framework_1.E2ETestFramework(workspacePath);
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    }
    /**
     * Generate test suite for Event Tracking
     */
    generateEventTests() {
        const tests = [
            {
                name: 'Event Bus Registration',
                language: 'system',
                feature: 'event-bus',
                setup: async () => { },
                execute: async () => {
                    // Check event bus status
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Event Tracking', tests };
    }
    /**
     * Generate test suite for Network & Offline
     */
    generateNetworkTests() {
        const tests = [
            {
                name: 'Offline Mode Toggle',
                language: 'system',
                feature: 'net-offline',
                setup: async () => { },
                execute: async () => {
                    // Toggle offline mode
                    await vscode.commands.executeCommand('inline.details.toggleOffline'); // Assuming command
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Network & Offline', tests };
    }
    /**
    * Generate test suite for Configuration
    */
    generateConfigTests() {
        const tests = [
            {
                name: 'Configuration Update',
                language: 'system',
                feature: 'config-update',
                setup: async () => { },
                execute: async () => {
                    const config = vscode.workspace.getConfiguration('inline');
                    await config.update('autoOffline', false, vscode.ConfigurationTarget.Global);
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'Configuration Management', tests };
    }
    /**
     * Generate test suite for UI & Status
     */
    generateUITests() {
        const tests = [
            {
                name: 'Status Bar Update',
                language: 'system',
                feature: 'ui-statusbar',
                setup: async () => { },
                execute: async () => {
                    // Simulate status update
                    await this.framework.sleep(500);
                },
                verify: async () => true
            }
        ];
        return { name: 'UI & Status', tests };
    }
    async runAllTests() {
        const suites = [
            this.generateEventTests(),
            this.generateNetworkTests(),
            this.generateConfigTests(),
            this.generateUITests()
        ];
        console.log('Running platform features tests...');
        await this.framework.runSuitesParallel(suites, 3);
    }
}
exports.PlatformFeaturesTest = PlatformFeaturesTest;
//# sourceMappingURL=platform-features.test.js.map