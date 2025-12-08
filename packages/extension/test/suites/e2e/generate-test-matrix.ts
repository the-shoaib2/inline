/**
 * Generate Test Matrix Script
 * Creates feature-language test matrix
 */

import * as path from 'path';
import { LanguageTestGenerator } from './framework/language-test-generator';
import { FeatureTestMatrix } from './framework/feature-test-matrix';

async function main() {
    console.log('Generating test matrix...\n');

    const workspaceRoot = path.join(__dirname, '../../..');
    const languagesJsonPath = path.join(workspaceRoot, 'src/resources/languages.json');
    const outputDir = path.join(workspaceRoot, 'test/fixtures/test-workspace');

    // Generate test matrix
    const generator = new LanguageTestGenerator(languagesJsonPath);
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
    const matrix = new FeatureTestMatrix(languagesJsonPath);
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
