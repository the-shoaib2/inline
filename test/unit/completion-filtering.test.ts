
import * as assert from 'assert';
import { InlineCompletionProvider } from '../../src/core/providers/completion-provider';

describe('Completion Filtering Unit Tests', () => {
    let provider: InlineCompletionProvider;

    beforeEach(() => {
        // Mock dependencies are not needed for cleanCompletion as it is a pure function
        // We cast to any to bypass constructor checks if we were running strictly, 
        // but since we are just testing a specific method, we can try to access it via prototype
        // or just instantiate with nulls if TS complains.
        // Ideally we would mock them properly but for this specific test speed is key.
        provider = new InlineCompletionProvider(null as any, null as any, null as any, null as any, null as any);
    });

    it('Should remove markdown code blocks', () => {
        const input = '```typescript\nconst x = 1;\n```';
        const expected = 'const x = 1;\n'; // Note: replace leaves the newline if inside
        // Actually looking at regex: replace(/^```[\w]*\n?/, '') handles the start
        // replace(/\n?```$/, '') handles the end.
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = 1;');
    });

    it('Should remove single letter tags like <B> <A>', () => {
        const input = '<B> <A> const x = 1; <C>';
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = 1;');
    });

    it('Should remove FIM tags like <PRE> <SUF>', () => {
        const input = '<PRE>const x = 1;<SUF>';
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = 1;');
    });

    it('Should preserve valid code that looks like tags but isn\'t (lowercase)', () => {
        const input = 'const x = <div>Hello</div>;';
        // My regex was <[A-Z]{1,5}>. Lowercase div should be safe.
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = <div>Hello</div>;');
    });

    it('Should remove extensive leading newlines', () => {
        const input = '\n\n\n\nconst x = 1;';
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result, '\nconst x = 1;');
    });

    it('Should remove spaced FIM tokens and artifacts', () => {
        const input = "obj['middle']< |fim_prefix|> const x = 1; < |fim_suffix|>";
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = 1;');
    });

    it('Should remove duplicate consecutive lines', () => {
        const input = 'const x = 1;\nconst x = 1;\nconst x = 1;';
        const result = provider.cleanCompletion(input);
        assert.strictEqual(result.trim(), 'const x = 1;');
    });

    it('Should remove repeated header blocks', () => {
        const input = '# header\n\ndef foo(): pass\n\n# header';
        const result = provider.cleanCompletion(input);
        // Should have removed the second block completely
        assert.ok(!result.endsWith('# header'), 'Second header should be removed');
        assert.ok(result.startsWith('# header'), 'First header should remain');
    });
});
