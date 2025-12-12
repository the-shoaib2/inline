import * as vscode from 'vscode';
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
export declare class LlamaInference {
    private model;
    private context;
    private activeSequence;
    private logger;
    private gpuDetector;
    private duplicationDetector;
    private astParser;
    private fimManager;
    private isLoaded;
    private currentModelPath;
    private prefixCache;
    private maxPrefixCacheSize;
    private _generating;
    private static readonly DEFAULT_MAX_TOKENS;
    private static readonly DEFAULT_TEMPERATURE;
    private static readonly DEFAULT_TOP_P;
    private static readonly DEFAULT_TOP_K;
    private static readonly DEFAULT_REPEAT_PENALTY;
    private static readonly DEFAULT_CONTEXT_SIZE;
    constructor();
    /**
     * Comprehensive FIM token pattern matching.
     * Handles multiple FIM formats across different model families:
     * - Standard angle brackets: <|fim_prefix|>
     * - CodeLlama style: <PRE>, <SUF>, <MID>
     * - Mistral/Codestral: [PREFIX], [SUFFIX], [MIDDLE]
     * - DeepSeek/Qwen: {|fim_prefix|}
     * Optimized as single regex for performance.
     */
    private static _llamaInstance;
    private getLlamaInstance;
    loadModel(modelPath: string, options?: {
        threads?: number;
        gpuLayers?: number;
        contextSize?: number;
        fimTemplate?: string;
    }): Promise<void>;
    unloadModel(): Promise<void>;
    /**
     * Generate completion with optional streaming support
     */
    generateCompletion(prompt: string, options?: InferenceOptions, onToken?: TokenCallback, cancellationToken?: vscode.CancellationToken): Promise<string>;
    generateImprovement(code: string, instruction: string, options?: InferenceOptions): Promise<string>;
    isModelLoaded(): boolean;
    getModelPath(): string | null;
    getModelStatus(): {
        loaded: boolean;
        modelPath: string | null;
    };
    /**
     * Cache a prefix for faster repeated inferences
     */
    cachePrefix(key: string, tokens: any[]): void;
    /**
     * Get cached prefix tokens
     */
    getCachedPrefix(key: string): any[] | null;
    /**
     * Clear prefix cache
     */
    clearPrefixCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
}
//# sourceMappingURL=llama-engine.d.ts.map