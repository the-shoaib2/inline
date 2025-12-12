import * as vscode from 'vscode';
export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    size: number;
    languages: string[];
    requirements: {
        vram: number;
        ram: number;
        cpu: boolean;
        gpu: boolean;
    };
    isDownloaded: boolean;
    downloadUrl?: string;
    path?: string;
    architecture?: string;
    quantization?: string;
    contextWindow?: number;
}
/**
 * Real-time download progress metrics.
 */
interface DownloadProgress {
    modelId: string;
    progress: number;
    downloadedBytes: number;
    totalBytes: number;
    speed: number;
    eta: number;
}
/**
 * Downloads and manages GGUF model files from remote sources.
 *
 * Responsibilities:
 * - Queue and execute downloads sequentially
 * - Track download progress and speed
 * - Extract tar.gz archives
 * - Validate downloaded files
 * - Support cancellation via CancellationToken
 * - Maintain safe models directory
 */
export declare class ModelDownloader {
    private modelsDir;
    private downloadQueue;
    private isDownloading;
    private logger;
    private activeDownloads;
    private safeModelsDir;
    /**
     * Initialize downloader with target models directory.
     * @param modelsDir Directory to store downloaded models
     */
    constructor(modelsDir: string);
    /**
     * Get safe models directory path.
     * Prefers extension global storage, falls back to ~/.inline/models.
     */
    private getSafeModelsDirectory;
    /**
     * Create models directory if it doesn't exist.
     */
    private ensureModelsDirectory;
    /**
     * Get list of available models for download.
     * Includes metadata, size, and requirements.
     */
    getAvailableModels(): ModelInfo[];
    getDownloadedModels(): ModelInfo[];
    getDownloadProgress(modelId: string): DownloadProgress | null;
    downloadModel(model: ModelInfo, progressCallback?: (progress: number) => void, cancellationToken?: vscode.CancellationToken): Promise<string>;
    private processQueue;
    private simulateDownload;
    private downloadFile;
    importModel(filePath: string): Promise<ModelInfo>;
    private copyFileWithProgress;
    private extractModel;
    private formatFileSize;
    getModelPath(modelId: string): string | null;
    deleteModel(modelId: string): Promise<void>;
    getModelsDirectorySize(): number;
    cancelDownload(modelId: string): void;
    getQueueLength(): number;
}
export {};
//# sourceMappingURL=model-downloader.d.ts.map