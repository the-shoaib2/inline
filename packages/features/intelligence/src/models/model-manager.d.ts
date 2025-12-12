import * as vscode from 'vscode';
import { LlamaInference } from '../engines/llama-engine';
/**
 * Metadata for a code completion model.
 * Includes size, language support, resource requirements, and FIM template info.
 */
export interface ModelInfo {
    id: string;
    name: string;
    size: number;
    description: string;
    languages: string[];
    requirements: {
        vram?: number;
        ram?: number;
        cpu?: boolean;
        gpu?: boolean;
    };
    isDownloaded: boolean;
    path?: string;
    architecture?: string;
    quantization?: string;
    parameterCount?: string;
    contextWindow?: number;
    downloadUrl?: string;
    fimTemplate?: string;
    huggingfaceRepo?: string;
    huggingfaceFile?: string;
}
/**
 * Extracted metadata from model filenames or registry.
 */
export interface ModelMetadata {
    architecture?: string;
    parameterCount?: string;
    quantization?: string;
}
/**
 * Constraints for selecting the best model for a given task.
 */
export interface ModelRequirements {
    language?: string;
    maxVRAM?: number;
    maxRAM?: number;
    preferGPU?: boolean;
    speed?: 'fast' | 'balanced' | 'quality';
}
/**
 * Manages model lifecycle: discovery, loading, switching, and cleanup.
 *
 * Responsibilities:
 * - Load model registry from JSON and discover downloaded models
 * - Track workspace-local and global models
 * - Persist last active model across sessions
 * - Load/unload models with progress feedback
 * - Select best model based on language and resource constraints
 * - Extract metadata from model filenames
 */
export declare class ModelManager {
    private context;
    private modelsDirectory;
    private availableModels;
    private currentModel;
    private inferenceEngine;
    private logger;
    private hfClient;
    constructor(context: vscode.ExtensionContext);
    /**
     * Create models directory if it doesn't exist.
     */
    private initializeModelsDirectory;
    /**
     * Load model registry from JSON and discover downloaded models.
     * Restores last active model if it's still available.
     */
    private loadAvailableModels;
    /**
     * Restore the last active model from persistent state.
     * Sets currentModel reference; actual engine loading is deferred to warmup phase.
     */
    private restoreLastActiveModel;
    refreshModels(): Promise<void>;
    private checkDownloadedModels;
    private checkGlobalModels;
    private checkWorkspaceModels;
    downloadModel(modelId: string, _progressCallback?: (progress: number) => void): Promise<void>;
    removeModel(modelId: string): Promise<void>;
    getBestModel(requirements: ModelRequirements): ModelInfo | null;
    /**
     * Get optimal model for a specific language.
     * Prioritizes language-specific models over universal ones.
     * @param language Language ID
     * @returns Best model for the language or null
     */
    getOptimalModelForLanguage(language: string): ModelInfo | null;
    /**
     * Download a model from HuggingFace Hub.
     * @param modelId Model ID from registry
     * @returns Promise that resolves when download is complete
     */
    downloadFromHuggingFace(modelId: string): Promise<void>;
    /**
     * Import a model directly from HuggingFace by repository and file name.
     * @param repoId HuggingFace repository ID
     * @param filename GGUF file name
     * @returns Promise that resolves when import is complete
     */
    importFromHuggingFace(repoId: string, filename: string): Promise<void>;
    /**
     * Search for models on HuggingFace Hub.
     * @param query Search query
     * @returns Promise with array of model info
     */
    searchHuggingFaceModels(query: string): Promise<any[]>;
    /**
     * Load a model into the inference engine with progress feedback.
     * Unloads previous model if switching. Persists selection across sessions.
     *
     * @throws Error if model not found or loading fails
     */
    setCurrentModel(modelId: string): Promise<void>;
    unloadModel(): Promise<void>;
    getCurrentModel(): ModelInfo | null;
    getAllModels(): ModelInfo[];
    getDownloadedModels(): ModelInfo[];
    validateModel(modelPath: string): boolean;
    getInferenceEngine(): LlamaInference;
    optimizeModel(language: string): Promise<void>;
    monitorResources(): {
        vram: number;
        ram: number;
        cpu: number;
    };
    private extractModelMetadata;
    /**
     * Get the FIM template ID for the current model based on heuristics
     */
    getFimTemplateId(model?: ModelInfo): string;
    cleanup(): void;
}
//# sourceMappingURL=model-manager.d.ts.map