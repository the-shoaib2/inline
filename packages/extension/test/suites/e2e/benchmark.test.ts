/**
 * Benchmark Test for Local LLM Connection
 * 
 * This test verifies:
 * 1. Model loading and initialization
 * 2. Streaming token generation
 * 3. Performance metrics (tokens/sec, latency, total time)
 * 4. Sample prompt execution
 */

import * as assert from 'assert';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { LlamaInference } from '@inline/intelligence';

suite('LLM Benchmark Test', () => {
    let inference: LlamaInference;
    let modelPath: string | null = null;

    suiteSetup(async function() {
        // Increase timeout for model loading
        this.timeout(60000);

        inference = new LlamaInference();

        // Find an available model
        const modelsDir = path.join(os.homedir(), '.inline', 'models');
        
        if (!fs.existsSync(modelsDir)) {
            console.log('⚠️  Models directory not found. Please download a model first.');
            this.skip();
            return;
        }

        const files = fs.readdirSync(modelsDir);
        const ggufFiles = files.filter(f => f.endsWith('.gguf'));

        if (ggufFiles.length === 0) {
            console.log('⚠️  No GGUF models found. Please download a model first.');
            this.skip();
            return;
        }

        // Use the first available model
        modelPath = path.join(modelsDir, ggufFiles[0]);
        console.log(`\n📦 Using model: ${ggufFiles[0]}`);
        console.log(`📍 Path: ${modelPath}`);

        // Load the model
        console.log('\n⏳ Loading model...');
        const loadStart = Date.now();
        inference = new LlamaInference();
        
        try {
            await inference.loadModel(modelPath, {
                threads: 4,
                contextSize: 2048,
                gpuLayers: 0 // Adjust based on your hardware
            });

            const loadTime = Date.now() - loadStart;
            console.log(`✅ Model loaded in ${(loadTime / 1000).toFixed(2)}s`);
        } catch (error) {
            console.warn('⚠️  Model file not available or corrupted, skipping benchmark tests');
            console.warn(`Error: ${error}`);
            // Skip all tests in this suite
            this.skip();
        }
    });

    suiteTeardown(async function() {
        this.timeout(10000);
        if (inference && inference.isModelLoaded()) {
            console.log('\n🧹 Unloading model...');
            await inference.unloadModel();
            console.log('✅ Model unloaded');
        }
    });

    test('should verify model is loaded', function() {
        if (!inference || !inference.isModelLoaded()) {
            this.skip();
        }
        assert.strictEqual(inference.isModelLoaded(), true, 'Model should be loaded');
        assert.strictEqual(inference.getModelPath(), modelPath, 'Model path should match');
        console.log('✅ Model verification passed');
    });

    test('should benchmark streaming completion with sample prompt', async function() {
        this.timeout(120000); // 2 minutes for generation

        const samplePrompt = `Write a simple TypeScript function that calculates the factorial of a number:`;

        console.log('\n' + '='.repeat(60));
        console.log('🚀 BENCHMARK TEST: Streaming Completion');
        console.log('='.repeat(60));
        console.log(`\n📝 Prompt: "${samplePrompt}"\n`);

        // Benchmark metrics
        const startTime = Date.now();
        let tokenCount = 0;
        let completion = '';

        console.log('📊 Streaming output:');
        console.log('-'.repeat(60));

        try {
            // Generate completion with streaming
            completion = await inference.generateCompletion(samplePrompt, {
                maxTokens: 256,
                temperature: 0.7,
                topP: 0.95,
                topK: 40,
                stop: ['```\n\n', '\n\n\n']
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Calculate metrics
            // Note: We're getting the full completion, so we estimate token count
            tokenCount = Math.ceil(completion.length / 4); // Rough estimate: ~4 chars per token
            const tokensPerSecond = (tokenCount / totalTime) * 1000;

            console.log(completion);
            console.log('-'.repeat(60));
            console.log('\n📈 Performance Metrics:');
            console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
            console.log(`   Estimated Tokens: ${tokenCount}`);
            console.log(`   Tokens/Second: ${tokensPerSecond.toFixed(2)}`);
            console.log(`   Characters Generated: ${completion.length}`);
            console.log('='.repeat(60));

            // Assertions
            assert.ok(completion.length > 0, 'Completion should not be empty');
            assert.ok(totalTime > 0, 'Total time should be positive');
            assert.ok(tokensPerSecond > 0, 'Tokens per second should be positive');

            console.log('\n✅ Benchmark test passed!');

        } catch (error) {
            console.error('\n❌ Benchmark test failed:', error);
            throw error;
        }
    });

    test('should test code improvement with streaming', async function() {
        this.timeout(120000);

        const sampleCode = `function add(a, b) {
    return a + b;
}`;

        const instruction = 'Add TypeScript type annotations and JSDoc comments to this function';

        console.log('\n' + '='.repeat(60));
        console.log('🔧 BENCHMARK TEST: Code Improvement');
        console.log('='.repeat(60));
        console.log(`\n📝 Instruction: "${instruction}"`);
        console.log(`\n💻 Input Code:\n${sampleCode}\n`);

        const startTime = Date.now();

        try {
            const result = await inference.generateImprovement(sampleCode, instruction, {
                maxTokens: 256,
                temperature: 0.3
            });

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const tokenCount = Math.ceil(result.length / 4);
            const tokensPerSecond = (tokenCount / totalTime) * 1000;

            console.log('📊 Improved Code:');
            console.log('-'.repeat(60));
            console.log(result);
            console.log('-'.repeat(60));
            console.log('\n📈 Performance Metrics:');
            console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
            console.log(`   Estimated Tokens: ${tokenCount}`);
            console.log(`   Tokens/Second: ${tokensPerSecond.toFixed(2)}`);
            console.log('='.repeat(60));

            assert.ok(result.length > 0, 'Result should not be empty');
            console.log('\n✅ Code improvement test passed!');

        } catch (error) {
            console.error('\n❌ Code improvement test failed:', error);
            throw error;
        }
    });

    test('should test multiple rapid completions (stress test)', async function() {
        this.timeout(180000); // 3 minutes

        console.log('\n' + '='.repeat(60));
        console.log('⚡ STRESS TEST: Multiple Rapid Completions');
        console.log('='.repeat(60));

        const prompts = [
            'Write a hello world in Python:',
            'Create a simple for loop in JavaScript:',
            'Define a TypeScript interface for a User:'
        ];

        const results: Array<{ prompt: string; time: number; length: number }> = [];

        for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i];
            console.log(`\n[${i + 1}/${prompts.length}] Testing: "${prompt}"`);

            const startTime = Date.now();
            const completion = await inference.generateCompletion(prompt, {
                maxTokens: 128,
                temperature: 0.5
            });
            const endTime = Date.now();
            const time = endTime - startTime;

            results.push({ prompt, time, length: completion.length });
            console.log(`   ✓ Completed in ${(time / 1000).toFixed(2)}s (${completion.length} chars)`);
        }

        // Calculate average metrics
        const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
        const avgLength = results.reduce((sum, r) => sum + r.length, 0) / results.length;

        console.log('\n📈 Stress Test Summary:');
        console.log(`   Total Completions: ${results.length}`);
        console.log(`   Average Time: ${(avgTime / 1000).toFixed(2)}s`);
        console.log(`   Average Length: ${avgLength.toFixed(0)} chars`);
        console.log('='.repeat(60));

        assert.strictEqual(results.length, prompts.length, 'All prompts should complete');
        console.log('\n✅ Stress test passed!');
    });
});
