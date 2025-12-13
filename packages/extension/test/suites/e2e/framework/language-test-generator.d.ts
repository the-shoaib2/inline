/**
 * Language Test Generator
 * Automatically generates test cases for all supported languages
 */
export interface LanguageDefinition {
    name: string;
    extensions: string[];
    patterns: {
        imports: string[];
        functions: string[];
        classes: string[];
        interfaces?: string[];
        types?: string[];
        variables?: string[];
        comments: string[];
    };
}
export interface FeatureLanguageMapping {
    featureId: string;
    applicableLanguages: string[];
    testTemplate: string;
}
export declare class LanguageTestGenerator {
    private languages;
    private languagesJsonPath;
    constructor(languagesJsonPath: string);
    /**
     * Load language definitions from languages.json
     */
    private loadLanguages;
    /**
     * Get file extensions for a language
     */
    private getExtensionsForLanguage;
    /**
     * Get all supported languages
     */
    getAllLanguages(): LanguageDefinition[];
    /**
     * Get language definition
     */
    getLanguage(name: string): LanguageDefinition | undefined;
    /**
     * Check if a feature is applicable to a language
     */
    isFeatureApplicableToLanguage(featureId: string, language: string): boolean;
    /**
     * Generate feature-language test matrix
     */
    generateTestMatrix(): FeatureLanguageMapping[];
    /**
     * Get test template for a feature
     */
    private getTestTemplate;
    /**
     * Generate test statistics
     */
    getTestStatistics(): {
        totalLanguages: number;
        totalFeatures: number;
        totalTests: number;
        avgTestsPerFeature: number;
        avgTestsPerLanguage: number;
        featureCoverage: {
            [k: string]: number;
        };
        languageCoverage: {
            [k: string]: number;
        };
    };
    /**
     * Export test matrix to JSON
     */
    exportTestMatrix(outputPath: string): void;
}
//# sourceMappingURL=language-test-generator.d.ts.map