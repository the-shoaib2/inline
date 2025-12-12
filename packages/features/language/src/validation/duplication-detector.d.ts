/**
 * Code fingerprint for duplicate detection
 */
export interface CodeFingerprint {
    md5: string;
    simhash: string;
    tokens: string[];
    normalized: string;
    lineCount: number;
    charCount: number;
}
/**
 * Duplicate detection report
 */
export interface DuplicateReport {
    hasDuplicates: boolean;
    duplicateBlocks: DuplicateBlock[];
    distributedPatterns: RepetitionPattern[];
    cleanedCode: string;
    originalLineCount: number;
    cleanedLineCount: number;
    duplicatesRemoved: number;
}
/**
 * Duplicate code block
 */
export interface DuplicateBlock {
    content: string;
    startLine: number;
    endLine: number;
    occurrences: number;
    similarity: number;
    type: 'exact' | 'near' | 'structural';
}
/**
 * Repetition pattern (e.g., A-B-A-B)
 */
export interface RepetitionPattern {
    pattern: string[];
    occurrences: number;
    startLine: number;
    endLine: number;
}
/**
 * Smart code deduplication detector using fingerprinting and similarity algorithms
 */
export declare class DuplicationDetector {
    private fingerprintCache;
    private similarityThreshold;
    private minBlockSize;
    private detectDistributed;
    constructor(options?: {
        similarityThreshold?: number;
        minBlockSize?: number;
        detectDistributed?: boolean;
    });
    /**
     * Detect duplicates in generated code
     */
    detectDuplicates(code: string, language: string): DuplicateReport;
    /**
     * Calculate similarity between two code blocks (0.0 to 1.0)
     */
    calculateSimilarity(block1: string, block2: string): number;
    /**
     * Generate code fingerprint for fast duplicate detection
     */
    generateFingerprint(code: string, language?: string): CodeFingerprint;
    /**
     * Remove duplicate blocks from code
     */
    removeDuplicates(code: string, duplicateBlocks: DuplicateBlock[], distributedPatterns: RepetitionPattern[]): string;
    /**
     * Detect distributed repetition patterns (A-B-A-B, A-B-C-A-B-C, etc.)
     */
    detectDistributedRepetition(lines: string[], language?: string): RepetitionPattern[];
    /**
     * Extract code blocks from text (separated by blank lines)
     */
    private extractBlocks;
    /**
     * Find duplicate blocks using fingerprinting
     */
    private findDuplicateBlocks;
    /**
     * Normalize code for comparison (remove whitespace, comments)
     */
    private normalizeCode;
    /**
     * Tokenize code into meaningful tokens
     */
    private tokenize;
    /**
     * Generate SimHash for near-duplicate detection
     */
    private generateSimHash;
    private generateSimHashFromTokens;
    /**
     * Calculate Hamming distance similarity (for SimHash comparison)
     */
    private hammingDistance;
    /**
     * Calculate Levenshtein distance similarity
     */
    private levenshteinSimilarity;
    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance;
    /**
     * Calculate Jaccard similarity
     */
    private jaccardSimilarity;
    /**
     * Calculate Cosine similarity
     */
    private cosineSimilarity;
    /**
     * Remove distributed pattern from code
     */
    private removeDistributedPattern;
    /**
     * Check if two arrays are equal
     */
    private arraysEqual;
    /**
     * Clear fingerprint cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
}
//# sourceMappingURL=duplication-detector.d.ts.map