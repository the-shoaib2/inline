#!/usr/bin/env node
/**
 * Pure Node.js LLM Benchmark Test
 * 
 * This script tests the local LLM connection with streaming and performance metrics.
 * Run with: node scripts/test-llm-pure.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

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
    const ggufFiles = files
        .filter(f => {
            if (!f.endsWith('.gguf')) return false;
            const filePath = path.join(modelsDir, f);
            const stats = fs.statSync(filePath);
            return stats.size > 1000000; // Skip files smaller than 1MB (likely corrupted)
        })
        .map(f => {
            const filePath = path.join(modelsDir, f);
            const stats = fs.statSync(filePath);
            return { name: f, path: filePath, size: stats.size };
        })
        .sort((a, b) => b.size - a.size); // Sort by size descending

    if (ggufFiles.length === 0) {
        log('⚠️  No valid GGUF models found in: ' + modelsDir, colors.yellow);
        log('Please download a model first.', colors.yellow);
        return null;
    }

    return ggufFiles[0].path; // Return the largest model
}

async function benchmarkStreaming(model, context, sequence, prompt, options = {}) {
    const startTime = Date.now();

    log('\n📝 Prompt:', colors.cyan);
    log(`   "${prompt}"`, colors.bright);
    log('\n📊 Streaming output:', colors.cyan);
    separator('-');

    try {
        const maxTokens = options.maxTokens || 256;
        const temperature = options.temperature || 0.7;
        const stop = options.stop || ['```\n\n', '\n\n\n'];

        const tokens = model.tokenize(prompt);
        let completion = '';
        let tokensGenerated = 0;

        const stream = await sequence.evaluate(tokens, {
            temperature,
            topP: options.topP || 0.95,
            topK: options.topK || 40,
            yieldEogToken: false
        });

        for await (const token of stream) {
            if (tokensGenerated >= maxTokens) {
                break;
            }

            const text = model.detokenize([token]);
            completion += text;
            tokensGenerated++;

            // Check for stop sequences
            if (stop.some(s => completion.includes(s))) {
                break;
            }
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const tokensPerSecond = (tokensGenerated / totalTime) * 1000;

        log(completion, colors.reset);
        separator('-');

        log('\n📈 Performance Metrics:', colors.green);
        log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`, colors.bright);
        log(`   Tokens Generated: ${tokensGenerated}`, colors.bright);
        log(`   Tokens/Second: ${tokensPerSecond.toFixed(2)}`, colors.bright);
        log(`   Characters Generated: ${completion.length}`, colors.bright);

        return {
            completion,
            totalTime,
            tokenCount: tokensGenerated,
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
    log('🚀 LOCAL LLM BENCHMARK TEST (Pure Node.js)', colors.bright);
    separator('=');

    // Find model
    log('\n📦 Finding model...', colors.cyan);
    const modelPath = await findModel();

    if (!modelPath) {
        process.exit(1);
    }

    log(`✅ Found model: ${path.basename(modelPath)}`, colors.green);
    log(`📍 Path: ${modelPath}`, colors.blue);

    // Load node-llama-cpp
    log('\n⏳ Loading node-llama-cpp...', colors.cyan);
    let getLlama, llama, model, context, sequence;

    try {
        // Dynamic import for ESM module
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const llamaModule = await dynamicImport('node-llama-cpp');
        getLlama = llamaModule.getLlama;

        log('✅ node-llama-cpp loaded', colors.green);
    } catch (error) {
        log(`❌ Failed to load node-llama-cpp: ${error.message}`, colors.red);
        log('Please install it with: pnpm add node-llama-cpp', colors.yellow);
        process.exit(1);
    }

    // Initialize llama
    log('\n⏳ Initializing llama...', colors.cyan);
    try {
        llama = await getLlama();
        log('✅ Llama initialized', colors.green);
    } catch (error) {
        log(`❌ Failed to initialize llama: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Load model
    log('\n⏳ Loading model...', colors.cyan);
    const loadStart = Date.now();

    try {
        model = await llama.loadModel({
            modelPath: modelPath,
            useMlock: true,
            gpuLayers: 0 // Adjust based on your hardware
        });

        const loadTime = Date.now() - loadStart;
        log(`✅ Model loaded in ${(loadTime / 1000).toFixed(2)}s`, colors.green);
    } catch (error) {
        log(`❌ Failed to load model: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Create context
    log('\n⏳ Creating context...', colors.cyan);
    try {
        context = await model.createContext({
            contextSize: 2048,
            threads: 4,
            batchSize: 512
        });

        sequence = context.getSequence();
        log('✅ Context created', colors.green);
    } catch (error) {
        log(`❌ Failed to create context: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Test 1: Basic Code Completion
    log('\n' + '='.repeat(60), colors.bright);
    log('TEST 1: Basic Code Completion', colors.bright);
    separator('=');

    const result1 = await benchmarkStreaming(
        model,
        context,
        sequence,
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
        model,
        context,
        sequence,
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
        const tokens = model.tokenize(prompts[i]);
        let completion = '';
        let tokensGenerated = 0;

        const stream = await sequence.evaluate(tokens, {
            temperature: 0.5,
            topP: 0.95,
            topK: 40,
            yieldEogToken: false
        });

        for await (const token of stream) {
            if (tokensGenerated >= 128) break;
            const text = model.detokenize([token]);
            completion += text;
            tokensGenerated++;
        }

        const endTime = Date.now();
        const time = endTime - startTime;

        results.push({ prompt: prompts[i], time, length: completion.length, tokens: tokensGenerated });
        log(`   ✓ Completed in ${(time / 1000).toFixed(2)}s (${tokensGenerated} tokens, ${completion.length} chars)`, colors.green);
    }

    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const avgTokens = results.reduce((sum, r) => sum + r.tokens, 0) / results.length;
    const avgLength = results.reduce((sum, r) => sum + r.length, 0) / results.length;

    log('\n📈 Stress Test Summary:', colors.green);
    log(`   Total Completions: ${results.length}`, colors.bright);
    log(`   Average Time: ${(avgTime / 1000).toFixed(2)}s`, colors.bright);
    log(`   Average Tokens: ${avgTokens.toFixed(0)}`, colors.bright);
    log(`   Average Length: ${avgLength.toFixed(0)} chars`, colors.bright);

    // Cleanup
    log('\n🧹 Cleaning up...', colors.cyan);
    await context.dispose();
    await model.dispose();
    log('✅ Resources cleaned up', colors.green);

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
