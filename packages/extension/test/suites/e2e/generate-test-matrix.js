"use strict";
/**
 * Generate Test Matrix Script
 * Creates feature-language test matrix
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
const path = __importStar(require("path"));
const language_test_generator_1 = require("./framework/language-test-generator");
const feature_test_matrix_1 = require("./framework/feature-test-matrix");
async function main() {
    console.log('Generating test matrix...\n');
    const workspaceRoot = path.join(__dirname, '../../..');
    const languagesJsonPath = path.join(workspaceRoot, 'src/resources/languages.json');
    const outputDir = path.join(workspaceRoot, 'test/fixtures/test-workspace');
    // Generate test matrix
    const generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
    const stats = generator.getTestStatistics();
    console.log('Test Matrix Statistics:');
    console.log(`  Total Languages: ${stats.totalLanguages}`);
    console.log(`  Total Features: ${stats.totalFeatures}`);
    console.log(`  Total Tests: ${stats.totalTests}`);
    console.log(`  Avg Tests per Feature: ${stats.avgTestsPerFeature.toFixed(2)}`);
    console.log(`  Avg Tests per Language: ${stats.avgTestsPerLanguage.toFixed(2)}`);
    // Export matrix
    const matrixPath = path.join(outputDir, 'test-matrix.json');
    generator.exportTestMatrix(matrixPath);
    console.log(`\n✓ Test matrix exported to: ${matrixPath}`);
    // Generate expectations
    const matrix = new feature_test_matrix_1.FeatureTestMatrix(languagesJsonPath);
    const coverageStats = matrix.getCoverageStatistics();
    console.log('\nTest Coverage Statistics:');
    console.log(`  Total Expectations: ${coverageStats.totalExpectations}`);
    console.log(`  Unique Features: ${coverageStats.uniqueFeatures}`);
    console.log(`  Unique Languages: ${coverageStats.uniqueLanguages}`);
    // Export expectations
    const expectationsPath = path.join(outputDir, 'test-expectations.json');
    matrix.exportExpectations(expectationsPath);
    console.log(`\n✓ Test expectations exported to: ${expectationsPath}`);
}
main().catch(error => {
    console.error('Failed to generate test matrix:', error);
    process.exit(1);
});
//# sourceMappingURL=generate-test-matrix.js.map