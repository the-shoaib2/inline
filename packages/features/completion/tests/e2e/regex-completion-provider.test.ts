
import { describe, it, expect, beforeEach } from 'vitest';
import { RegexCompletionProvider } from '../../src/providers/regex-completion-provider';

describe('Regex Completion Provider E2E - Strategy Pattern', () => {
    let provider: RegexCompletionProvider;

    beforeEach(() => {
        provider = new RegexCompletionProvider();
    });

    it('should detect TypeScript regex context', () => {
        expect(provider.isInRegexContext('const r = /', 'typescript')).toBe(true);
        expect(provider.isInRegexContext('new RegExp("', 'typescript')).toBe(true);
        expect(provider.isInRegexContext('const s = "', 'typescript')).toBe(false); // Strict check for TS
        expect(provider.isInRegexContext('const x = 1;', 'typescript')).toBe(false);
    });

    it('should detect Python regex context', () => {
        expect(provider.isInRegexContext('re.compile(r"', 'python')).toBe(true);
        expect(provider.isInRegexContext('re.match("', 'python')).toBe(true);
        expect(provider.isInRegexContext('s = "', 'python')).toBe(false); // Strict check for Python
        expect(provider.isInRegexContext('x = 1', 'python')).toBe(false);
    });

    it('should fallback to string check for unknown language', () => {
        expect(provider.isInRegexContext('r = "', 'rust')).toBe(true);
        expect(provider.isInRegexContext('r = 1', 'rust')).toBe(false);
    });
});
