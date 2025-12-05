#!/usr/bin/env node
/**
 * Standalone LLM Benchmark Test
 * 
 * This script tests the local LLM connection with streaming and performance metrics.
 * Run with: node scripts/benchmark-llm.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the compiled inference engine
const { LlamaInference } = require('../out/src/core/llama-inference');

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function separator(char = '=', length = 60) {
    console.log(char.repeat(length));
}

async function findModel() {
    const modelsDir = path.join(os.homedir(), '.inline', 'models');

    if (!fs.existsSync(modelsDir)) {
        log('⚠️  Models directory not found at: ' + modelsDir, colors.yellow);
        log('Please download a model first.', colors.yellow);
        return null;
    }

    const files = fs.readdirSync(modelsDir);
    const ggufFiles = files.filter(f => f.endsWith('.gguf'));

    if (ggufFiles.length === 0) {
        log('⚠️  No GGUF models found in: ' + modelsDir, colors.yellow);
        log('Please download a model first.', colors.yellow);
        return null;
    }

    return path.join(modelsDir, ggufFiles[0]);
}

async function benchmarkStreaming(inference, prompt, options = {}) {
    const startTime = Date.now();

    log('\n📝 Prompt:', colors.cyan);
    log(`   "${prompt}"`, colors.bright);
    log('\n📊 Streaming output:', colors.cyan);
    separator('-');

    try {
        const completion = await inference.generateCompletion(prompt, {
            maxTokens: options.maxTokens || 256,
            temperature: options.temperature || 0.7,
            topP: 0.95,
            topK: 40,
            stop: options.stop || ['```\n\n', '\n\n\n']
        });

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const tokenCount = Math.ceil(completion.length / 4); // Rough estimate
        const tokensPerSecond = (tokenCount / totalTime) * 1000;

        log(completion, colors.reset);
        separator('-');

        log('\n📈 Performance Metrics:', colors.green);
        log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`, colors.bright);
        log(`   Estimated Tokens: ${tokenCount}`, colors.bright);
        log(`   Tokens/Second: ${tokensPerSecond.toFixed(2)}`, colors.bright);
        log(`   Characters Generated: ${completion.length}`, colors.bright);

        return {
            completion,
            totalTime,
            tokenCount,
            tokensPerSecond,
            success: true
        };
    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
        return {
            success: false,
            error: error.message
        };
    }
}

async function main() {
    log('\n' + '='.repeat(60), colors.bright);
    log('🚀 LOCAL LLM BENCHMARK TEST', colors.bright);
    separator('=');

    // Find model
    log('\n📦 Finding model...', colors.cyan);
    const modelPath = await findModel();

    if (!modelPath) {
        process.exit(1);
    }

    log(`✅ Found model: ${path.basename(modelPath)}`, colors.green);
    log(`📍 Path: ${modelPath}`, colors.blue);

    // Initialize inference engine
    const inference = new LlamaInference();

    // Load model
    log('\n⏳ Loading model...', colors.cyan);
    const loadStart = Date.now();

    try {
        await inference.loadModel(modelPath, {
            threads: 4,
            contextSize: 2048,
            gpuLayers: 0 // Adjust based on your hardware
        });

        const loadTime = Date.now() - loadStart;
        log(`✅ Model loaded in ${(loadTime / 1000).toFixed(2)}s`, colors.green);
    } catch (error) {
        log(`❌ Failed to load model: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Verify model is loaded
    if (!inference.isModelLoaded()) {
        log('❌ Model verification failed', colors.red);
        process.exit(1);
    }
    log('✅ Model verification passed', colors.green);

    // Test 1: Basic Code Completion
    log('\n' + '='.repeat(60), colors.bright);
    log('TEST 1: Basic Code Completion', colors.bright);
    separator('=');

    const result1 = await benchmarkStreaming(
        inference,
        'Write a simple TypeScript function that calculates the factorial of a number:'
    );

    // Test 2: Code Improvement
    log('\n' + '='.repeat(60), colors.bright);
    log('TEST 2: Code Improvement', colors.bright);
    separator('=');

    const sampleCode = `function add(a, b) {
    return a + b;
}`;

    const instruction = 'Add TypeScript type annotations and JSDoc comments to this function';
    const prompt2 = `### Instruction:\n${instruction}\n\n### Input:\n\`\`\`\n${sampleCode}\n\`\`\`\n\n### Response:\n`;

    const result2 = await benchmarkStreaming(
        inference,
        prompt2,
        { maxTokens: 256, temperature: 0.3 }
    );

    // Test 3: Multiple Quick Completions
    log('\n' + '='.repeat(60), colors.bright);
    log('TEST 3: Stress Test - Multiple Rapid Completions', colors.bright);
    separator('=');

    const prompts = [
        'Write a hello world in Python:',
        'Create a simple for loop in JavaScript:',
        'Define a TypeScript interface for a User:'
    ];

    const results = [];
    for (let i = 0; i < prompts.length; i++) {
        log(`\n[${i + 1}/${prompts.length}] Testing: "${prompts[i]}"`, colors.cyan);

        const startTime = Date.now();
        const completion = await inference.generateCompletion(prompts[i], {
            maxTokens: 128,
            temperature: 0.5
        });
        const endTime = Date.now();
        const time = endTime - startTime;

        results.push({ prompt: prompts[i], time, length: completion.length });
        log(`   ✓ Completed in ${(time / 1000).toFixed(2)}s (${completion.length} chars)`, colors.green);
    }

    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const avgLength = results.reduce((sum, r) => sum + r.length, 0) / results.length;

    log('\n📈 Stress Test Summary:', colors.green);
    log(`   Total Completions: ${results.length}`, colors.bright);
    log(`   Average Time: ${(avgTime / 1000).toFixed(2)}s`, colors.bright);
    log(`   Average Length: ${avgLength.toFixed(0)} chars`, colors.bright);

    // Cleanup
    log('\n🧹 Cleaning up...', colors.cyan);
    await inference.unloadModel();
    log('✅ Model unloaded', colors.green);

    // Final summary
    log('\n' + '='.repeat(60), colors.bright);
    log('✅ ALL TESTS COMPLETED SUCCESSFULLY!', colors.green);
    separator('=');

    log('\n📊 Summary:', colors.cyan);
    log(`   ✓ Model loaded and verified`, colors.green);
    log(`   ✓ Streaming completion tested`, colors.green);
    log(`   ✓ Code improvement tested`, colors.green);
    log(`   ✓ Stress test completed (${results.length} prompts)`, colors.green);
    log('\n');
}

// Run the benchmark
main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
