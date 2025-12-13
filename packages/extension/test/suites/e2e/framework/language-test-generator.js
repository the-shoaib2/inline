"use strict";
/**
 * Language Test Generator
 * Automatically generates test cases for all supported languages
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
exports.LanguageTestGenerator = void 0;
const fs = __importStar(require("fs"));
const core_1 = require("@inline/core");
class LanguageTestGenerator {
    constructor(languagesJsonPath) {
        this.languages = new Map();
        this.languagesJsonPath = languagesJsonPath;
        this.loadLanguages();
    }
    /**
     * Load language definitions from languages.json
     */
    loadLanguages() {
        const content = fs.readFileSync(this.languagesJsonPath, 'utf-8');
        const languagesData = JSON.parse(content);
        for (const [langName, patterns] of Object.entries(languagesData)) {
            const extensions = this.getExtensionsForLanguage(langName);
            this.languages.set(langName, {
                name: langName,
                extensions,
                patterns: patterns
            });
        }
    }
    /**
     * Get file extensions for a language
     */
    getExtensionsForLanguage(language) {
        const extensionMap = {
            'typescript': ['.ts', '.tsx'],
            'javascript': ['.js', '.jsx', '.mjs'],
            'python': ['.py'],
            'java': ['.java'],
            'cpp': ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
            'c': ['.c', '.h'],
            'go': ['.go'],
            'rust': ['.rs'],
            'php': ['.php'],
            'ruby': ['.rb'],
            'swift': ['.swift'],
            'kotlin': ['.kt', '.kts'],
            'csharp': ['.cs'],
            'scala': ['.scala'],
            'dart': ['.dart'],
            'haskell': ['.hs'],
            'elixir': ['.ex', '.exs'],
            'erlang': ['.erl'],
            'clojure': ['.clj', '.cljs'],
            'lua': ['.lua'],
            'r': ['.r', '.R'],
            'julia': ['.jl'],
            'perl': ['.pl', '.pm'],
            'objectivec': ['.m', '.mm'],
            'sql': ['.sql'],
            'shell': ['.sh', '.bash'],
            'powershell': ['.ps1'],
            'groovy': ['.groovy'],
            'matlab': ['.m'],
            'fortran': ['.f', '.f90', '.f95'],
            'cobol': ['.cob', '.cbl'],
            'vb': ['.vb'],
            'fsharp': ['.fs', '.fsx'],
            'ocaml': ['.ml', '.mli'],
            'nim': ['.nim'],
            'crystal': ['.cr'],
            'zig': ['.zig'],
            'v': ['.v'],
            'solidity': ['.sol'],
            'ada': ['.ada', '.adb'],
            'pascal': ['.pas'],
            'd': ['.d'],
            'racket': ['.rkt'],
            'scheme': ['.scm'],
            'commonlisp': ['.lisp', '.cl']
        };
        return extensionMap[language] || [`.${language}`];
    }
    /**
     * Get all supported languages
     */
    getAllLanguages() {
        return Array.from(this.languages.values());
    }
    /**
     * Get language definition
     */
    getLanguage(name) {
        return this.languages.get(name);
    }
    /**
     * Check if a feature is applicable to a language
     */
    isFeatureApplicableToLanguage(featureId, language) {
        // OOP-only features
        const oopFeatures = [
            'completion-class',
            'gen-getters-setters',
            'gen-constructors',
            'completion-method-chain'
        ];
        const oopLanguages = [
            'typescript', 'javascript', 'java', 'cpp', 'csharp',
            'python', 'ruby', 'swift', 'kotlin', 'scala', 'php',
            'dart', 'groovy', 'objectivec', 'fsharp', 'crystal'
        ];
        if (oopFeatures.includes(featureId) && !oopLanguages.includes(language)) {
            return false;
        }
        // Type-specific features
        const typeFeatures = [
            'completion-generic-type',
            'gen-type-defs',
            'gen-interface-json',
            'error-type-check',
            'understand-hover-type'
        ];
        const typedLanguages = [
            'typescript', 'java', 'cpp', 'csharp', 'rust', 'go',
            'swift', 'kotlin', 'scala', 'haskell', 'fsharp', 'ocaml'
        ];
        if (typeFeatures.includes(featureId) && !typedLanguages.includes(language)) {
            return false;
        }
        // SQL-specific features
        if (featureId === 'gen-sql' && language !== 'sql') {
            return false;
        }
        // HTML/XML-specific features
        const markupFeatures = ['completion-auto-close-tag'];
        const markupLanguages = ['html', 'xml', 'jsx', 'tsx'];
        if (markupFeatures.includes(featureId) && !markupLanguages.includes(language)) {
            return false;
        }
        // Compilation-specific features
        const compilationFeatures = [
            'build-compile',
            'build-auto-save',
            'build-idle',
            'build-suggest',
            'build-state-track'
        ];
        const compiledLanguages = [
            'java', 'cpp', 'c', 'go', 'rust', 'csharp', 'swift',
            'kotlin', 'scala', 'haskell', 'ocaml', 'fortran', 'ada'
        ];
        if (compilationFeatures.includes(featureId) && !compiledLanguages.includes(language)) {
            return false;
        }
        return true;
    }
    /**
     * Generate feature-language test matrix
     */
    generateTestMatrix() {
        const matrix = [];
        const languages = this.getAllLanguages();
        for (const feature of core_1.FEATURE_REGISTRY) {
            if (!feature.implemented) {
                continue;
            }
            const applicableLanguages = languages
                .filter(lang => this.isFeatureApplicableToLanguage(feature.id, lang.name))
                .map(lang => lang.name);
            if (applicableLanguages.length > 0) {
                matrix.push({
                    featureId: feature.id,
                    applicableLanguages,
                    testTemplate: this.getTestTemplate(feature.id, feature.category || 'Uncategorized')
                });
            }
        }
        return matrix;
    }
    /**
     * Get test template for a feature
     */
    getTestTemplate(featureId, category) {
        // Return appropriate test template based on feature category
        const templates = {
            'Code Completion': 'completion',
            'Code Generation': 'generation',
            'Code Understanding': 'understanding',
            'Code Navigation': 'navigation',
            'Refactoring': 'refactoring',
            'Code Actions': 'actions',
            'Error Detection': 'validation',
            'Error Assistance': 'assistance',
            'Smart Commands': 'commands',
            'Test Generation': 'test-generation'
        };
        return templates[category] || 'generic';
    }
    /**
     * Generate test statistics
     */
    getTestStatistics() {
        const matrix = this.generateTestMatrix();
        const totalLanguages = this.languages.size;
        const totalFeatures = core_1.FEATURE_REGISTRY.filter(f => f.implemented).length;
        const totalTests = matrix.reduce((sum, m) => sum + m.applicableLanguages.length, 0);
        const featureCoverage = new Map();
        for (const mapping of matrix) {
            featureCoverage.set(mapping.featureId, mapping.applicableLanguages.length);
        }
        const languageCoverage = new Map();
        for (const lang of this.languages.keys()) {
            // If the user meant to add a category to the language coverage, the logic would need to be different.
            // For now, I will insert the line as a comment to avoid a `ReferenceError` and maintain syntactic correctness.
            // const categoryName = f.category || 'Uncategorized'; // 'f' is not defined in this scope.
            const count = matrix.filter(m => m.applicableLanguages.includes(lang)).length;
            languageCoverage.set(lang, count);
        }
        return {
            totalLanguages,
            totalFeatures,
            totalTests,
            avgTestsPerFeature: totalTests / totalFeatures,
            avgTestsPerLanguage: totalTests / totalLanguages,
            featureCoverage: Object.fromEntries(featureCoverage),
            languageCoverage: Object.fromEntries(languageCoverage)
        };
    }
    /**
     * Export test matrix to JSON
     */
    exportTestMatrix(outputPath) {
        const matrix = this.generateTestMatrix();
        const stats = this.getTestStatistics();
        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalLanguages: stats.totalLanguages,
                totalFeatures: stats.totalFeatures,
                totalTests: stats.totalTests
            },
            statistics: stats,
            matrix
        };
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Test matrix exported to: ${outputPath}`);
    }
}
exports.LanguageTestGenerator = LanguageTestGenerator;
//# sourceMappingURL=language-test-generator.js.map