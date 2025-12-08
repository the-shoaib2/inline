import * as assert from 'assert';
import { LlamaInference } from '@intelligence/engines/llama-engine';

describe('FIM Token Filtering', () => {
    describe('FIM_TOKEN_REGEX', () => {
        const testCases = [
            // Standard angle bracket formats
            { input: '<|fim_prefix|>', expected: '', description: 'Standard fim_prefix' },
            { input: '<|fim_suffix|>', expected: '', description: 'Standard fim_suffix' },
            { input: '<|fim_middle|>', expected: '', description: 'Standard fim_middle' },
            { input: '<fim_prefix>', expected: '', description: 'fim_prefix without pipes' },
            { input: '< fim_prefix >', expected: '', description: 'fim_prefix with spaces' },
            
            // CodeLlama style
            { input: '<PRE>', expected: '', description: 'CodeLlama PRE' },
            { input: '<SUF>', expected: '', description: 'CodeLlama SUF' },
            { input: '<MID>', expected: '', description: 'CodeLlama MID' },
            { input: '<END>', expected: '', description: 'CodeLlama END' },
            
            // Mistral/Codestral style
            { input: '[PREFIX]', expected: '', description: 'Mistral PREFIX' },
            { input: '[SUFFIX]', expected: '', description: 'Mistral SUFFIX' },
            { input: '[MIDDLE]', expected: '', description: 'Mistral MIDDLE' },
            
            // CRITICAL: Curly brace pipe format (the reported issue)
            { input: '{|}', expected: '', description: 'Curly brace pipe' },
            { input: '{|fim_prefix|}', expected: '', description: 'Curly brace fim_prefix' },
            { input: '{|fim_suffix|}', expected: '', description: 'Curly brace fim_suffix' },
            { input: '{|fim_middle|}', expected: '', description: 'Curly brace fim_middle' },
            { input: '{ | }', expected: '', description: 'Curly brace pipe with spaces' },
            
            // Standalone keywords with pipes (the reported issue)
            { input: 'prefix|', expected: '', description: 'Standalone prefix|' },
            { input: 'suffix|', expected: '', description: 'Standalone suffix|' },
            { input: 'middle|', expected: '', description: 'Standalone middle|' },
            { input: '|prefix', expected: '', description: 'Standalone |prefix' },
            { input: '|suffix', expected: '', description: 'Standalone |suffix' },
            { input: '|middle', expected: '', description: 'Standalone |middle' },
            
            // Mixed with code (real-world scenario)
            { 
                input: '// give me c input in array and linier serching algothms{|}middle|prefix//', 
                expected: '// give me c input in array and linier serching algothms//', 
                description: 'User reported case' 
            },
            { 
                input: '{|}<{|}middle|//{|}middle|<{|}middle|</{|}middle|<{|}middle|<{|}middle|<', 
                expected: '<</<<', 
                description: 'Multiple FIM tokens' 
            },
            
            // In code context
            { input: 'function test() {|} return 42; }', expected: 'function test() return 42; }', description: 'FIM in function' },
            { input: 'const x = prefix|suffix', expected: 'const x = ', description: 'FIM in variable' },
            
            // Should NOT remove valid code
            { input: 'const prefix = "test";', expected: 'const prefix = "test";', description: 'Valid variable named prefix' },
            { input: 'function middle() {}', expected: 'function middle() {}', description: 'Valid function named middle' },
            { input: 'const obj = { key: "value" };', expected: 'const obj = { key: "value" };', description: 'Valid object' },
        ];

        testCases.forEach(({ input, expected, description }) => {
            it(`should filter: ${description}`, () => {
                const result = input.replace(LlamaInference.FIM_TOKEN_REGEX, '');
                assert.strictEqual(result, expected, `Failed for: ${description}`);
            });
        });
    });

    describe('Real-world completion cleaning', () => {
        it('should clean completion with FIM tokens', () => {
            const dirtyCompletion = `
// C program for linear search
{|}
#include <stdio.h>
middle|
int linearSearch(int arr[], int n, int x) {
    prefix|
    for (int i = 0; i < n; i++) {
        if (arr[i] == x)
            return i;
    }
    return -1;
}
`;
            
            const cleaned = dirtyCompletion.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            
            // Should not contain any FIM tokens
            assert.ok(!cleaned.includes('{|}'), 'Should not contain {|}');
            assert.ok(!cleaned.includes('middle|'), 'Should not contain middle|');
            assert.ok(!cleaned.includes('prefix|'), 'Should not contain prefix|');
            
            // Should contain valid code
            assert.ok(cleaned.includes('#include <stdio.h>'), 'Should contain #include');
            assert.ok(cleaned.includes('int linearSearch'), 'Should contain function name');
            assert.ok(cleaned.includes('for (int i = 0; i < n; i++)'), 'Should contain for loop');
        });

        it('should handle the exact user-reported case', () => {
            const userInput = '// give me c input in array and linier serching algothms{|}middle|prefix//';
            const cleaned = userInput.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            
            assert.strictEqual(cleaned, '// give me c input in array and linier serching algothms//');
            assert.ok(!cleaned.includes('{|}'));
            assert.ok(!cleaned.includes('middle|'));
            assert.ok(!cleaned.includes('prefix'));
        });

        it('should handle cascading FIM tokens', () => {
            const cascading = '{|}<{|}middle|//{|}middle|<{|}middle|</{|}middle|<{|}middle|<{|}middle|<';
            const cleaned = cascading.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            
            assert.strictEqual(cleaned, '<</<<');
            assert.ok(!cleaned.includes('{|}'));
            assert.ok(!cleaned.includes('middle|'));
        });
    });

    describe('Edge cases', () => {
        it('should not remove valid code that looks similar to FIM tokens', () => {
            const validCode = `
const prefix = "my-prefix";
const suffix = "my-suffix";
const middle = calculateMiddle();
const obj = { key: "value" };
`;
            const cleaned = validCode.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            
            // Should preserve variable names when not followed by pipe
            assert.ok(cleaned.includes('const prefix = "my-prefix"'));
            assert.ok(cleaned.includes('const suffix = "my-suffix"'));
            assert.ok(cleaned.includes('const middle = calculateMiddle()'));
            assert.ok(cleaned.includes('const obj = { key: "value" }'));
        });

        it('should handle empty string', () => {
            const result = ''.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            assert.strictEqual(result, '');
        });

        it('should handle string with no FIM tokens', () => {
            const code = 'function test() { return 42; }';
            const result = code.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            assert.strictEqual(result, code);
        });
    });
});
