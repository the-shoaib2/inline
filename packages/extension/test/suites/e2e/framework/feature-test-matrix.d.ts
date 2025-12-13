/**
 * Feature Test Matrix
 * Maps features to languages and defines test expectations
 */
export interface TestExpectation {
    featureId: string;
    language: string;
    shouldPass: boolean;
    expectedBehavior: string;
    edgeCases?: string[];
    knownLimitations?: string[];
}
export declare class FeatureTestMatrix {
    private generator;
    private expectations;
    constructor(languagesJsonPath: string);
    /**
     * Build test expectations for all feature-language combinations
     */
    private buildExpectations;
    /**
     * Create test expectation for a feature-language pair
     */
    private createExpectation;
    /**
     * Get expected behavior for a feature in a specific language
     */
    private getExpectedBehavior;
    /**
     * Get edge cases for a feature in a specific language
     */
    private getEdgeCases;
    /**
     * Get known limitations for a feature in a specific language
     */
    private getKnownLimitations;
    /**
     * Get expectation for a feature-language pair
     */
    getExpectation(featureId: string, language: string): TestExpectation | undefined;
    /**
     * Get all expectations
     */
    getAllExpectations(): TestExpectation[];
    /**
     * Get expectations for a feature
     */
    getExpectationsForFeature(featureId: string): TestExpectation[];
    /**
     * Get expectations for a language
     */
    getExpectationsForLanguage(language: string): TestExpectation[];
    /**
     * Get test coverage statistics
     */
    getCoverageStatistics(): {
        totalExpectations: number;
        uniqueFeatures: number;
        uniqueLanguages: number;
        byFeature: {
            [k: string]: number;
        };
        byLanguage: {
            [k: string]: number;
        };
    };
    /**
     * Export expectations to JSON
     */
    exportExpectations(outputPath: string): void;
}
//# sourceMappingURL=feature-test-matrix.d.ts.map