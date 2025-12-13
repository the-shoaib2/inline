"use strict";
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
exports.run = run;
const path = __importStar(require("path"));
const completion_all_languages_test_1 = require("./features/completion-all-languages.test");
const generation_all_languages_test_1 = require("./features/generation-all-languages.test");
const validation_all_languages_test_1 = require("./features/validation-all-languages.test");
const navigation_all_languages_test_1 = require("./features/navigation-all-languages.test");
const refactoring_all_languages_test_1 = require("./features/refactoring-all-languages.test");
const understanding_all_languages_test_1 = require("./features/understanding-all-languages.test");
const actions_all_languages_test_1 = require("./features/actions-all-languages.test");
const smart_commands_all_languages_test_1 = require("./features/smart-commands-all-languages.test");
const testing_features_all_languages_test_1 = require("./features/testing-features-all-languages.test");
const project_tools_all_languages_test_1 = require("./features/project-tools-all-languages.test");
const execution_tools_all_languages_test_1 = require("./features/execution-tools-all-languages.test");
const system_performance_test_1 = require("./features/system-performance.test");
const core_intelligence_test_1 = require("./features/core-intelligence.test");
const platform_features_test_1 = require("./features/platform-features.test");
const language_fixture_generator_1 = require("./helpers/language-fixture-generator");
const language_test_generator_1 = require("./framework/language-test-generator");
async function run() {
    console.log('='.repeat(80));
    console.log('E2E Test Suite - All Features & All Languages');
    console.log('='.repeat(80));
    const workspaceRoot = path.join(__dirname, '../../..');
    const testWorkspace = path.join(workspaceRoot, 'test/fixtures/test-workspace');
    const languagesJsonPath = path.join(workspaceRoot, 'src/resources/languages.json');
    const fixturesDir = path.join(workspaceRoot, 'test/fixtures/languages');
    // Step 1: Generate language fixtures
    console.log('\n[1/7] Generating language fixtures...');
    const fixtureGenerator = new language_fixture_generator_1.LanguageFixtureGenerator(fixturesDir);
    await fixtureGenerator.generateAllFixtures();
    console.log('✓ Language fixtures generated');
    // Step 2: Generate test matrix
    console.log('\n[2/7] Generating test matrix...');
    const testGenerator = new language_test_generator_1.LanguageTestGenerator(languagesJsonPath);
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
    const completionTests = new completion_all_languages_test_1.CompletionAllLanguagesTest(testWorkspace, languagesJsonPath);
    await completionTests.runAllTests();
    console.log('✓ Completion tests completed');
    // Step 4: Run generation tests
    console.log('\n[4/7] Running generation tests...');
    const generationTests = new generation_all_languages_test_1.GenerationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await generationTests.runAllTests();
    console.log('✓ Generation tests completed');
    // Step 5: Run validation tests
    console.log('\n[5/7] Running validation tests...');
    const validationTests = new validation_all_languages_test_1.ValidationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await validationTests.runAllTests();
    console.log('✓ Validation tests completed');
    // Step 6: Run navigation tests
    console.log('\n[6/9] Running navigation tests...');
    const navigationTests = new navigation_all_languages_test_1.NavigationAllLanguagesTest(testWorkspace, languagesJsonPath);
    await navigationTests.runAllTests();
    console.log('✓ Navigation tests completed');
    // Step 7: Run refactoring tests
    console.log('\n[7/9] Running refactoring tests...');
    const refactoringTests = new refactoring_all_languages_test_1.RefactoringAllLanguagesTest(testWorkspace, languagesJsonPath);
    await refactoringTests.runAllTests();
    console.log('✓ Refactoring tests completed');
    // Step 8: Run code understanding tests
    console.log('\n[8/9] Running code understanding tests...');
    const understandingTests = new understanding_all_languages_test_1.UnderstandingAllLanguagesTest(testWorkspace, languagesJsonPath);
    await understandingTests.runAllTests();
    console.log('✓ Code understanding tests completed');
    // Step 9: Run code actions tests
    console.log('\n[9/11] Running code actions tests...');
    const actionsTests = new actions_all_languages_test_1.ActionsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await actionsTests.runAllTests();
    console.log('✓ Code actions tests completed');
    // Step 10: Run smart commands tests
    console.log('\n[10/11] Running smart commands tests...');
    const smartCommandsTests = new smart_commands_all_languages_test_1.SmartCommandsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await smartCommandsTests.runAllTests();
    console.log('✓ Smart commands tests completed');
    // Step 11: Run testing features tests
    console.log('\n[11/12] Running testing features tests...');
    const testingFeaturesTests = new testing_features_all_languages_test_1.TestingFeaturesAllLanguagesTest(testWorkspace, languagesJsonPath);
    await testingFeaturesTests.runAllTests();
    console.log('✓ Testing features tests completed');
    // Step 12: Run project tools tests
    console.log('\n[12/13] Running project tools tests...');
    const projectToolsTests = new project_tools_all_languages_test_1.ProjectToolsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await projectToolsTests.runAllTests();
    console.log('✓ Project tools tests completed');
    // Step 13: Run execution tools tests
    console.log('\n[13/14] Running execution tools tests...');
    const executionToolsTests = new execution_tools_all_languages_test_1.ExecutionToolsAllLanguagesTest(testWorkspace, languagesJsonPath);
    await executionToolsTests.runAllTests();
    console.log('✓ Execution tools tests completed');
    // Step 14: Run system performance tests
    console.log('\n[14/15] Running system performance tests...');
    const systemPerfTests = new system_performance_test_1.SystemPerformanceTest(testWorkspace, languagesJsonPath);
    await systemPerfTests.runAllTests();
    console.log('✓ System performance tests completed');
    // Step 15: Run core intelligence tests
    console.log('\n[15/16] Running core intelligence tests...');
    const coreIntelligenceTests = new core_intelligence_test_1.CoreIntelligenceTest(testWorkspace, languagesJsonPath);
    await coreIntelligenceTests.runAllTests();
    console.log('✓ Core intelligence tests completed');
    // Step 16: Run platform features tests
    console.log('\n[16/16] Running platform features tests...');
    const platformFeaturesTests = new platform_features_test_1.PlatformFeaturesTest(testWorkspace, languagesJsonPath);
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
//# sourceMappingURL=run-all-tests.js.map