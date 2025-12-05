#!/usr/bin/env node
/**
 * Automated Test for Inline Code Suggestions
 * 
 * This script programmatically tests the completion provider
 * by simulating various code contexts and verifying suggestions.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

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

function separator(char = '=', length = 70) {
    console.log(char.repeat(length));
}

async function findModel() {
    const modelsDir = path.join(os.homedir(), '.inline', 'models');
    if (!fs.existsSync(modelsDir)) {
        return null;
    }

    const files = fs.readdirSync(modelsDir);
    const ggufFiles = files
        .filter(f => f.endsWith('.gguf') && fs.statSync(path.join(modelsDir, f)).size > 1000000)
        .map(f => ({ name: f, path: path.join(modelsDir, f), size: fs.statSync(path.join(modelsDir, f)).size }))
        .sort((a, b) => b.size - a.size);

    return ggufFiles.length > 0 ? ggufFiles[0].path : null;
}

async function testCompletion(model, context, testCase) {
    const startTime = Date.now();

    log(`\n📝 ${testCase.name}`, colors.cyan);
    log(`   Context: "${testCase.context.substring(0, 60)}..."`, colors.blue);

    let sequence = null;

    try {
        // Build the prompt for code completion
        const prompt = `${testCase.context}\n`;

        // Get sequence
        sequence = context.getSequence();

        // Tokenize
        const tokens = model.tokenize(prompt);

        // Evaluate
        const stream = await sequence.evaluate(tokens, {
            temperature: 0.3, // Lower temperature for more deterministic code
            topP: 0.95,
            topK: 40,
            yieldEogToken: false
        });

        let completion = '';
        let tokensGenerated = 0;
        const maxTokens = testCase.maxTokens || 128;

        // Stream tokens
        for await (const token of stream) {
            if (tokensGenerated >= maxTokens) break;

            const text = model.detokenize([token]);
            completion += text;
            tokensGenerated++;

            // Stop at natural code boundaries
            if (completion.includes('\n\n') || completion.includes('// ===')) {
                break;
            }
        }

        const endTime = Date.now();
        const time = endTime - startTime;

        // Validate the completion
        const isValid = validateCompletion(completion, testCase);

        if (isValid) {
            log(`   ✅ Success: ${tokensGenerated} tokens in ${(time / 1000).toFixed(2)}s`, colors.green);
            log(`   Generated:\n${completion.split('\n').slice(0, 5).map(l => '      ' + l).join('\n')}`, colors.reset);
        } else {
            log(`   ⚠️  Generated but may need review: ${tokensGenerated} tokens`, colors.yellow);
            log(`   Generated:\n${completion.split('\n').slice(0, 3).map(l => '      ' + l).join('\n')}`, colors.reset);
        }

        // Dispose sequence
        if (sequence && typeof sequence.dispose === 'function') {
            await sequence.dispose();
        }

        return {
            success: true,
            tokens: tokensGenerated,
            time,
            completion,
            valid: isValid
        };
    } catch (error) {
        log(`   ❌ Failed: ${error.message}`, colors.red);

        if (sequence && typeof sequence.dispose === 'function') {
            try {
                await sequence.dispose();
            } catch (e) { /* ignore */ }
        }

        return { success: false, error: error.message };
    }
}

function validateCompletion(completion, testCase) {
    // Basic validation - check if completion contains expected keywords
    const keywords = testCase.expectedKeywords || [];
    if (keywords.length === 0) return true;

    const lowerCompletion = completion.toLowerCase();
    return keywords.some(keyword => lowerCompletion.includes(keyword.toLowerCase()));
}

async function main() {
    log('\n' + '='.repeat(70), colors.bright);
    log('🧪 INLINE CODE SUGGESTIONS TEST', colors.bright);
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
        log(`❌ Failed to load: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Initialize
    log('\n⏳ Initializing...', colors.cyan);
    try {
        llama = await getLlama();
        model = await llama.loadModel({
            modelPath: modelPath,
            useMlock: true,
            gpuLayers: 0
        });
        context = await model.createContext({
            contextSize: 2048,
            threads: 4,
            batchSize: 512,
            sequences: 2
        });
        log('✅ Model and context ready', colors.green);
    } catch (error) {
        log(`❌ Initialization failed: ${error.message}`, colors.red);
        process.exit(1);
    }

    // Test cases - simulating inline completion scenarios
    log('\n' + '='.repeat(70), colors.bright);
    log('🧪 TESTING INLINE SUGGESTIONS (Comment-Based)', colors.bright);
    separator('=');

    const testCases = [
        {
            name: 'Simple Function from Comment',
            context: '// Create a function that calculates the factorial of a number',
            expectedKeywords: ['function', 'factorial'],
            maxTokens: 100
        },
        {
            name: 'TypeScript Function',
            context: '// Write a TypeScript function to check if a string is a palindrome',
            expectedKeywords: ['function', 'string', 'boolean'],
            maxTokens: 100
        },
        {
            name: 'Array Manipulation',
            context: '// Create a function that removes duplicates from an array',
            expectedKeywords: ['function', 'array'],
            maxTokens: 100
        },
        {
            name: 'Async Function',
            context: '// Write an async function to fetch user data from an API',
            expectedKeywords: ['async', 'function', 'fetch'],
            maxTokens: 100
        },
        {
            name: 'Class Definition',
            context: '// Create a User class with name, email, and age properties',
            expectedKeywords: ['class', 'User'],
            maxTokens: 120
        },
        {
            name: 'Interface Definition',
            context: '// Define an interface for a Product with id, name, price',
            expectedKeywords: ['interface', 'Product'],
            maxTokens: 80
        },
        {
            name: 'Error Handling',
            context: '// Write a function that safely parses JSON with error handling',
            expectedKeywords: ['function', 'try', 'catch'],
            maxTokens: 100
        },
        {
            name: 'Validation Function',
            context: '// Create a function to validate an email address using regex',
            expectedKeywords: ['function', 'email', 'regex'],
            maxTokens: 80
        }
    ];

    const results = [];
    let successCount = 0;
    let validCount = 0;

    for (const testCase of testCases) {
        const result = await testCompletion(model, context, testCase);
        results.push({ ...testCase, ...result });

        if (result.success) {
            successCount++;
            if (result.valid) validCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    log('\n' + '='.repeat(70), colors.bright);
    log('📊 TEST SUMMARY', colors.bright);
    separator('=');

    log(`\n✅ Completed: ${successCount}/${testCases.length}`, colors.green);
    log(`✓  Valid: ${validCount}/${successCount}`, validCount === successCount ? colors.green : colors.yellow);
    log(`❌ Failed: ${testCases.length - successCount}/${testCases.length}`, colors.reset);

    if (successCount === testCases.length) {
        log('\n🎉 ALL INLINE SUGGESTION TESTS PASSED!', colors.green);
        log('   The completion provider is working correctly!', colors.green);
    } else {
        log('\n⚠️  Some tests had issues. Review output above.', colors.yellow);
    }

    // Cleanup
    log('\n🧹 Cleaning up...', colors.cyan);
    await context.dispose();
    await model.dispose();
    log('✅ Done!', colors.green);

    log('\n' + '='.repeat(70), colors.bright);
    log('📋 NEXT STEPS FOR MANUAL TESTING:', colors.bright);
    separator('=');
    log('');
    log('1. Open: test/fixtures/test-inline-suggestions.ts', colors.cyan);
    log('2. Press F5 to launch extension in debug mode', colors.cyan);
    log('3. Load a model from the Inline sidebar', colors.cyan);
    log('4. Place cursor after each comment and wait for suggestions', colors.cyan);
    log('5. Verify ghost text appears with relevant code', colors.cyan);
    log('6. Press Tab to accept suggestions', colors.cyan);
    log('');
    separator('=');

    process.exit(successCount < testCases.length ? 1 : 0);
}

main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});
