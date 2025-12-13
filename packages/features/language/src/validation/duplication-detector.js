"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicationDetector = void 0;
const crypto = __importStar(require("crypto"));
const native_loader_1 = require("@inline/shared/platform/native/native-loader");
/**
 * Smart code deduplication detector using fingerprinting and similarity algorithms
 */
class DuplicationDetector {
    constructor(options = {}) {
        this.fingerprintCache = new Map();
        this.similarityThreshold = options.similarityThreshold ?? 0.8;
        this.minBlockSize = options.minBlockSize ?? 20;
        this.detectDistributed = options.detectDistributed ?? true;
    }
    /**
     * Detect duplicates in generated code
     */
    detectDuplicates(code, language) {
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
    calculateSimilarity(block1, block2) {
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
    generateFingerprint(code, language = 'javascript') {
        // Check cache first
        const cached = this.fingerprintCache.get(code);
        if (cached) {
            return cached;
        }
        const native = native_loader_1.NativeLoader.getInstance();
        let normalized = '';
        let md5 = '';
        let tokens = [];
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
        const fingerprint = {
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
    removeDuplicates(code, duplicateBlocks, distributedPatterns) {
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
    detectDistributedRepetition(lines, language = 'javascript') {
        const patterns = [];
        const windowSize = 10; // Check last 10 lines for patterns
        // Use fingerprints for comparison
        const lineFingerprints = lines.map(line => line.trim().length > 5 ? this.generateFingerprint(line.trim(), language).md5 : null);
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
                    }
                    else {
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
    extractBlocks(code) {
        const lines = code.split('\n');
        const blocks = [];
        let currentBlock = [];
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
            }
            else {
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
    findDuplicateBlocks(blocks, language) {
        const duplicates = [];
        const seen = new Map();
        for (const block of blocks) {
            // Skip small blocks
            if (block.content.length < this.minBlockSize) {
                continue;
            }
            const fingerprint = this.generateFingerprint(block.content, language);
            // Check for exact match
            if (seen.has(fingerprint.md5)) {
                const original = seen.get(fingerprint.md5);
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
    normalizeCode(code) {
        return code
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/#.*$/gm, '') // Remove Python comments
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .toLowerCase();
    }
    /**
     * Tokenize code into meaningful tokens
     */
    tokenize(code) {
        // Simple tokenization: split by non-alphanumeric characters
        return code
            .split(/[^a-zA-Z0-9_]+/)
            .filter(token => token.length > 0);
    }
    /**
     * Generate SimHash for near-duplicate detection
     */
    generateSimHash(text) {
        const tokens = this.tokenize(text);
        return this.generateSimHashFromTokens(tokens);
    }
    generateSimHashFromTokens(tokens) {
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
    hammingDistance(hash1, hash2) {
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
    levenshteinSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLen = Math.max(str1.length, str2.length);
        return maxLen === 0 ? 1.0 : 1 - (distance / maxLen);
    }
    /**
     * Calculate Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        for (let i = 0; i <= m; i++)
            dp[i][0] = i;
        for (let j = 0; j <= n; j++)
            dp[0][j] = j;
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
                else {
                    dp[i][j] = Math.min(dp[i - 1][j] + 1, // deletion
                    dp[i][j - 1] + 1, // insertion
                    dp[i - 1][j - 1] + 1 // substitution
                    );
                }
            }
        }
        return dp[m][n];
    }
    /**
     * Calculate Jaccard similarity
     */
    jaccardSimilarity(str1, str2) {
        const tokens1 = new Set(this.tokenize(str1));
        const tokens2 = new Set(this.tokenize(str2));
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    /**
     * Calculate Cosine similarity
     */
    cosineSimilarity(str1, str2) {
        const tokens1 = this.tokenize(str1);
        const tokens2 = this.tokenize(str2);
        // Create frequency vectors
        const allTokens = new Set([...tokens1, ...tokens2]);
        const vector1 = [];
        const vector2 = [];
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
    removeDistributedPattern(code, pattern) {
        const lines = code.split('\n');
        // Remove the repeated pattern occurrences (keep first occurrence)
        const patternLength = pattern.pattern.length;
        const linesToRemove = new Set();
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
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i])
                return false;
        }
        return true;
    }
    /**
     * Clear fingerprint cache
     */
    clearCache() {
        this.fingerprintCache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.fingerprintCache.size,
            maxSize: 1000
        };
    }
}
exports.DuplicationDetector = DuplicationDetector;
//# sourceMappingURL=duplication-detector.js.map