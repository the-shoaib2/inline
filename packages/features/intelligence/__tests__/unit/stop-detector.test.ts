import { describe, it, expect, beforeEach } from 'vitest';
import { StopDetector } from '../../src/processing/pipeline/stop-detector';

describe('StopDetector', () => {
    let detector: StopDetector;

    beforeEach(() => {
        const stopSequences = ['</code>', '```', 'END'];
        detector = new StopDetector(stopSequences, 10, 5);
        detector.reset();
    });

    describe('reset', () => {
        it('should reset token and line counters', () => {
            detector.trackToken('line1\n');
            detector.trackToken('line2\n');
            detector.reset();
            
            const stats = detector.getStats();
            expect(stats.tokens).toBe(0);
            expect(stats.lines).toBe(0);
        });
    });

    describe('trackToken', () => {
        it('should increment token counter', () => {
            detector.trackToken('token');
            expect(detector.getStats().tokens).toBe(1);
        });

        it('should count newlines in token', () => {
            detector.trackToken('line1\nline2\nline3\n');
            expect(detector.getStats().lines).toBe(3);
        });

        it('should handle tokens without newlines', () => {
            detector.trackToken('token');
            expect(detector.getStats().lines).toBe(0);
        });

        it('should accumulate multiple tokens', () => {
            detector.trackToken('token1\n');
            detector.trackToken('token2\n');
            detector.trackToken('token3');
            
            const stats = detector.getStats();
            expect(stats.tokens).toBe(3);
            expect(stats.lines).toBe(2);
        });
    });

    describe('isMaxTokensReached', () => {
        it('should return false when under limit', () => {
            detector.trackToken('token1');
            detector.trackToken('token2');
            expect(detector.isMaxTokensReached()).toBe(false);
        });

        it('should return true when at limit', () => {
            for (let i = 0; i < 10; i++) {
                detector.trackToken('token');
            }
            expect(detector.isMaxTokensReached()).toBe(true);
        });

        it('should return true when over limit', () => {
            for (let i = 0; i < 15; i++) {
                detector.trackToken('token');
            }
            expect(detector.isMaxTokensReached()).toBe(true);
        });
    });

    describe('isMaxLinesReached', () => {
        it('should return false when under limit', () => {
            detector.trackToken('line1\n');
            detector.trackToken('line2\n');
            expect(detector.isMaxLinesReached()).toBe(false);
        });

        it('should return true when at limit', () => {
            detector.trackToken('1\n2\n3\n4\n5\n');
            expect(detector.isMaxLinesReached()).toBe(true);
        });

        it('should return true when over limit', () => {
            detector.trackToken('1\n2\n3\n4\n5\n6\n7\n');
            expect(detector.isMaxLinesReached()).toBe(true);
        });
    });

    describe('hasStopSequence', () => {
        it('should detect stop sequence at end', () => {
            const completion = 'function test() {\n    return true;\n}</code>';
            expect(detector.hasStopSequence(completion)).toBe(true);
        });

        it('should detect stop sequence in middle', () => {
            const completion = 'function test() ```\n    return true;\n}';
            expect(detector.hasStopSequence(completion)).toBe(true);
        });

        it('should detect custom stop sequence', () => {
            const completion = 'function test() {\n    return true;\nEND';
            expect(detector.hasStopSequence(completion)).toBe(true);
        });

        it('should return false when no stop sequence found', () => {
            const completion = 'function test() {\n    return true;\n}';
            expect(detector.hasStopSequence(completion)).toBe(false);
        });

        it('should handle empty completion', () => {
            expect(detector.hasStopSequence('')).toBe(false);
        });
    });

    describe('isMetadataRepeating', () => {
        it('should detect metadata repetition', () => {
            const completion = 'File: a.ts\nFile: b.ts\nFile: c.ts\nFile: d.ts';
            expect(detector.isMetadataRepeating(completion)).toBe(true);
        });

        it('should not detect normal file references', () => {
            const completion = 'File: test.ts\nconst x = 1;';
            expect(detector.isMetadataRepeating(completion)).toBe(false);
        });

        it('should not detect two file references', () => {
            const completion = 'File: a.ts\nFile: b.ts';
            expect(detector.isMetadataRepeating(completion)).toBe(false);
        });

        it('should handle completion without File keyword', () => {
            const completion = 'const x = 1;\nconst y = 2;';
            expect(detector.isMetadataRepeating(completion)).toBe(false);
        });
    });

    describe('shouldStop', () => {
        it('should stop when max tokens reached', () => {
            for (let i = 0; i < 10; i++) {
                detector.trackToken('token');
            }
            expect(detector.shouldStop('completion')).toBe(true);
        });

        it('should stop when max lines reached', () => {
            detector.trackToken('1\n2\n3\n4\n5\n');
            expect(detector.shouldStop('completion')).toBe(true);
        });

        it('should stop when stop sequence found', () => {
            expect(detector.shouldStop('code here</code>')).toBe(true);
        });

        it('should stop when metadata repeating', () => {
            const completion = 'File: a.ts\nFile: b.ts\nFile: c.ts\nFile: d.ts';
            expect(detector.shouldStop(completion)).toBe(true);
        });

        it('should not stop for normal completion', () => {
            detector.trackToken('token1\n');
            detector.trackToken('token2\n');
            expect(detector.shouldStop('const x = 1;')).toBe(false);
        });

        it('should stop on any condition being true', () => {
            // Set up to be just under token limit
            for (let i = 0; i < 9; i++) {
                detector.trackToken('token');
            }
            
            // Should stop due to stop sequence even though tokens not at limit
            expect(detector.shouldStop('code```')).toBe(true);
        });
    });

    describe('getStats', () => {
        it('should return initial stats', () => {
            const stats = detector.getStats();
            expect(stats.tokens).toBe(0);
            expect(stats.lines).toBe(0);
        });

        it('should return current stats', () => {
            detector.trackToken('line1\n');
            detector.trackToken('line2\n');
            detector.trackToken('line3');
            
            const stats = detector.getStats();
            expect(stats.tokens).toBe(3);
            expect(stats.lines).toBe(2);
        });

        it('should not modify internal state', () => {
            detector.trackToken('token\n');
            const stats1 = detector.getStats();
            const stats2 = detector.getStats();
            
            expect(stats1).toEqual(stats2);
        });
    });
});
