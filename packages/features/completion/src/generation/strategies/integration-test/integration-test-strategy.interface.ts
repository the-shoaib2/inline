
export interface IntegrationTestStrategy {
    generateIntegrationTest(componentName: string, dependencies: string[]): string;
    supports(languageId: string): boolean;
}
