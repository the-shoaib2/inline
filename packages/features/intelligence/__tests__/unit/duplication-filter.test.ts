import { describe, it, expect, beforeEach } from 'vitest';
import { DuplicationFilter } from '../../src/processing/pipeline/duplication-filter';

describe('DuplicationFilter', () => {
    let filter: DuplicationFilter;

    beforeEach(() => {
        filter = new DuplicationFilter();
        filter.reset();
    });

    describe('isMetadataLoop', () => {
        it('should detect repeated file metadata', () => {
            const line = '// File: test.ts';
            filter.trackLine(line);
            expect(filter.isMetadataLoop(line)).toBe(true);
        });

        it('should not detect first occurrence', () => {
            const line = '// File: test.ts';
            expect(filter.isMetadataLoop(line)).toBe(false);
        });

        it('should detect path metadata loops', () => {
            const line = '// Path: /src/test.ts';
            filter.trackLine(line);
            expect(filter.isMetadataLoop(line)).toBe(true);
        });
    });

    describe('isExactDuplicate', () => {
        it('should detect exact duplicate lines', () => {
            const line = 'const x = 1;';
            const language = 'typescript';
            
            // First occurrence - not a duplicate
            expect(filter.isExactDuplicate(line, 0, language)).toBe(false);
            
            // Second occurrence - still allowed
            expect(filter.isExactDuplicate(line, 1, language)).toBe(false);
            
            // Third occurrence - should be detected
            expect(filter.isExactDuplicate(line, 2, language)).toBe(true);
        });

        it('should ignore short lines', () => {
            const line = 'x';
            const language = 'typescript';
            expect(filter.isExactDuplicate(line, 0, language)).toBe(false);
        });
    });

    describe('isBlockRepetition', () => {
        it('should detect repeated blocks', () => {
            const block = 'const x = 1;\nconst y = 2;\nconst z = 3;\n'.repeat(5);
            const completion = 'Padded content to exceed 100 characters limit for block repetition detection.\n' + block + '\n' + block;
            expect(filter.isBlockRepetition(completion)).toBe(true);
        });

        it('should not detect unique blocks', () => {
            const completion = 'const x = 1;\nconst y = 2;\nconst z = 3;';
            expect(filter.isBlockRepetition(completion)).toBe(false);
        });
    });

    describe('isWordRepetition', () => {
        it('should detect word repetition', () => {
            const padding = 'Some random context to ensure the string is long enough for the check.';
            const completion = padding + 'prefixprefixprefixprefixprefix';
            expect(filter.isWordRepetition(completion)).toBe(true);
        });

        it('should detect FIM keyword loops', () => {
            const padding = 'Some random context to ensure the string is long enough for the check.';
            const completion = padding + 'prefix|prefix|prefix|prefix|prefix|prefix';
            expect(filter.isWordRepetition(completion)).toBe(true);
        });

        it('should detect character repetition', () => {
            const padding = 'Some random context to ensure the string is long enough for the check.';
            const completion = padding + '>>>>>>>>>>>>>>>>>>>>>>>>';
            expect(filter.isWordRepetition(completion)).toBe(true);
        });

        it('should not detect normal code', () => {
            const completion = 'const x = 1; const y = 2;';
            expect(filter.isWordRepetition(completion)).toBe(false);
        });
    });

    describe('reset', () => {
        it('should clear internal state', () => {
            filter.trackLine('line1');
            filter.trackLine('line2');
            filter.reset();
            
            // After reset, metadata should not be detected as loop
            const line = '// File: test.ts';
            expect(filter.isMetadataLoop(line)).toBe(false);
        });
    });
});
