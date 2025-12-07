import * as path from 'path';
import { CompletionAllLanguagesTest } from './features/completion-all-languages.test';
import { GenerationAllLanguagesTest } from './features/generation-all-languages.test';
import { ValidationAllLanguagesTest } from './features/validation-all-languages.test';
import { NavigationAllLanguagesTest } from './features/navigation-all-languages.test';
import { RefactoringAllLanguagesTest } from './features/refactoring-all-languages.test';
import { UnderstandingAllLanguagesTest } from './features/understanding-all-languages.test';
import { ActionsAllLanguagesTest } from './features/actions-all-languages.test';
import { SmartCommandsAllLanguagesTest } from './features/smart-commands-all-languages.test';
import { TestingFeaturesAllLanguagesTest } from './features/testing-features-all-languages.test';
import { ProjectToolsAllLanguagesTest } from './features/project-tools-all-languages.test';
import { ExecutionToolsAllLanguagesTest } from './features/execution-tools-all-languages.test';
import { SystemPerformanceTest } from './features/system-performance.test';
import { CoreIntelligenceTest } from './features/core-intelligence.test';
import { PlatformFeaturesTest } from './features/platform-features.test';
import { LanguageFixtureGenerator } from './helpers/language-fixture-generator';
import { LanguageTestGenerator } from './framework/language-test-generator';
import { FeatureTestMatrix } from './framework/feature-test-matrix';

export async function run(): Promise<void> {
    console.log('='.repeat(80));
    console.log('E2E Test Suite - All Features & All Languages');
    console.log('='.repeat(80));

    const workspaceRoot = path.join(__dirname, '../../..');
    const testWorkspace = path.join(workspaceRoot, 'test/fixtures/test-workspace');
    const languagesJsonPath = path.join(workspaceRoot, 'src/resources/languages.json');
    const fixturesDir = path.join(workspaceRoot, 'test/fixtures/languages');

    // Step 1: Generate language fixtures
    console.log('\n[1/7] Generating language fixtures...');
    const fixtureGenerator = new LanguageFixtureGenerator(fixturesDir);
    await fixtureGenerator.generateAllFixtures();
    console.log('✓ Language fixtures generated');

    // Step 2: Generate test matrix
    console.log('\n[2/7] Generating test matrix...');
    const testGenerator = new LanguageTestGenerator(languagesJsonPath);
    const stats = testGenerator.getTestStatistics();
    console.log(`✓ Test matrix generated:`);
    console.log(`  - Languages: ${stats.totalLanguages}`);
    console.log(`  - Features: ${stats.totalFeatures}`);
    console.log(`  - Total tests: ${stats.totalTests}`);
    
    // Export test matrix
    const matrixPath = path.join(testWorkspace, 'test-matrix.json');
    testGenerator.exportTestMatrix(matrixPath);
    console.log(`✓ Test matrix exported to: ${matrixPath}`);

    // Step 3: Run completion tests
    console.log('\n[3/7] Running completion tests...');
    const completionTests = new CompletionAllLanguagesTest(testWorkspace, languagesJsonPath);
    await completionTests.runAllTests();
    console.log('✓ Completion tests completed');

    // Step 4: Run generation tests
    console.log('\n[4/7] Running generation tests...');
    const generationTests = new GenerationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await generationTests.runAllTests();
    console.log('✓ Generation tests completed');

    // Step 5: Run validation tests
    console.log('\n[5/7] Running validation tests...');
    const validationTests = new ValidationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await validationTests.runAllTests();
    console.log('✓ Validation tests completed');

    // Step 6: Run navigation tests
    console.log('\n[6/9] Running navigation tests...');
    const navigationTests = new NavigationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await navigationTests.runAllTests();
    console.log('✓ Navigation tests completed');

    // Step 7: Run refactoring tests
     console.log('\n[7/9] Running refactoring tests...');
    const refactoringTests = new RefactoringAllLanguagesTest(testWorkspace, languagesJsonPath);
    await refactoringTests.runAllTests();
    console.log('✓ Refactoring tests completed');

    // Step 8: Run code understanding tests
    console.log('\n[8/9] Running code understanding tests...');
    const understandingTests = new UnderstandingAllLanguagesTest(testWorkspace, languagesJsonPath);
    await understandingTests.runAllTests();
    console.log('✓ Code understanding tests completed');

    // Step 9: Run code actions tests
    console.log('\n[9/11] Running code actions tests...');
    const actionsTests = new ActionsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await actionsTests.runAllTests();
    console.log('✓ Code actions tests completed');

    // Step 10: Run smart commands tests
    console.log('\n[10/11] Running smart commands tests...');
    const smartCommandsTests = new SmartCommandsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await smartCommandsTests.runAllTests();
    console.log('✓ Smart commands tests completed');

    // Step 11: Run testing features tests
    console.log('\n[11/12] Running testing features tests...');
    const testingFeaturesTests = new TestingFeaturesAllLanguagesTest(testWorkspace, languagesJsonPath);
    await testingFeaturesTests.runAllTests();
    console.log('✓ Testing features tests completed');

    // Step 12: Run project tools tests
    console.log('\n[12/13] Running project tools tests...');
    const projectToolsTests = new ProjectToolsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await projectToolsTests.runAllTests();
    console.log('✓ Project tools tests completed');

    // Step 13: Run execution tools tests
    console.log('\n[13/14] Running execution tools tests...');
    const executionToolsTests = new ExecutionToolsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await executionToolsTests.runAllTests();
    console.log('✓ Execution tools tests completed');

    // Step 14: Run system performance tests
    console.log('\n[14/15] Running system performance tests...');
    const systemPerfTests = new SystemPerformanceTest(testWorkspace, languagesJsonPath);
    await systemPerfTests.runAllTests();
    console.log('✓ System performance tests completed');

    // Step 15: Run core intelligence tests
    console.log('\n[15/16] Running core intelligence tests...');
    const coreIntelligenceTests = new CoreIntelligenceTest(testWorkspace, languagesJsonPath);
    await coreIntelligenceTests.runAllTests();
    console.log('✓ Core intelligence tests completed');

    // Step 16: Run platform features tests
    console.log('\n[16/16] Running platform features tests...');
    const platformFeaturesTests = new PlatformFeaturesTest(testWorkspace, languagesJsonPath);
    await platformFeaturesTests.runAllTests();
    console.log('✓ Platform features tests completed');


    console.log('\n' + '='.repeat(80));
    console.log('Test execution finished. Check reports in test/fixtures/test-workspace/');
    console.log('='.repeat(80));
}

// Run if executed directly
if (require.main === module) {
    run().catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}
