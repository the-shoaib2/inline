import * as path from 'path';
import * as fs from 'fs';
import type { LlamaModel, LlamaContext } from 'node-llama-cpp';
import { Logger } from '@platform/system/logger';
import { GPUDetector } from '@intelligence/optimization/gpu-detector';
import { DuplicationDetector } from '@language/validation/duplication-detector';
import { ASTParser } from '@language/parsers/ast-parser';
import * as vscode from 'vscode';
import * as os from 'os';

/**
 * Configuration options for model inference.
 * Controls generation behavior, sampling, and output constraints.
 */
export interface InferenceOptions {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    stop?: string[];
    streaming?: boolean;
    repeatPenalty?: number;
    maxLines?: number;
}

/**
 * Callback for streaming token generation.
 * Invoked for each token produced during inference.
 */
export type TokenCallback = (token: string, totalTokens: number) => void;

/**
 * Llama.cpp inference engine for code completion.
 *
 * Responsibilities:
 * - Load and manage GGUF models
 * - Execute inference with GPU acceleration (Metal/CUDA)
 * - Maintain KV cache for efficient multi-turn inference
 * - Filter FIM (Fill-In-The-Middle) tokens from output
 * - Detect and remove code duplication
 * - Support streaming token generation
 */
export class LlamaInference {
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private activeSequence: any = null;
    private logger: Logger;
    private gpuDetector: GPUDetector;
    private duplicationDetector: DuplicationDetector;
    private astParser: ASTParser;
    private isLoaded: boolean = false;
    private currentModelPath: string | null = null;
    private prefixCache: Map<string, any> = new Map();
    private maxPrefixCacheSize: number = 100;
    private _generating: boolean = false;

    // Constants
    private static readonly DEFAULT_MAX_TOKENS = 512;
    private static readonly DEFAULT_TEMPERATURE = 0.7;
    private static readonly DEFAULT_TOP_P = 0.95;
    private static readonly DEFAULT_TOP_K = 40;
    private static readonly DEFAULT_REPEAT_PENALTY = 1.2;
    private static readonly DEFAULT_CONTEXT_SIZE = 16384;

    constructor() {
        this.logger = new Logger('LlamaInference');
        this.gpuDetector = new GPUDetector();
        this.duplicationDetector = new DuplicationDetector({
            similarityThreshold: 0.85,
            minBlockSize: 20,
            detectDistributed: true
        });
        this.astParser = new ASTParser();
    }

    /**
     * Comprehensive FIM token pattern matching.
     * Handles multiple FIM formats across different model families:
     * - Standard angle brackets: <|fim_prefix|>
     * - CodeLlama style: <PRE>, <SUF>, <MID>
     * - Mistral/Codestral: [PREFIX], [SUFFIX], [MIDDLE]
     * - DeepSeek/Qwen: {|fim_prefix|}
     * Optimized as single regex for performance.
     */
    public static readonly FIM_TOKEN_REGEX = new RegExp([
        // Standard angle bracket formats with optional spaces
        '\\u003c\\s*\\|?\\s*fim_prefix\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*fim_suffix\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*fim_middle\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*fim_end\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*fim_begin\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*fim_hole\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*file_separator\\s*\\|?\\s*\\u003e',
        '\\u003c\\s*\\|?\\s*endoftext\\s*\\|?\\s*\\u003e',

        // CodeLlama style
        '\\u003c\\s*PRE\\s*\\u003e',
        '\\u003c\\s*SUF\\s*\\u003e',
        '\\u003c\\s*MID\\s*\\u003e',
        '\\u003c\\s*END\\s*\\u003e',
        '\\u003c\\s*EOT\\s*\\u003e',

        // Mistral/Codestral style
        '\\[\\s*PREFIX\\s*\\]',
        '\\[\\s*SUFFIX\\s*\\]',
        '\\[\\s*MIDDLE\\s*\\]',

        // CRITICAL: Curly brace pipe format (DeepSeek, Qwen, etc.)
        '\\{\\s*\\|\\s*\\}\\s*',                      // {|} + optional space
        // '\\{\\s*\\|\\s*fim\\s*\\|\\s*\\}',            // REMOVED: potentially buggy/greedy
        '\\{\\s*\\|\\s*fim_prefix\\s*\\|\\s*\\}',     // {|fim_prefix|}
        '\\{\\s*\\|\\s*fim_suffix\\s*\\|\\s*\\}',     // {|fim_suffix|}
        '\\{\\s*\\|\\s*fim_middle\\s*\\|\\s*\\}',     // {|fim_middle|}
        '\\{\\s*\\|\\s*fim_end\\s*\\|\\s*\\}',        // {|fim_end|}
        '\\{\\s*\\|\\s*fim_begin\\s*\\|\\s*\\}',      // {|fim_begin|}
        '\\{\\s*\\|\\s*fim_hole\\s*\\|\\s*\\}',       // {|fim_hole|}

        // catch-all for any {|...|} pattern
        '\\{\\s*\\|[^}]*\\|\\s*\\}',                 // {|anything|}

        // Combined FIM keywords (e.g. prefix|suffix) which overlap on the pipe
        '\\b(?:prefix|suffix|middle)\\s*\\|\\s*(?:prefix|suffix|middle)\\b',

        // Standalone FIM keywords with pipes (simpler patterns without lookbehind/lookahead)
        '\\bprefix\\s*\\|',                          // "prefix|" or "prefix |"
        '\\bsuffix\\s*\\|',                          // "suffix|" or "suffix |"
        '\\bmiddle\\s*\\|',                          // "middle|" or "middle |"
        '\\|\\s*prefix\\b',                          // "|prefix" or "| prefix"
        '\\|\\s*suffix\\b',                          // "|suffix" or "| suffix"
        '\\|\\s*middle\\b',                          // "|middle" or "| middle"

        // Orphaned pipes (aggressive cleanup)
        '\\|\\s*\\|',                                // "||"

        // Escaped versions
        '\\\\\\u003c\\s*\\|?\\s*fim_prefix\\s*\\|?\\s*\\u003e',
        '\\\\\\u003c\\s*\\|?\\s*fim_suffix\\s*\\|?\\s*\\u003e',
        '\\\\\\u003c\\s*\\|?\\s*fim_middle\\s*\\|?\\s*\\u003e',
        '\\\\\\u003c\\s*PRE\\s*\\u003e',
        '\\\\\\u003c\\s*SUF\\s*\\u003e',
        '\\\\\\u003c\\s*MID\\s*\\u003e',

        // Partial/malformed tokens (Aggressive)
        '\\u003c\\s*\\|?\\s*fim_',
        '\\|?\\s*fim_prefix',
        '\\|?\\s*fim_suffix',
        '\\|?\\s*fim_middle',
        '\\u003c\\s*\\|[^\\u003e]*',
        '\\|\\s*\\u003e',

        // Comment-style
        '\\/\\/\\s*\\u003c\\s*\\|?\\s*fim_',
        '#\\s*\\u003c\\s*\\|?\\s*fim_',

        // Curly brace variations in comments
        '\\/\\/\\s*\\{\\s*\\|',
        '#\\s*\\{\\s*\\|'
    ].join('|'), 'gi');


    private static _llamaInstance: any = null;

    private async getLlamaInstance(): Promise<any> {
        if (!LlamaInference._llamaInstance) {
            try {
                this.logger.info('Initializing node-llama-cpp...');
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                const { getLlama } = await dynamicImport('node-llama-cpp');
                this.logger.info('node-llama-cpp imported successfully');
                LlamaInference._llamaInstance = await getLlama();
                this.logger.info('Llama instance created successfully');
            } catch (error) {
                this.logger.error('Failed to initialize node-llama-cpp:', error as Error);
                if (error instanceof Error) {
                    this.logger.error('Error details:', {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    });
                }
                throw new Error(`Failed to initialize node-llama-cpp: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return LlamaInference._llamaInstance;
    }

    public async loadModel(modelPath: string, options: {
        threads?: number;
        gpuLayers?: number;
        contextSize?: number;
    } = {}): Promise<void> {
        try {
            if (this.currentModelPath === modelPath && this.isLoaded) {
                this.logger.info('Model already loaded, skipping');
                return;
            }

            if (this.isLoaded) {
                this.logger.info('Unloading previous model...');
                await this.unloadModel();
            }

            this.logger.info(`Loading model from ${modelPath}...`);

            // Validate model file exists
            if (!fs.existsSync(modelPath)) {
                const error = `Model file not found: ${modelPath}`;
                this.logger.error(error);
                throw new Error(error);
            }

            // Validate model file is readable minimum size 1mb
            try {
                const stats = fs.statSync(modelPath);
                this.logger.info(`Model file size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
                if (stats.size < 1024 * 1024) {
                    throw new Error(`Model file too small (${stats.size} bytes), possibly corrupted`);
                }
            } catch (statError) {
                const error = `Cannot read model file: ${statError}`;
                this.logger.error(error);
                throw new Error(error);
            }

            // Auto-detect optimal GPU layers if not specified
            const gpuLayers = await this.gpuDetector.getOptimalGPULayers(options.gpuLayers);
            this.logger.info(`Using GPU layers: ${gpuLayers}`);

            // Get llama instance
            this.logger.info('Getting Llama instance...');
            const llama = await this.getLlamaInstance();
            this.logger.info('Llama instance ready');

            // Load model
            this.logger.info('Loading model into memory...');
            this.model = await llama.loadModel({
                modelPath: modelPath,
                useMlock: true,
                gpuLayers: gpuLayers,
            });
            this.logger.info('Model loaded into memory');

            // Create context
            this.logger.info('Creating inference context...');

            // Hyper-Optimization: Dynamic threads & larger batch size
            const systemThreads = Math.max(4, os.cpus().length - 2);
            const optimizedThreads = options.threads || systemThreads;

            this.context = await this.model!.createContext({
                contextSize: options.contextSize || LlamaInference.DEFAULT_CONTEXT_SIZE,
                threads: optimizedThreads,
                batchSize: 1024,
                sequences: 4,
            });
            this.logger.info('Context created successfully');

            this.activeSequence = this.context.getSequence();

            this.isLoaded = true;
            this.currentModelPath = modelPath;
            this.prefixCache.clear();
            this.logger.info(`✅ Model loaded successfully: ${modelPath}`);
        } catch (error) {
            this.logger.error('❌ Failed to load model:', error as Error);

            // Detailed error logging
            if (error instanceof Error) {
                this.logger.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }

            this.isLoaded = false;
            this.currentModelPath = null;

            // Provide helpful error message
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;

                // Check for common issues
                if (errorMessage.includes('Cannot find module')) {
                    errorMessage = 'node-llama-cpp not installed. Run: pnpm install';
                } else if (errorMessage.includes('not found')) {
                    errorMessage = `Model file not found at: ${modelPath}`;
                } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
                    errorMessage = `Permission denied reading model file: ${modelPath}`;
                } else if (errorMessage.includes('corrupted') || errorMessage.includes('invalid')) {
                    errorMessage = 'Model file appears to be corrupted. Try re-downloading.';
                }
            }

            throw new Error(errorMessage);
        }
    }

    public async unloadModel(): Promise<void> {
        if (this.context) {
            await this.context.dispose();
            this.context = null;
        }
        if (this.model) {
            await this.model.dispose();
            this.model = null;
        }
        this.activeSequence = null;
        this.isLoaded = false;
        this.currentModelPath = null;
        this.logger.info('Model unloaded');
    }

    /**
     * Generate completion with optional streaming support
     */
    async generateCompletion(
        prompt: string,
        options: InferenceOptions = {},
        onToken?: TokenCallback,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        if (!this.isLoaded || !this.model || !this.context) {
            throw new Error('Model not loaded. Please load a model first.');
        }

        // Simple mutex to prevent concurrent sequence usage
        while (this._generating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this._generating = true;

        let sequence: any = null;

        try {
            const maxTokens = options.maxTokens || LlamaInference.DEFAULT_MAX_TOKENS;
            const temperature = options.temperature || LlamaInference.DEFAULT_TEMPERATURE;
            // Phase 11: Add standard FIM stop sequences by default
            const defaultStop = [
                '<|file_separator|>', '<|fim_prefix|>', '<|fim_suffix|>', '<|fim_middle|>', '<|endoftext|>',
                '<PRE>', '<SUF>', '<MID>', '<END>', '<EOT>'
            ];
            const stop = options.stop ? [...options.stop, ...defaultStop] : defaultStop;

            // Hyper-Optimization: Trim prompt to save tokens (speedup)
            const trimmedPrompt = prompt.replace(/\n{3,}/g, '\n\n').trim();

            this.logger.info('Starting completion generation...');

            // Tokenize the prompt
            const tokens = this.model.tokenize(trimmedPrompt);
            this.logger.info(`Tokenized prompt: ${tokens.length} tokens`);
            
            // Debug hex chars at end of prompt (only in debug level)
            const promptTail = trimmedPrompt.slice(-100);
            
            // this.logger.debug(`[LlamaInference] Input Tokens: ${tokens.length}, Max Output: ${maxTokens}, Temp: ${temperature}`);

            // Ensure we have a persistent sequence
            if (!this.activeSequence) {
                 this.logger.info('Initializing new persistent sequence...');
                 this.activeSequence = this.context.getSequence();
            }
            sequence = this.activeSequence; // Reuse the same sequence object

            // Note: node-llama-cpp handles KV cache reuse automatically when using the same sequence
            // providing the prompt shares a prefix with the previous evaluation.

            // Evaluate tokens and stream the response
            this.logger.info('Starting token evaluation...');
            const stream = await sequence.evaluate(tokens, {
                temperature,
                topP: options.topP || LlamaInference.DEFAULT_TOP_P,
                topK: options.topK || LlamaInference.DEFAULT_TOP_K,
                repeatPenalty: options.repeatPenalty || LlamaInference.DEFAULT_REPEAT_PENALTY, // Phase 12: Increased default to 1.2 to prevent loops
                yieldEogToken: false
            });

            let completion = '';
            let tokensGenerated = 0;
            let newlineCount = 0;
            const maxLines = options.maxLines || 1000;

            // Enhanced Loop Detection with Smart Deduplication
            const recentLines: string[] = [];
            const maxRepeatWindow = 20; // Increased window for better pattern detection
            const lineFingerprints = new Map<number, string>(); // Track line fingerprints

            // Stream tokens and build completion
            this.logger.info('Entering token generation loop...');
            let loopIterations = 0;

            for await (const token of stream) {
                loopIterations++;
                // DEBUG: Log every token to see what is happening (debug level only)
                // const debugText = this.model.detokenize([token]);
                // this.logger.debug(`[LlamaInference] Stream token [${loopIterations}]: ${JSON.stringify(debugText)}`);

                if (loopIterations === 1) {
                    this.logger.info('First token received from stream');
                }

                // Check for cancellation
                if (cancellationToken?.isCancellationRequested) {
                    this.logger.info('Completion cancelled by user');
                    break;
                }

                if (tokensGenerated >= maxTokens) {
                    this.logger.info(`Max tokens reached: ${maxTokens}`);
                    break;
                }

                const text = this.model.detokenize([token]);

                // IMPORTANT: Do NOT filter FIM tokens here at token level!
                // They will be filtered in post-processing after generation completes.
                // Filtering individual tokens can break the generation flow.

                completion += text;
                tokensGenerated++;

                // Track newlines for early stopping and Loop Detection
                if (text.includes('\n')) {
                    newlineCount += (text.match(/\n/g) || []).length;

                    if (newlineCount > maxLines) {
                        this.logger.info(`Max lines (${maxLines}) reached, stopping generation`);
                        break;
                    }

                    // ENHANCED LOOP DETECTION
                    const allLines = completion.split('\n');

                    // Get the last complete line
                    if (allLines.length > 2) {
                        const lastCompleteLine = allLines[allLines.length - 2].trim();
                        const currentLineNumber = allLines.length - 2;

                        // Skip empty lines
                        if (lastCompleteLine.length === 0) continue;

                        // 1. STRICT METADATA CHECK (Never allow repetition)
                        if (lastCompleteLine.startsWith('// File:') || lastCompleteLine.startsWith('# File:') ||
                            lastCompleteLine.startsWith('// Path:') || lastCompleteLine.startsWith('# Path:')) {
                            if (recentLines.includes(lastCompleteLine)) {
                                this.logger.warn(`Metadata Loop detected: "${lastCompleteLine}". Stopping.`);
                                break;
                            }
                        }

                        // 2. FINGERPRINT-BASED DUPLICATE DETECTION
                        if (lastCompleteLine.length > 5) {
                            const fingerprint = this.duplicationDetector.generateFingerprint(lastCompleteLine);
                            lineFingerprints.set(currentLineNumber, fingerprint.md5);

                            // Check for exact duplicates in recent window
                            const exactMatches = Array.from(lineFingerprints.entries())
                                .filter(([lineNum, fp]) =>
                                    lineNum < currentLineNumber &&
                                    fp === fingerprint.md5
                                )
                                .length;

                            // Allow 1 repeat (legitimate duplicate), block 3rd occurrence
                            if (exactMatches >= 2) {
                                this.logger.warn(`Exact duplicate loop detected (3rd occurrence): "${lastCompleteLine}". Stopping.`);
                                break;
                            }

                            // 3. NEAR-DUPLICATE DETECTION (using similarity threshold)
                            for (const [lineNum, fp] of lineFingerprints.entries()) {
                                if (lineNum >= currentLineNumber) continue;

                                const prevLine = allLines[lineNum].trim();
                                if (prevLine.length > 5) {
                                    const similarity = this.duplicationDetector.calculateSimilarity(
                                        lastCompleteLine,
                                        prevLine
                                    );

                                    // If similarity > 90%, it's likely a near-duplicate loop
                                    if (similarity > 0.9 && exactMatches >= 1) {
                                        this.logger.warn(`Near-duplicate loop detected (similarity: ${(similarity * 100).toFixed(1)}%): "${lastCompleteLine}". Stopping.`);
                                        break;
                                    }
                                }
                            }

                            // 4. DISTRIBUTED PATTERN DETECTION (A-B-A-B)
                            recentLines.push(lastCompleteLine);
                            if (recentLines.length > maxRepeatWindow) {
                                recentLines.shift();
                            }

                            // Check for distributed patterns every 4 lines
                            if (recentLines.length >= 6 && recentLines.length % 4 === 0) {
                                const distributedPatterns = this.duplicationDetector.detectDistributedRepetition(recentLines);

                                if (distributedPatterns.length > 0) {
                                    const pattern = distributedPatterns[0];
                                    this.logger.warn(`Distributed repetition pattern detected: ${pattern.pattern.length}-line pattern repeated ${pattern.occurrences} times. Stopping.`);
                                    break;
                                }
                            }

                            // 5. BLOCK-LEVEL DEDUPLICATION (check last 50 chars)
                            if (completion.length > 100) {
                                const lastBlock = completion.slice(-50);
                                const beforeBlock = completion.slice(-150, -50);

                                if (beforeBlock.includes(lastBlock)) {
                                    this.logger.warn(`Block repetition detected. Stopping.`);
                                    break;
                                }
                            }
                        }
                    }
                }

                // METADATA REPETITION CHECK (Phase 12)
                // If the model starts repeating the same metadata (e.g., "File: test.ts\nFile: test.ts"), stop
                if (completion.includes('File:') && completion.split('File:').length > 3) {
                    this.logger.warn('Metadata repetition detected. Stopping generation.');
                    break;
                }

                // EXACT DUPLICATE DETECTION (Phase 12)
                // Track last N lines to detect exact duplicates
                if (text === '\n') {
                    const currentLine = completion.split('\n').pop() || '';
                    if (currentLine.trim().length > 0) {
                        recentLines.push(currentLine);
                        if (recentLines.length > maxRepeatWindow) {
                            recentLines.shift();
                        }

                        // Check for exact duplicates
                        const lineCount = recentLines.filter(l => l === currentLine).length;
                        if (lineCount >= 3) {
                            this.logger.warn(`Exact duplicate line detected (${lineCount} times): "${currentLine.substring(0, 50)}..."`);
                            break;
                        }
                    }
                }

                // NEAR-DUPLICATE DETECTION (Phase 12)
                // Detect lines that are very similar (e.g., only differ by whitespace or minor chars)
                if (text === '\n' && recentLines.length > 2) {
                    const lastLine = recentLines[recentLines.length - 1];
                    const secondLastLine = recentLines[recentLines.length - 2];

                    if (lastLine && secondLastLine) {
                        const similarity = this.duplicationDetector.calculateSimilarity(lastLine, secondLastLine);
                        if (similarity > 0.9) {
                            this.logger.warn(`Near-duplicate lines detected (${(similarity * 100).toFixed(0)}% similar)`);
                            break;
                        }
                    }
                }

                // DISTRIBUTED PATTERN DETECTION (Phase 12)
                // Detect patterns like "A\nB\nA\nB\nA\nB"
                if (recentLines.length >= 6) {
                    const last6 = recentLines.slice(-6);
                    if (last6[0] === last6[2] && last6[2] === last6[4] &&
                        last6[1] === last6[3] && last6[3] === last6[5]) {
                        this.logger.warn('Distributed pattern repetition detected (A-B-A-B-A-B)');
                        break;
                    }
                }

                // BLOCK-LEVEL DEDUPLICATION (Phase 12)
                // Detect when the same block of code repeats
                if (completion.length > 200) {
                    const last100 = completion.slice(-100);
                    const before100 = completion.slice(-200, -100);

                    if (last100.trim() === before100.trim() && last100.trim().length > 20) {
                        this.logger.warn('Block-level repetition detected');
                        break;
                    }
                }

                // CRITICAL: AGGRESSIVE WORD-LEVEL REPETITION DETECTION
                // Detect patterns like "prefixprefix|prefixprefix|prefix..."
                if (completion.length > 50) {
                    const last50 = completion.slice(-50);

                    // Check for immediate word repetition (e.g., "prefixprefix", "suffixsuffix")
                    // RELAXED: Only trigger on 5+ repetitions to avoid false positives
                    const wordRepeatPattern = /(\w{4,})\1{4,}/;  // Word repeated 5+ times (was 3+)
                    if (wordRepeatPattern.test(last50)) {
                        const match = last50.match(wordRepeatPattern);
                        this.logger.warn(`Aggressive word repetition detected: "${match?.[0]?.substring(0, 30)}..."`);
                        break;
                    }

                    // Check for FIM keyword loops specifically
                    // RELAXED: Only trigger on 3+ matches (was 2+)
                    const fimKeywordLoop = /(prefix|suffix|middle|fim)(\||>|<|\s){0,2}\1/gi;
                    const fimMatches = last50.match(fimKeywordLoop);
                    if (fimMatches && fimMatches.length >= 3) {  // Changed from 2 to 3
                        this.logger.warn(`FIM keyword loop detected: ${fimMatches.length} repetitions`);
                        break;
                    }

                    // Check for character-level loops (e.g., ">>>>>>>>")
                    // RELAXED: Increased threshold from 10 to 15 characters
                    const charRepeatPattern = /(.)\\1{14,}/;  // Same char 15+ times (was 10+)
                    if (charRepeatPattern.test(last50)) {
                        const match = last50.match(charRepeatPattern);
                        this.logger.warn(`Character repetition loop detected: "${match?.[0]?.substring(0, 20)}..."`);
                        break;
                    }
                }

                // INTRA-LINE LOOP DETECTION (Token Level)
                // Check for repetitive tokens within the current line (before newline)
                const currentLineContent = completion.split('\n').pop() || '';
                // RELAXED: Increased threshold from 30 to 50 characters
                if (currentLineContent.length > 50) {  // Changed from 30 to 50
                    // Split into words and check for repetition
                    const words = currentLineContent.split(/\s+/);
                    const wordCounts = new Map<string, number>();

                    for (const word of words) {
                        // Only count meaningful words (not single chars or very short)
                        if (word.trim().length > 2) {  // Changed from >1 to >2
                            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
                        }
                    }

                    // RELAXED: If any word appears 5+ times in the same line (was 3+)
                    for (const [word, count] of wordCounts.entries()) {
                        if (count >= 5) {  // Changed from 3 to 5
                            this.logger.warn(`Intra-line loop detected: "${word}" appears ${count} times`);
                            break;
                        }
                    }
                }

                // Call streaming callback if provided
                if (onToken) {
                    onToken(text, tokensGenerated);
                }

                // Check for stop sequences
                if (stop.length > 0 && stop.some(s => completion.includes(s))) {
                    break;
                }
            }

            this.logger.info(`Token generation loop completed. Iterations: ${loopIterations}, Tokens: ${tokensGenerated}`);

            if (tokensGenerated === 0) {
                 this.logger.error('⚠️  Stream produced NO tokens! Model declined to generate or failed immediately.');
                 this.logger.warn('Prompt might be malformed or model refused to generate.');
            }

            // Phase 9: DONE - Do NOT dispose sequence here.
            // Keep it alive for the next request to benefit from KV cache.
            // Only clear if explicitly requested or on error.
            this.logger.info('Sequence retained for KV cache');

            // Clean up any remaining FIM tokens from the final completion using comprehensive patterns
            // this.logger.debug(`[DEBUG] Raw completion (len=${completion.length}):`, JSON.stringify(completion));
            let cleanedCompletion = completion;

            // PASS 1: Apply all FIM token patterns from the static regex
            cleanedCompletion = cleanedCompletion.replace(LlamaInference.FIM_TOKEN_REGEX, '');

            // PASS 2: Clean up orphaned pipes and curly braces (artifacts from FIM token removal)
            cleanedCompletion = cleanedCompletion.replace(/\|\s*\|/g, '');  // Remove ||
            cleanedCompletion = cleanedCompletion.replace(/\{\s*\}/g, '');  // Remove {}
            cleanedCompletion = cleanedCompletion.replace(/\{\s*\|/g, '');  // Remove {|
            cleanedCompletion = cleanedCompletion.replace(/\|\s*\}/g, '');  // Remove |}

            // PASS 3: Remove standalone orphaned pipes (but preserve valid code)
            // Only remove pipes that are clearly FIM artifacts (surrounded by whitespace or at line boundaries)
            cleanedCompletion = cleanedCompletion.replace(/^\s*\|\s*$/gm, '');  // Line with only |
            cleanedCompletion = cleanedCompletion.replace(/\s+\|\s+/g, ' ');    // Isolated | between spaces

            // PASS 4: Line-by-line aggressive filtering (catches distributed tokens)
            const lines = cleanedCompletion.split('\n');
            const cleanedLines = lines.map(line => {
                let cleanLine = line;

                // Remove any line that's ONLY FIM tokens
                if (/^[\s\/\/#]*\u003c[|]?fim_/i.test(cleanLine.trim())) {
                    return '';
                }

                // Remove FIM tokens from within lines
                cleanLine = cleanLine.replace(/\u003c[|]?fim_[a-z_]*[|]?\u003e?/gi, '');
                cleanLine = cleanLine.replace(/[|]?fim_[a-z_]*/gi, '');
                cleanLine = cleanLine.replace(/\u003c[|][^\u003e]*/gi, '');
                cleanLine = cleanLine.replace(/[|]\u003e/gi, '');

                return cleanLine;
            });
            cleanedCompletion = cleanedLines.join('\n');

            // PASS 5: Additional cleanup for edge cases
            cleanedCompletion = cleanedCompletion.replace(/obj\\['middle'\\]/g, ''); // Specific fix for user report
            cleanedCompletion = cleanedCompletion.replace(/\\\\+\u003c/g, '\u003c'); // Remove escaped backslashes before \u003c

            // PASS 6: Remove any remaining angle bracket artifacts
            cleanedCompletion = cleanedCompletion.replace(/\u003c[|]+/g, ''); // Orphaned \u003c|
            cleanedCompletion = cleanedCompletion.replace(/[|]+\u003e/g, ''); // Orphaned |\u003e

            // PASS 7: Clean up excessive whitespace/newlines created by token removal
            cleanedCompletion = cleanedCompletion.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
            // cleanedCompletion = cleanedCompletion.replace(/^[\s\n]+/, ''); // Remove leading whitespace (Disabled to support indentation)

            // this.logger.debug(`[DEBUG] Cleaned completion (len=${cleanedCompletion.trimEnd().length}):`, JSON.stringify(cleanedCompletion.trimEnd()));
            return cleanedCompletion.trimEnd();
        } catch (error) {
            this.logger.error(`Completion generation failed: ${error}`);

            // Try to dispose sequence on error
            // On error, we DO reset the sequence to avoid stuck states
            if (this.activeSequence) {
                try {
                    await this.activeSequence.dispose();
                } catch (e) {
                    // Ignore disposal errors
                }
                this.activeSequence = null;
            }

            throw error;
        } finally {
            this._generating = false;
        }
    }

    async generateImprovement(code: string, instruction: string, options: InferenceOptions = {}): Promise<string> {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }

        const prompt = `### Instruction:\n${instruction}\n\n### Input:\n\`\`\`\n${code}\n\`\`\`\n\n### Response:\n`;

        const maxTokens = options.maxTokens || 512;

        return this.generateCompletion(prompt, { ...options, maxTokens, stop: ['### Instruction:', '```\n'] });
    }

    isModelLoaded(): boolean {
        return this.isLoaded && this.model !== null;
    }

    getModelPath(): string | null {
        return this.currentModelPath;
    }

    getModelStatus(): { loaded: boolean; modelPath: string | null } {
        return {
            loaded: this.isLoaded,
            modelPath: this.currentModelPath
        };
    }

    /**
     * Cache a prefix for faster repeated inferences
     */
    public cachePrefix(key: string, tokens: any[]): void {
        if (this.prefixCache.size >= this.maxPrefixCacheSize) {
            // Remove oldest entry
            const firstKey = this.prefixCache.keys().next().value;
            if (firstKey) {
                this.prefixCache.delete(firstKey);
            }
        }
        this.prefixCache.set(key, tokens);
    }

    /**
     * Get cached prefix tokens
     */
    public getCachedPrefix(key: string): any[] | null {
        return this.prefixCache.get(key) || null;
    }

    /**
     * Clear prefix cache
     */
    public clearPrefixCache(): void {
        this.prefixCache.clear();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.prefixCache.size,
            maxSize: this.maxPrefixCacheSize
        };
    }
}
