#!/usr/bin/env node
/**
 * End-to-End Test for All AI Features
 * 
 * This script tests all AI commands to ensure they work without "No sequences left" errors.
 * Run with: node scripts/test-ai-features.js
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// ANSI color codes
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
        return null;
    }

    const files = fs.readdirSync(modelsDir);
    const ggufFiles = files
        .filter(f => {
            if (!f.endsWith('.gguf')) return false;
            const filePath = path.join(modelsDir, f);
            const stats = fs.statSync(filePath);
            return stats.size > 1000000;
        })
        .map(f => {
            const filePath = path.join(modelsDir, f);
            const stats = fs.statSync(filePath);
            return { name: f, path: filePath, size: stats.size };
        })
        .sort((a, b) => b.size - a.size);

    if (ggufFiles.length === 0) {
        log('⚠️  No valid GGUF models found', colors.yellow);
        return null;
    }

    return ggufFiles[0].path;
}

async function testSequence(model, context, testName, prompt, maxTokens = 128) {
    const startTime = Date.now();

    log(`\n📝 Test: ${testName}`, colors.cyan);
    log(`   Prompt: "${prompt.substring(0, 60)}..."`, colors.blue);

    let sequence = null;

    try {
        // Get a fresh sequence for each test
        sequence = context.getSequence();

        // Tokenize
        const tokens = model.tokenize(prompt);

        // Evaluate
        const stream = await sequence.evaluate(tokens, {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            yieldEogToken: false
        });

        let completion = '';
        let tokensGenerated = 0;

        for await (const token of stream) {
            if (tokensGenerated >= maxTokens) break;
            const text = model.detokenize([token]);
            completion += text;
            tokensGenerated++;
        }

        const endTime = Date.now();
        const time = endTime - startTime;

        log(`   ✅ Success: ${tokensGenerated} tokens in ${(time / 1000).toFixed(2)}s`, colors.green);
        log(`   Output: ${completion.substring(0, 100)}...`, colors.reset);

        // Dispose sequence to free it back to the pool
        if (sequence && typeof sequence.dispose === 'function') {
            await sequence.dispose();
        }

        return { success: true, tokens: tokensGenerated, time };
    } catch (error) {
        log(`   ❌ Failed: ${error.message}`, colors.red);

        // Try to dispose sequence on error
        if (sequence && typeof sequence.dispose === 'function') {
            try {
                await sequence.dispose();
            } catch (disposeError) {
                // Ignore disposal errors
            }
        }

        return { success: false, error: error.message };
    }
}

async function main() {
    log('\n' + '='.repeat(60), colors.bright);
    log('🧪 END-TO-END AI FEATURES TEST', colors.bright);
    separator('=');

    // Find model
    log('\n📦 Finding model...', colors.cyan);
    const modelPath = await findModel();

    if (!modelPath) {
        log('❌ No model found. Please download a model first.', colors.red);
        process.exit(1);
    }

    log(`✅ Found model: ${path.basename(modelPath)}`, colors.green);

    // Load node-llama-cpp
    log('\n⏳ Loading node-llama-cpp...', colors.cyan);
    let getLlama, llama, model, context;

    try {
        const dynamicImport = new Function('specifier', 'return import(specifier)');
        const llamaModule = await dynamicImport('node-llama-cpp');
        getLlama = llamaModule.getLlama;
        log('✅ node-llama-cpp loaded', colors.green);
    } catch (error) {
        log(`❌ Failed to load node-llama-cpp: ${error.message}`, colors.red);
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
    try {
        model = await llama.loadModel({
            modelPath: modelPath,
            useMlock: true,
            gpuLayers: 0
        });
        log('✅ Model loaded', colors.green);
    } catch (error) {
        log(`❌ Failed to load model: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Create context with multiple sequences
    log('\n⏳ Creating context with 2 sequences...', colors.cyan);
    try {
        context = await model.createContext({
            contextSize: 2048,
            threads: 4,
            batchSize: 512,
            sequences: 2 // IMPORTANT: Allocate 2 sequences
        });
        log('✅ Context created with 2 sequences', colors.green);
    } catch (error) {
        log(`❌ Failed to create context: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Test scenarios simulating different AI commands
    log('\n' + '='.repeat(60), colors.bright);
    log('🧪 TESTING AI FEATURES (Multiple Sequential Calls)', colors.bright);
    separator('=');

    const tests = [
        {
            name: 'Code Completion',
            prompt: 'Write a TypeScript function to calculate factorial:'
        },
        {
            name: 'Code Fix',
            prompt: 'Fix this code: function add(a, b) { return a + b }\nAdd type annotations.'
        },
        {
            name: 'Code Optimization',
            prompt: 'Optimize this code for better performance: for(let i=0; i<arr.length; i++) { sum += arr[i]; }'
        },
        {
            name: 'Code Explanation',
            prompt: 'Explain what this code does: const result = arr.filter(x => x > 0).map(x => x * 2);'
        },
        {
            name: 'Test Generation',
            prompt: 'Generate unit tests for: function divide(a, b) { return a / b; }'
        },
        {
            name: 'Documentation',
            prompt: 'Generate JSDoc for: function fetchUser(id) { return fetch(`/api/users/${id}`); }'
        },
        {
            name: 'Refactoring',
            prompt: 'Refactor this to use async/await: getUserData().then(data => processData(data)).catch(err => handleError(err));'
        },
        {
            name: 'Security Scan',
            prompt: 'Find security issues in: eval(userInput); document.write(userData);'
        },
        {
            name: 'Terminal Command',
            prompt: 'Suggest a git command to: commit all changes with message "fix: update API"'
        },
        {
            name: 'PR Description',
            prompt: 'Generate PR description for: Added user authentication with JWT tokens'
        }
    ];

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        const result = await testSequence(model, context, test.name, test.prompt, 64);
        results.push({ ...test, ...result });

        if (result.success) {
            successCount++;
        } else {
            failCount++;
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    log('\n' + '='.repeat(60), colors.bright);
    log('📊 TEST SUMMARY', colors.bright);
    separator('=');

    log(`\n✅ Successful: ${successCount}/${tests.length}`, colors.green);
    log(`❌ Failed: ${failCount}/${tests.length}`, failCount > 0 ? colors.red : colors.green);

    if (successCount === tests.length) {
        log('\n🎉 ALL TESTS PASSED! No "No sequences left" errors!', colors.green);
    } else {
        log('\n⚠️  Some tests failed. Check the output above.', colors.yellow);
    }

    // Cleanup
    log('\n🧹 Cleaning up...', colors.cyan);
    await context.dispose();
    await model.dispose();
    log('✅ Resources cleaned up', colors.green);

    log('\n' + '='.repeat(60), colors.bright);
    log('✅ END-TO-END TEST COMPLETED', colors.bright);
    separator('=');
    log('');

    process.exit(failCount > 0 ? 1 : 0);
}

// Run the test
main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
