/**
 * Generate Language Fixtures Script
 * Creates sample code files for all supported languages
 */

import * as path from 'path';
import { LanguageFixtureGenerator } from './helpers/language-fixture-generator';

async function main() {
    console.log('Generating language fixtures for all supported languages...\n');

    const workspaceRoot = path.join(__dirname, '../../..');
    const fixturesDir = path.join(workspaceRoot, 'test/fixtures/languages');

    const generator = new LanguageFixtureGenerator(fixturesDir);
    await generator.generateAllFixtures();

    console.log('\n✓ All language fixtures generated successfully!');
    console.log(`Location: ${fixturesDir}`);
}

main().catch(error => {
    console.error('Failed to generate fixtures:', error);
    process.exit(1);
});
