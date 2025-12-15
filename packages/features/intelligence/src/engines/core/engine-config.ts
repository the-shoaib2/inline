/**
 * Engine configuration interfaces and constants
 */

export interface EngineConfig {
    /** Path to the GGUF model file */
    modelPath: string;
    /** Number of CPU threads to use */
    threads?: number;
    /** Number of GPU layers to offload */
    gpuLayers?: number;
    /** Context window size */
    contextSize?: number;
    /** Batch size for processing */
    batchSize?: number;
    /** Number of sequences to support */
    sequences?: number;
    /** FIM template ID */
    fimTemplate?: string;
}

export interface InferenceConfig {
    /** Sampling temperature (0.0-2.0) */
    temperature?: number;
    /** Top-p sampling (0.0-1.0) */
    topP?: number;
    /** Top-k sampling */
    topK?: number;
    /** Maximum tokens to generate */
    maxTokens?: number;
    /** Stop sequences */
    stop?: string[];
    /** Enable streaming */
    streaming?: boolean;
    /** Repeat penalty (1.0 = no penalty) */
    repeatPenalty?: number;
    /** Maximum lines to generate */
    maxLines?: number;
    /** Programming language for context */
    language?: string;
}

/**
 * Default engine configuration constants
 */
export const DEFAULT_ENGINE_CONFIG = {
    MAX_TOKENS: 512,
    TEMPERATURE: 0.7,
    TOP_P: 0.95,
    TOP_K: 40,
    REPEAT_PENALTY: 1.2,
    CONTEXT_SIZE: 16384,
    BATCH_SIZE: 1024,
    SEQUENCES: 4,
    MAX_LINES: 1000
} as const;

/**
 * Validates engine configuration
 */
export class ConfigValidator {
    static validateModelPath(modelPath: string): void {
        if (!modelPath || typeof modelPath !== 'string') {
            throw new Error('Model path must be a non-empty string');
        }
    }

    static validateThreads(threads?: number): void {
        if (threads !== undefined && (threads < 1 || !Number.isInteger(threads))) {
            throw new Error('Threads must be a positive integer');
        }
    }

    static validateGPULayers(gpuLayers?: number): void {
        if (gpuLayers !== undefined && (gpuLayers < 0 || !Number.isInteger(gpuLayers))) {
            throw new Error('GPU layers must be a non-negative integer');
        }
    }

    static validateContextSize(contextSize?: number): void {
        if (contextSize !== undefined && (contextSize < 512 || !Number.isInteger(contextSize))) {
            throw new Error('Context size must be at least 512');
        }
    }

    static validateTemperature(temperature?: number): void {
        if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
            throw new Error('Temperature must be between 0 and 2');
        }
    }

    static validateTopP(topP?: number): void {
        if (topP !== undefined && (topP < 0 || topP > 1)) {
            throw new Error('Top-p must be between 0 and 1');
        }
    }

    static validateEngineConfig(config: EngineConfig): void {
        this.validateModelPath(config.modelPath);
        this.validateThreads(config.threads);
        this.validateGPULayers(config.gpuLayers);
        this.validateContextSize(config.contextSize);
    }

    static validateInferenceConfig(config: InferenceConfig): void {
        this.validateTemperature(config.temperature);
        this.validateTopP(config.topP);
        
        if (config.maxTokens !== undefined && config.maxTokens < 1) {
            throw new Error('Max tokens must be at least 1');
        }
        
        if (config.maxLines !== undefined && config.maxLines < 1) {
            throw new Error('Max lines must be at least 1');
        }
    }
}
