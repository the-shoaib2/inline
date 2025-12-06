import * as path from 'path';
import * as fs from 'fs';
import type { LlamaModel, LlamaContext } from 'node-llama-cpp';
import { Logger } from '../utils/logger';
import { GPUDetector } from '../utils/gpu-detector';
import { DuplicationDetector } from '../utils/duplication-detector';
import { ASTParser } from '../utils/ast-parser';
import * as vscode from 'vscode';
import * as os from 'os';

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

export type TokenCallback = (token: string, totalTokens: number) => void;

export class LlamaInference {
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private activeSequence: any = null; // Persistent sequence for KV cache
    private logger: Logger;
    private gpuDetector: GPUDetector;
    private duplicationDetector: DuplicationDetector;
    private astParser: ASTParser;
    private isLoaded: boolean = false;
    private currentModelPath: string | null = null;
    private prefixCache: Map<string, any> = new Map();
    private maxPrefixCacheSize: number = 100;

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

    // Comprehensive FIM token patterns for filtering
    private static readonly FIM_TOKEN_PATTERNS = [
        // Standard angle bracket formats
        /\u003c\|?fim_prefix\|?\u003e/gi,
        /\u003c\|?fim_suffix\|?\u003e/gi,
        /\u003c\|?fim_middle\|?\u003e/gi,
        /\u003c\|?fim_end\|?\u003e/gi,
        /\u003c\|?fim_begin\|?\u003e/gi,
        /\u003c\|?fim_hole\|?\u003e/gi,
        /\u003c\|?file_separator\|?\u003e/gi,
        /\u003c\|?endoftext\|?\u003e/gi,
        
        // CodeLlama style
        /\u003cPRE\u003e/gi,
        /\u003cSUF\u003e/gi,
        /\u003cMID\u003e/gi,
        /\u003cEND\u003e/gi,
        /\u003cEOT\u003e/gi,
        
        // With spaces
        /\u003c\s*PRE\s*\u003e/gi,
        /\u003c\s*SUF\s*\u003e/gi,
        /\u003c\s*MID\s*\u003e/gi,
        /\u003c\s*END\s*\u003e/gi,
        
        // Mistral/Codestral style
        /\[PREFIX\]/gi,
        /\[SUFFIX\]/gi,
        /\[MIDDLE\]/gi,
        
        // Escaped versions (backslash before \u003c)
        /\\\u003c\|?fim_prefix\|?\u003e/gi,
        /\\\u003c\|?fim_suffix\|?\u003e/gi,
        /\\\u003c\|?fim_middle\|?\u003e/gi,
        /\\\u003cPRE\u003e/gi,
        /\\\u003cSUF\u003e/gi,
        /\\\u003cMID\u003e/gi,
        
        // Any remaining FIM-like patterns
        /\u003c[^\u003e]*fim[^\u003e]*\u003e/gi,
        /\u003c[^\u003e]*PRE[^\u003e]*\u003e/gi,
        /\u003c[^\u003e]*SUF[^\u003e]*\u003e/gi,
        /\u003c[^\u003e]*MID[^\u003e]*\u003e/gi,
        
        // AGGRESSIVE: Partial/malformed tokens (NEW)
        /\u003c\|?fim_/gi,  // Catches incomplete tokens like "\u003c|fim_"
        /\|?fim_prefix/gi,  // Catches tokens without closing
        /\|?fim_suffix/gi,
        /\|?fim_middle/gi,
        /\u003c\|[^\u003e]*/gi,  // Catches any "\u003c|" pattern without proper closing
        /\|\u003e/gi,  // Catches orphaned closing pipes
        
        // Comment-style FIM tokens (sometimes models output these)
        /\/\/\s*\u003c\|?fim_/gi,
        /#\s*\u003c\|?fim_/gi,
        
        // Repeated patterns (NEW - catches your specific case)
        /(\u003c\|?fim_prefix\|?\u003e){2,}/gi,  // Multiple consecutive fim_prefix
        /(\u003cPRE\u003e){2,}/gi,  // Multiple consecutive PRE
        /(\u003cSUF\u003e){2,}/gi,
        /(\u003cMID\u003e){2,}/gi
    ];

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
                contextSize: options.contextSize || 16384,
                threads: optimizedThreads,
                batchSize: 1024, // Increased from 512 for faster prompt processing
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
        while ((this as any)._generating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        (this as any)._generating = true;

        let sequence: any = null;

        try {
            const maxTokens = options.maxTokens || 512;
            const temperature = options.temperature || 0.7;
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
                topP: options.topP || 0.95,
                topK: options.topK || 40,
                repeatPenalty: options.repeatPenalty || 1.2, // Phase 12: Increased default to 1.2 to prevent loops
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

            // Helper function to check if text contains FIM tokens
            const containsFIMToken = (text: string): boolean => {
                return LlamaInference.FIM_TOKEN_PATTERNS.some(pattern => {
                    // Reset regex lastIndex to avoid state issues
                    pattern.lastIndex = 0;
                    return pattern.test(text);
                });
            };

            // Stream tokens and build completion
            for await (const token of stream) {
                // Check for cancellation
                if (cancellationToken?.isCancellationRequested) {
                    this.logger.info('Completion cancelled by user');
                    break;
                }

                if (tokensGenerated >= maxTokens) {
                    break;
                }

                const text = this.model.detokenize([token]);
                
                // Filter out FIM special tokens
                const trimmedText = text.trim();
                if (containsFIMToken(trimmedText)) {
                    this.logger.info(`Filtered out FIM token: ${trimmedText}`);
                    continue;
                }
                
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

                // Call streaming callback if provided
                if (onToken) {
                    onToken(text, tokensGenerated);
                }

                // Check for stop sequences
                if (stop.length > 0 && stop.some(s => completion.includes(s))) {
                    break;
                }
            }

            this.logger.info(`Completion generated: ${tokensGenerated} tokens`);
            
            // Phase 9: DONE - Do NOT dispose sequence here. 
            // Keep it alive for the next request to benefit from KV cache.
            // Only clear if explicitly requested or on error.
            this.logger.info('Sequence retained for KV cache');
            
            // Clean up any remaining FIM tokens from the final completion using comprehensive patterns
            let cleanedCompletion = completion;
            
            // PASS 1: Apply all FIM token patterns from the static constant
            for (const pattern of LlamaInference.FIM_TOKEN_PATTERNS) {
                // Reset regex lastIndex to avoid state issues with global flags
                pattern.lastIndex = 0;
                cleanedCompletion = cleanedCompletion.replace(pattern, '');
            }
            
            // PASS 2: Line-by-line aggressive filtering (catches distributed tokens)
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
            
            // PASS 3: Additional cleanup for edge cases
            cleanedCompletion = cleanedCompletion.replace(/obj\\['middle'\\]/g, ''); // Specific fix for user report
            cleanedCompletion = cleanedCompletion.replace(/\\\\+\u003c/g, '\u003c'); // Remove escaped backslashes before \u003c
            
            // PASS 4: Remove any remaining angle bracket artifacts
            cleanedCompletion = cleanedCompletion.replace(/\u003c[|]+/g, ''); // Orphaned \u003c|
            cleanedCompletion = cleanedCompletion.replace(/[|]+\u003e/g, ''); // Orphaned |\u003e
            
            // PASS 5: Clean up excessive whitespace/newlines created by token removal
            cleanedCompletion = cleanedCompletion.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
            cleanedCompletion = cleanedCompletion.replace(/^[\s\n]+/, ''); // Remove leading whitespace
            
            return cleanedCompletion.trim();
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
            (this as any)._generating = false;
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
