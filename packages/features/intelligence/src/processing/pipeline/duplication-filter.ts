import { Logger } from '@inline/shared';
import { DuplicationDetector } from '@inline/language';

/**
 * Detects and filters code duplication during generation
 */
export class DuplicationFilter {
    private logger: Logger;
    private duplicationDetector: DuplicationDetector;
    private recentLines: string[] = [];
    private lineFingerprints: Map<number, string> = new Map();
    private readonly maxRepeatWindow: number = 20;

    constructor() {
        this.logger = new Logger('DuplicationFilter');
        this.duplicationDetector = new DuplicationDetector({
            similarityThreshold: 0.85,
            minBlockSize: 20,
            detectDistributed: true
        });
    }

    /**
     * Reset internal state for new generation
     */
    reset(): void {
        this.recentLines = [];
        this.lineFingerprints.clear();
    }

    /**
     * Check if metadata is being repeated
     */
    isMetadataLoop(line: string): boolean {
        if (line.startsWith('// File:') || line.startsWith('# File:') ||
            line.startsWith('// Path:') || line.startsWith('# Path:')) {
            if (this.recentLines.includes(line)) {
                this.logger.warn(`Metadata loop detected: "${line}"`);
                return true;
            }
        }
        return false;
    }

    /**
     * Check for exact duplicate lines
     */
    isExactDuplicate(line: string, lineNumber: number, language: string): boolean {
        if (line.length <= 5) {
            return false;
        }

        const fingerprint = this.duplicationDetector.generateFingerprint(line, language);
        this.lineFingerprints.set(lineNumber, fingerprint.md5);

        // Check for exact matches in recent window
        const exactMatches = Array.from(this.lineFingerprints.entries())
            .filter(([num, fp]) => num < lineNumber && fp === fingerprint.md5)
            .length;

        // Allow 1 repeat (legitimate duplicate), block 3rd occurrence
        if (exactMatches >= 2) {
            this.logger.warn(`Exact duplicate loop detected (3rd occurrence): "${line}"`);
            return true;
        }

        return false;
    }

    /**
     * Check for near-duplicate lines
     */
    isNearDuplicate(line: string, allLines: string[]): boolean {
        if (line.length <= 5) {
            return false;
        }

        const currentLineNumber = allLines.length - 1;

        for (const [lineNum, fp] of this.lineFingerprints.entries()) {
            if (lineNum >= currentLineNumber) continue;

            const prevLine = allLines[lineNum]?.trim();
            if (prevLine && prevLine.length > 5) {
                const similarity = this.duplicationDetector.calculateSimilarity(line, prevLine);

                // If similarity > 90%, it's likely a near-duplicate loop
                if (similarity > 0.9) {
                    const exactMatches = Array.from(this.lineFingerprints.values())
                        .filter(f => f === fp).length;
                    
                    if (exactMatches >= 1) {
                        this.logger.warn(`Near-duplicate loop detected (similarity: ${(similarity * 100).toFixed(1)}%): "${line}"`);
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Check for distributed repetition patterns (A-B-A-B)
     */
    isDistributedPattern(language: string): boolean {
        if (this.recentLines.length >= 6 && this.recentLines.length % 4 === 0) {
            const patterns = this.duplicationDetector.detectDistributedRepetition(this.recentLines, language);

            if (patterns.length > 0) {
                const pattern = patterns[0];
                this.logger.warn(`Distributed repetition pattern detected: ${pattern.pattern.length}-line pattern repeated ${pattern.occurrences} times`);
                return true;
            }
        }

        return false;
    }

    /**
     * Check for block-level repetition
     */
    isBlockRepetition(completion: string): boolean {
        if (completion.length > 100) {
            const lastBlock = completion.slice(-50);
            const beforeBlock = completion.slice(-150, -50);

            if (beforeBlock.includes(lastBlock)) {
                this.logger.warn('Block repetition detected');
                return true;
            }
        }

        return false;
    }

    /**
     * Check for word-level repetition
     */
    isWordRepetition(completion: string): boolean {
        if (completion.length > 50) {
            const last50 = completion.slice(-50);

            // Check for immediate word repetition (e.g., "prefixprefix")
            const wordRepeatPattern = /(\w{4,})\1{4,}/;
            if (wordRepeatPattern.test(last50)) {
                const match = last50.match(wordRepeatPattern);
                this.logger.warn(`Word repetition detected: "${match?.[0]?.substring(0, 30)}..."`);
                return true;
            }

            // Check for FIM keyword loops
            const fimKeywordLoop = /(prefix|suffix|middle|fim)(\||>|<|\s){0,2}\1/gi;
            const fimMatches = last50.match(fimKeywordLoop);
            if (fimMatches && fimMatches.length >= 3) {
                this.logger.warn(`FIM keyword loop detected: ${fimMatches.length} repetitions`);
                return true;
            }

            // Check for character-level loops
            const charRepeatPattern = /(.)\1{14,}/;
            if (charRepeatPattern.test(last50)) {
                const match = last50.match(charRepeatPattern);
                this.logger.warn(`Character repetition loop detected: "${match?.[0]?.substring(0, 20)}..."`);
                return true;
            }
        }

        return false;
    }

    /**
     * Track a new line for duplication detection
     */
    trackLine(line: string): void {
        this.recentLines.push(line);
        if (this.recentLines.length > this.maxRepeatWindow) {
            this.recentLines.shift();
        }
    }

    /**
     * Check all duplication patterns
     */
    checkDuplication(completion: string, newLine: string, language: string): boolean {
        const allLines = completion.split('\n');
        const currentLineNumber = allLines.length - 1;

        // Skip empty lines
        if (newLine.trim().length === 0) {
            return false;
        }

        // Check metadata loops
        if (this.isMetadataLoop(newLine)) {
            return true;
        }

        // Check exact duplicates
        if (this.isExactDuplicate(newLine, currentLineNumber, language)) {
            return true;
        }

        // Check near-duplicates
        if (this.isNearDuplicate(newLine, allLines)) {
            return true;
        }

        // Track line for pattern detection
        this.trackLine(newLine);

        // Check distributed patterns
        if (this.isDistributedPattern(language)) {
            return true;
        }

        // Check block repetition
        if (this.isBlockRepetition(completion)) {
            return true;
        }

        // Check word repetition
        if (this.isWordRepetition(completion)) {
            return true;
        }

        return false;
    }
}
