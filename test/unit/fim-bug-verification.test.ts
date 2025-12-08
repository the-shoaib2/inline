import * as assert from 'assert';
import { LlamaInference } from '../../src/inference/llama-inference';

describe('FIM Token Fix Verification', () => {
    it('should remove {|fim|} tokens (the actual bug)', () => {
        const input = '{|fim|}>>>>>> {|fim|}>>>>>{|fim|}>>>>>{|fim|}>>>>>{|fim|}>>>>>';
        const cleaned = input.replace(LlamaInference.FIM_TOKEN_REGEX, '');
        
        assert.strictEqual(cleaned, '>>>>>> >>>>>>>>>>>>>>>>>>>>');
        assert.ok(!cleaned.includes('{|fim|}'), 'Should not contain {|fim|}');
    });

    it('should handle the exact user case', () => {
        const input = '// give me c input in array and linier serching algothms\n{|fim|}>>>>>> {|fim|}>>>>>{|fim|}>>>>>{|fim|}>>>>>{|fim|}>>>>>';
        const cleaned = input.replace(LlamaInference.FIM_TOKEN_REGEX, '');
        
        assert.ok(cleaned.includes('// give me c input in array and linier serching algothms'));
        assert.ok(!cleaned.includes('{|fim|}'));
        assert.ok(cleaned.includes('>>>>>>'));
    });

    it('should remove all curly brace FIM variants', () => {
        const variants = [
            '{|}',
            '{|fim|}',
            '{|fim_prefix|}',
            '{|fim_suffix|}',
            '{|fim_middle|}',
            '{|fim_end|}',
            '{|fim_begin|}',
            '{|fim_hole|}'
        ];

        variants.forEach(variant => {
            const cleaned = variant.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            assert.strictEqual(cleaned, '', `Failed to remove: ${variant}`);
        });
    });

    it('should handle catch-all pattern for unknown FIM tokens', () => {
        const unknownTokens = [
            '{|unknown|}',
            '{|custom_token|}',
            '{|whatever|}',
            '{|123|}'
        ];

        unknownTokens.forEach(token => {
            const cleaned = token.replace(LlamaInference.FIM_TOKEN_REGEX, '');
            assert.strictEqual(cleaned, '', `Failed to remove: ${token}`);
        });
    });

    it('should preserve valid code with curly braces', () => {
        const validCode = `
function test() {
    const obj = { key: "value" };
    return obj;
}`;
        const cleaned = validCode.replace(LlamaInference.FIM_TOKEN_REGEX, '');
        
        assert.ok(cleaned.includes('function test()'));
        assert.ok(cleaned.includes('const obj = { key: "value" }'));
        assert.ok(cleaned.includes('return obj'));
    });
});
