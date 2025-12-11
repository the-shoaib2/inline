/**
 * Standalone verification script for MockLlamaEngine
 * Tests the mock engine without requiring VS Code test infrastructure
 */

import { MockLlamaEngine } from './mock-llama-engine';

async function testMockEngine() {
    console.log('=== Testing MockLlamaEngine ===\n');

    const engine = new MockLlamaEngine();

    // Test 1: Model Loading
    console.log('Test 1: Model Loading');
    try {
        await engine.loadModel('mock://test-model', {
            threads: 4,
            gpuLayers: 0,
            contextSize: 4096
        });
        console.log('✓ Model loaded successfully');
        console.log(`  Status: ${JSON.stringify(engine.getModelStatus())}`);
    } catch (error) {
        console.error('✗ Model loading failed:', error);
        return;
    }
    console.log('');

    // Test 2: TypeScript Function Generation
    console.log('Test 2: TypeScript Function Generation');
    try {
        const prompt = '// Create a function that adds two numbers\n';
        const completion = await engine.generateCompletion(prompt, { maxTokens: 100 });
        console.log('✓ Completion generated');
        console.log(`  Prompt: "${prompt.trim()}"`);
        console.log(`  Completion:\n${completion}`);
    } catch (error) {
        console.error('✗ Completion failed:', error);
    }
    console.log('');

    // Test 3: Python Function Generation
    console.log('Test 3: Python Function Generation');
    try {
        const prompt = '# Create a function that sorts a list\n';
        const completion = await engine.generateCompletion(prompt, { maxTokens: 100 });
        console.log('✓ Completion generated');
        console.log(`  Prompt: "${prompt.trim()}"`);
        console.log(`  Completion:\n${completion}`);
    } catch (error) {
        console.error('✗ Completion failed:', error);
    }
    console.log('');

    // Test 4: Class Method Completion
    console.log('Test 4: Class Method Completion');
    try {
        const prompt = 'class Calculator {\n  ';
        const completion = await engine.generateCompletion(prompt, { maxTokens: 100 });
        console.log('✓ Completion generated');
        console.log(`  Prompt: "${prompt.trim()}"`);
        console.log(`  Completion:\n${completion}`);
    } catch (error) {
        console.error('✗ Completion failed:', error);
    }
    console.log('');

    // Test 5: Import Statement
    console.log('Test 5: Import Statement');
    try {
        const prompt = 'import ';
        const completion = await engine.generateCompletion(prompt, { maxTokens: 50 });
        console.log('✓ Completion generated');
        console.log(`  Prompt: "${prompt.trim()}"`);
        console.log(`  Completion: ${completion}`);
    } catch (error) {
        console.error('✗ Completion failed:', error);
    }
    console.log('');

    // Test 6: Model Unloading
    console.log('Test 6: Model Unloading');
    try {
        await engine.unloadModel();
        console.log('✓ Model unloaded successfully');
        console.log(`  Status: ${JSON.stringify(engine.getModelStatus())}`);
    } catch (error) {
        console.error('✗ Model unloading failed:', error);
    }
    console.log('');

    // Test 7: Error Handling (generation without loaded model)
    console.log('Test 7: Error Handling (generation without loaded model)');
    try {
        await engine.generateCompletion('test', {});
        console.error('✗ Should have thrown error');
    } catch (error) {
        console.log('✓ Correctly threw error:', (error as Error).message);
    }
    console.log('');

    console.log('=== All Tests Completed ===');
}

// Run tests
testMockEngine().catch(console.error);
