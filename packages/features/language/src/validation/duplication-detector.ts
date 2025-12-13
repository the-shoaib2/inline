import * as crypto from 'crypto';
import { NativeLoader } from '@inline/shared/platform/native/native-loader';

/**
 * Code fingerprint for duplicate detection
 */
export interface CodeFingerprint {
    md5: string;           // Exact match hash
    simhash: string;       // Near-duplicate hash
    tokens: string[];      // Tokenized code
    normalized: string;    // Normalized code (no whitespace/comments)
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
    pattern: string[];     // Pattern sequence (e.g., ['A', 'B'])
    occurrences: number;
    startLine: number;
    endLine: number;
}

/**
 * Smart code deduplication detector using fingerprinting and similarity algorithms
 */
export class DuplicationDetector {
    private fingerprintCache: Map<string, CodeFingerprint> = new Map();
    private similarityThreshold: number;
    private minBlockSize: number;
    private detectDistributed: boolean;

    constructor(options: {
        similarityThreshold?: number;
        minBlockSize?: number;
        detectDistributed?: boolean;
    } = {}) {
        this.similarityThreshold = options.similarityThreshold ?? 0.8;
        this.minBlockSize = options.minBlockSize ?? 20;
        this.detectDistributed = options.detectDistributed ?? true;
    }

    /**
     * Detect duplicates in generated code
     */
    public detectDuplicates(code: string, language: string): DuplicateReport {
        const lines = code.split('\n');
        const originalLineCount = lines.length;

        // Step 1: Extract blocks (paragraphs separated by blank lines)
        const blocks = this.extractBlocks(code);

        // Step 2: Detect exact and near duplicates
        const duplicateBlocks = this.findDuplicateBlocks(blocks, language);

        // Step 3: Detect distributed repetition patterns (A-B-A-B)
        const distributedPatterns = this.detectDistributed 
            ? this.detectDistributedRepetition(lines, language)
            : [];

        // Step 4: Remove duplicates
        const cleanedCode = this.removeDuplicates(code, duplicateBlocks, distributedPatterns);
        const cleanedLineCount = cleanedCode.split('\n').length;

        return {
            hasDuplicates: duplicateBlocks.length > 0 || distributedPatterns.length > 0,
            duplicateBlocks,
            distributedPatterns,
            cleanedCode,
            originalLineCount,
            cleanedLineCount,
            duplicatesRemoved: duplicateBlocks.length + distributedPatterns.length
        };
    }

    /**
     * Calculate similarity between two code blocks (0.0 to 1.0)
     */
    public calculateSimilarity(block1: string, block2: string): number {
        // Use multiple metrics and average them
        const levenshtein = this.levenshteinSimilarity(block1, block2);
        const jaccard = this.jaccardSimilarity(block1, block2);
        const cosine = this.cosineSimilarity(block1, block2);

        // Weighted average (Levenshtein is most reliable for code)
        return (levenshtein * 0.5) + (jaccard * 0.3) + (cosine * 0.2);
    }

    /**
     * Generate code fingerprint for fast duplicate detection
     */
    public generateFingerprint(code: string, language: string = 'javascript'): CodeFingerprint {
        // Check cache first
        const cached = this.fingerprintCache.get(code);
        if (cached) {
            return cached;
        }

        const native = NativeLoader.getInstance();
        let normalized = '';
        let md5 = '';
        let tokens: string[] = [];

        // if (native.isAvailable()) {
        //     // Native Optimization
        //     try {
        //         const noComments = native.removeComments(code, language);
        //         normalized = native.normalizeWhitespace(noComments).toLowerCase();
        //         md5 = native.hashPrompt(normalized);
        //         const tokenResult = native.tokenizeCode(code, language);
        //         tokens = tokenResult.texts;
        //     } catch (e) {
        //         // Fallback handled below/mixed
        //         normalized = this.normalizeCode(code);
        //         md5 = crypto.createHash('md5').update(normalized).digest('hex');
        //         tokens = this.tokenize(code);
        //     }
        // } else {
            // Fallback
            normalized = this.normalizeCode(code);
            md5 = crypto.createHash('md5').update(normalized).digest('hex');
            tokens = this.tokenize(code);
        // }

        // Generate SimHash for near-duplicate detection
        // We reuse the native/JS tokens here
        const simhash = this.generateSimHashFromTokens(tokens);

        const fingerprint: CodeFingerprint = {
            md5,
            simhash,
            tokens,
            normalized,
            lineCount: code.split('\n').length,
            charCount: code.length
        };

        // Cache it (limit cache size)
        if (this.fingerprintCache.size > 1000) {
            const firstKey = this.fingerprintCache.keys().next().value;
            if (firstKey !== undefined) {
                this.fingerprintCache.delete(firstKey);
            }
        }
        this.fingerprintCache.set(code, fingerprint);

        return fingerprint;
    }

    /**
     * Remove duplicate blocks from code
     */
    public removeDuplicates(
        code: string, 
        duplicateBlocks: DuplicateBlock[], 
        distributedPatterns: RepetitionPattern[]
    ): string {
        let result = code;

        // Sort by line number (descending) to avoid index shifting
        const sortedBlocks = [...duplicateBlocks].sort((a, b) => b.startLine - a.startLine);

        // Remove duplicate blocks
        for (const block of sortedBlocks) {
            const lines = result.split('\n');
            // Keep first occurrence, remove subsequent ones
            if (block.occurrences > 1) {
                lines.splice(block.startLine, block.endLine - block.startLine + 1);
                result = lines.join('\n');
            }
        }

        // Remove distributed patterns
        for (const pattern of distributedPatterns) {
            result = this.removeDistributedPattern(result, pattern);
        }

        return result;
    }

    /**
     * Detect distributed repetition patterns (A-B-A-B, A-B-C-A-B-C, etc.)
     */
    public detectDistributedRepetition(lines: string[], language: string = 'javascript'): RepetitionPattern[] {
        const patterns: RepetitionPattern[] = [];
        const windowSize = 10; // Check last 10 lines for patterns

        // Use fingerprints for comparison
        const lineFingerprints = lines.map(line => 
            line.trim().length > 5 ? this.generateFingerprint(line.trim(), language).md5 : null
        );

        // Sliding window to detect patterns
        for (let i = 0; i < lines.length - windowSize; i++) {
            const window = lineFingerprints.slice(i, i + windowSize);
            
            // Try to find repeating patterns of length 2, 3, 4
            for (let patternLen = 2; patternLen <= 4; patternLen++) {
                const pattern = window.slice(0, patternLen);
                
                // Check if pattern repeats
                let repetitions = 1;
                for (let j = patternLen; j < window.length; j += patternLen) {
                    const nextSegment = window.slice(j, j + patternLen);
                    if (this.arraysEqual(pattern, nextSegment)) {
                        repetitions++;
                    } else {
                        break;
                    }
                }

                // If pattern repeats 3+ times, it's a distributed repetition
                if (repetitions >= 3) {
                    patterns.push({
                        pattern: pattern.map(fp => fp || '').filter(Boolean),
                        occurrences: repetitions,
                        startLine: i,
                        endLine: i + (patternLen * repetitions) - 1
                    });
                    break; // Found pattern in this window, move on
                }
            }
        }

        return patterns;
    }

    /**
     * Extract code blocks from text (separated by blank lines)
     */
    private extractBlocks(code: string): Array<{ content: string; startLine: number; endLine: number }> {
        const lines = code.split('\n');
        const blocks: Array<{ content: string; startLine: number; endLine: number }> = [];
        let currentBlock: string[] = [];
        let blockStartLine = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.trim().length === 0) {
                // Blank line - end current block
                if (currentBlock.length > 0) {
                    blocks.push({
                        content: currentBlock.join('\n'),
                        startLine: blockStartLine,
                        endLine: i - 1
                    });
                    currentBlock = [];
                }
            } else {
                // Non-blank line - add to current block
                if (currentBlock.length === 0) {
                    blockStartLine = i;
                }
                currentBlock.push(line);
            }
        }

        // Add final block
        if (currentBlock.length > 0) {
            blocks.push({
                content: currentBlock.join('\n'),
                startLine: blockStartLine,
                endLine: lines.length - 1
            });
        }

        return blocks;
    }

    /**
     * Find duplicate blocks using fingerprinting
     */
    private findDuplicateBlocks(
        blocks: Array<{ content: string; startLine: number; endLine: number }>,
        language: string
    ): DuplicateBlock[] {
        const duplicates: DuplicateBlock[] = [];
        const seen = new Map<string, { content: string; startLine: number; endLine: number }>();

        for (const block of blocks) {
            // Skip small blocks
            if (block.content.length < this.minBlockSize) {
                continue;
            }

            const fingerprint = this.generateFingerprint(block.content, language);

            // Check for exact match
            if (seen.has(fingerprint.md5)) {
                const original = seen.get(fingerprint.md5)!;
                duplicates.push({
                    content: block.content,
                    startLine: block.startLine,
                    endLine: block.endLine,
                    occurrences: 2, // At least 2 (original + this)
                    similarity: 1.0,
                    type: 'exact'
                });
                continue;
            }

            // Check for near-duplicates using SimHash
            let foundNearDuplicate = false;
            for (const [hash, original] of seen.entries()) {
                const originalFingerprint = this.generateFingerprint(original.content, language);
                const similarity = this.hammingDistance(fingerprint.simhash, originalFingerprint.simhash);
                
                if (similarity >= this.similarityThreshold) {
                    duplicates.push({
                        content: block.content,
                        startLine: block.startLine,
                        endLine: block.endLine,
                        occurrences: 2,
                        similarity,
                        type: 'near'
                    });
                    foundNearDuplicate = true;
                    break;
                }
            }

            if (!foundNearDuplicate) {
                seen.set(fingerprint.md5, block);
            }
        }

        return duplicates;
    }

    /**
     * Normalize code for comparison (remove whitespace, comments)
     */
    private normalizeCode(code: string): string {
        return code
            .replace(/\/\/.*$/gm, '')           // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove multi-line comments
            .replace(/#.*$/gm, '')              // Remove Python comments
            .replace(/\s+/g, ' ')               // Normalize whitespace
            .trim()
            .toLowerCase();
    }

    /**
     * Tokenize code into meaningful tokens
     */
    private tokenize(code: string): string[] {
        // Simple tokenization: split by non-alphanumeric characters
        return code
            .split(/[^a-zA-Z0-9_]+/)
            .filter(token => token.length > 0);
    }

    /**
     * Generate SimHash for near-duplicate detection
     */
    private generateSimHash(text: string): string {
        const tokens = this.tokenize(text);
        return this.generateSimHashFromTokens(tokens);
    }

    private generateSimHashFromTokens(tokens: string[]): string {
        const hashSize = 64;
        const vector = new Array(hashSize).fill(0);

        // Hash each token and update vector
        for (const token of tokens) {
            const hash = crypto.createHash('md5').update(token).digest('hex');
            const binary = BigInt('0x' + hash).toString(2).padStart(hashSize, '0');
            
            for (let i = 0; i < hashSize; i++) {
                vector[i] += binary[i] === '1' ? 1 : -1;
            }
        }

        // Convert vector to binary string
        return vector.map(v => v > 0 ? '1' : '0').join('');
    }

    /**
     * Calculate Hamming distance similarity (for SimHash comparison)
     */
    private hammingDistance(hash1: string, hash2: string): number {
        let distance = 0;
        const len = Math.min(hash1.length, hash2.length);
        
        for (let i = 0; i < len; i++) {
            if (hash1[i] !== hash2[i]) {
                distance++;
            }
        }

        // Convert to similarity (0.0 to 1.0)
        return 1 - (distance / len);
    }

    /**
     * Calculate Levenshtein distance similarity
     */
    private levenshteinSimilarity(str1: string, str2: string): number {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLen = Math.max(str1.length, str2.length);
        return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
    }

    /**
     * Calculate Levenshtein distance
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const m = str1.length;
        const n = str2.length;
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,      // deletion
                        dp[i][j - 1] + 1,      // insertion
                        dp[i - 1][j - 1] + 1   // substitution
                    );
                }
            }
        }

        return dp[m][n];
    }

    /**
     * Calculate Jaccard similarity
     */
    private jaccardSimilarity(str1: string, str2: string): number {
        const tokens1 = new Set(this.tokenize(str1));
        const tokens2 = new Set(this.tokenize(str2));

        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Calculate Cosine similarity
     */
    private cosineSimilarity(str1: string, str2: string): number {
        const tokens1 = this.tokenize(str1);
        const tokens2 = this.tokenize(str2);

        // Create frequency vectors
        const allTokens = new Set([...tokens1, ...tokens2]);
        const vector1: number[] = [];
        const vector2: number[] = [];

        for (const token of allTokens) {
            vector1.push(tokens1.filter(t => t === token).length);
            vector2.push(tokens2.filter(t => t === token).length);
        }

        // Calculate dot product and magnitudes
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        return (magnitude1 === 0 || magnitude2 === 0) 
            ? 0 
            : dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Remove distributed pattern from code
     */
    private removeDistributedPattern(code: string, pattern: RepetitionPattern): string {
        const lines = code.split('\n');
        
        // Remove the repeated pattern occurrences (keep first occurrence)
        const patternLength = pattern.pattern.length;
        const linesToRemove = new Set<number>();

        // Mark lines for removal (keep first pattern, remove rest)
        for (let i = 1; i < pattern.occurrences; i++) {
            const startIdx = pattern.startLine + (i * patternLength);
            for (let j = 0; j < patternLength; j++) {
                linesToRemove.add(startIdx + j);
            }
        }

        // Filter out marked lines
        return lines
            .filter((_, idx) => !linesToRemove.has(idx))
            .join('\n');
    }

    /**
     * Check if two arrays are equal
     */
    private arraysEqual(arr1: any[], arr2: any[]): boolean {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    /**
     * Clear fingerprint cache
     */
    public clearCache(): void {
        this.fingerprintCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.fingerprintCache.size,
            maxSize: 1000
        };
    }
}
