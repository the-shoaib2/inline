"use strict";
/**
 * Feature Test Matrix
 * Maps features to languages and defines test expectations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureTestMatrix = void 0;
const language_test_generator_1 = require("./language-test-generator");
const core_1 = require("@inline/core");
class FeatureTestMatrix {
    constructor(languagesJsonPath) {
        this.expectations = new Map();
        this.generator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
        this.buildExpectations();
    }
    /**
     * Build test expectations for all feature-language combinations
     */
    buildExpectations() {
        const matrix = this.generator.generateTestMatrix();
        for (const mapping of matrix) {
            for (const language of mapping.applicableLanguages) {
                const key = `${mapping.featureId}:${language}`;
                const expectation = this.createExpectation(mapping.featureId, language);
                this.expectations.set(key, expectation);
            }
        }
    }
    /**
     * Create test expectation for a feature-language pair
     */
    createExpectation(featureId, language) {
        const feature = core_1.FEATURE_REGISTRY.find(f => f.id === featureId);
        return {
            featureId,
            language,
            shouldPass: true,
            expectedBehavior: this.getExpectedBehavior(featureId, language),
            edgeCases: this.getEdgeCases(featureId, language),
            knownLimitations: this.getKnownLimitations(featureId, language)
        };
    }
    /**
     * Get expected behavior for a feature in a specific language
     */
    getExpectedBehavior(featureId, language) {
        const behaviors = {
            'completion-single-line': `Should provide single-line code completion for ${language}`,
            'completion-multi-line': `Should provide multi-line code completion for ${language}`,
            'completion-function': `Should generate complete function implementations in ${language}`,
            'completion-class': `Should scaffold class structures in ${language}`,
            'gen-tests': `Should generate unit tests in ${language} test framework`,
            'gen-docs': `Should generate documentation comments in ${language} style`,
            'nav-go-to-def': `Should navigate to symbol definitions in ${language}`,
            'refactor-rename': `Should rename symbols across all references in ${language}`,
            'error-syntax': `Should detect syntax errors in ${language}`,
            'error-type-check': `Should perform type checking in ${language}`
        };
        return behaviors[featureId] || `Should work correctly for ${language}`;
    }
    /**
     * Get edge cases for a feature in a specific language
     */
    getEdgeCases(featureId, language) {
        const edgeCases = {
            'completion-function': [
                'Async functions',
                'Generic functions',
                'Nested functions',
                'Arrow functions',
                'Function overloads'
            ],
            'completion-class': [
                'Abstract classes',
                'Generic classes',
                'Nested classes',
                'Multiple inheritance',
                'Interface implementations'
            ],
            'refactor-rename': [
                'Rename across multiple files',
                'Rename with conflicts',
                'Rename in comments',
                'Rename in strings'
            ]
        };
        return edgeCases[featureId] || [];
    }
    /**
     * Get known limitations for a feature in a specific language
     */
    getKnownLimitations(featureId, language) {
        const limitations = {};
        // Add language-specific limitations
        if (language === 'python' && featureId.includes('type')) {
            return ['Type hints are optional in Python'];
        }
        if (language === 'javascript' && featureId.includes('type')) {
            return ['No native type system in JavaScript'];
        }
        return limitations[`${featureId}:${language}`] || [];
    }
    /**
     * Get expectation for a feature-language pair
     */
    getExpectation(featureId, language) {
        return this.expectations.get(`${featureId}:${language}`);
    }
    /**
     * Get all expectations
     */
    getAllExpectations() {
        return Array.from(this.expectations.values());
    }
    /**
     * Get expectations for a feature
     */
    getExpectationsForFeature(featureId) {
        return Array.from(this.expectations.values())
            .filter(e => e.featureId === featureId);
    }
    /**
     * Get expectations for a language
     */
    getExpectationsForLanguage(language) {
        return Array.from(this.expectations.values())
            .filter(e => e.language === language);
    }
    /**
     * Get test coverage statistics
     */
    getCoverageStatistics() {
        const totalExpectations = this.expectations.size;
        const byFeature = new Map();
        const byLanguage = new Map();
        for (const expectation of this.expectations.values()) {
            byFeature.set(expectation.featureId, (byFeature.get(expectation.featureId) || 0) + 1);
            byLanguage.set(expectation.language, (byLanguage.get(expectation.language) || 0) + 1);
        }
        return {
            totalExpectations,
            uniqueFeatures: byFeature.size,
            uniqueLanguages: byLanguage.size,
            byFeature: Object.fromEntries(byFeature),
            byLanguage: Object.fromEntries(byLanguage)
        };
    }
    /**
     * Export expectations to JSON
     */
    exportExpectations(outputPath) {
        const fs = require('fs');
        const expectations = this.getAllExpectations();
        const stats = this.getCoverageStatistics();
        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalExpectations: expectations.length
            },
            statistics: stats,
            expectations
        };
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Expectations exported to: ${outputPath}`);
    }
}
exports.FeatureTestMatrix = FeatureTestMatrix;
//# sourceMappingURL=feature-test-matrix.js.map