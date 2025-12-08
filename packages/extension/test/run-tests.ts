/**
 * Test Runner
 * Runs all unit and integration tests
 */

import { runGeneratorTests } from './suites/unit/generators.test';
import { runValidatorTests } from './suites/unit/validators.test';
import { runIntegrationTests } from './suites/integration/feature-interactions.test';

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Running Complete Test Suite');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    try {
        // Unit Tests - Generators
        console.log('📦 UNIT TESTS - GENERATORS');
        console.log('-'.repeat(60));
        await runGeneratorTests();
        passed++;
    } catch (error) {
        console.error('❌ Generator tests failed:', error);
        failed++;
    }

    try {
        // Unit Tests - Validators
        console.log('📦 UNIT TESTS - VALIDATORS');
        console.log('-'.repeat(60));
        await runValidatorTests();
        passed++;
    } catch (error) {
        console.error('❌ Validator tests failed:', error);
        failed++;
    }

    try {
        // Integration Tests
        console.log('🔗 INTEGRATION TESTS');
        console.log('-'.repeat(60));
        await runIntegrationTests();
        passed++;
    } catch (error) {
        console.error('❌ Integration tests failed:', error);
        failed++;
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('='.repeat(60) + '\n');

    if (failed === 0) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed.\n');
        process.exit(1);
    }
}

// Run all tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
