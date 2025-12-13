/**
 * Language Fixture Generator
 * Creates sample code files for all supported languages
 */
export interface LanguageFixture {
    language: string;
    extension: string;
    basicSyntax: string;
    classExample?: string;
    functionExample: string;
    importExample?: string;
    errorExample: string;
}
export declare class LanguageFixtureGenerator {
    private fixturesDir;
    constructor(fixturesDir: string);
    /**
     * Generate all language fixtures
     */
    generateAllFixtures(): Promise<void>;
    /**
     * Create a single fixture file
     */
    private createFixture;
    /**
     * Get all language fixtures
     */
    private getAllFixtures;
}
//# sourceMappingURL=language-fixture-generator.d.ts.map