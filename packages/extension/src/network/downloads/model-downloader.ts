import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as https from 'https';
import * as os from 'os';
// @ts-ignore - tar module types not available
import * as tar from 'tar';
import { ModelInfo } from '@intelligence/models/model-manager';
import { Logger } from '@platform/system/logger';

/**
 * Queued download task with progress tracking.
 */
interface DownloadTask {
    model: ModelInfo;
    progressCallback?: (progress: number) => void;
    resolve: (filePath: string) => void;
    reject: (error: unknown) => void;
    cancellationToken?: vscode.CancellationToken;
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
export class ModelDownloader {
    private downloadQueue: DownloadTask[] = [];
    private isDownloading: boolean = false;
    private logger: Logger;
    private activeDownloads: Map<string, DownloadProgress> = new Map();
    private safeModelsDir: string;

    /**
     * Initialize downloader with target models directory.
     * @param modelsDir Directory to store downloaded models
     */
    constructor(private modelsDir: string) {
        this.logger = new Logger('ModelDownloader');
        this.safeModelsDir = modelsDir;
        this.ensureModelsDirectory();
    }

    /**
     * Get safe models directory path.
     * Prefers extension global storage, falls back to ~/.inline/models.
     */
    private getSafeModelsDirectory(): string {
        // Try to use extension global storage for safe isolation
        const extension = vscode.extensions.getExtension('inline.inline');
        if (extension && extension.extensionPath) {
            const globalStoragePath = extension.extensionUri.fsPath;
            const safeDir = path.join(globalStoragePath, 'models');
            return safeDir;
        }

        // Fallback to user home directory
        const homeDir = os.homedir();
        return path.join(homeDir, '.inline', 'models');
    }

    /**
     * Create models directory if it doesn't exist.
     */
    private ensureModelsDirectory(): void {
        if (!fs.existsSync(this.safeModelsDir)) {
            fs.mkdirSync(this.safeModelsDir, { recursive: true });
            this.logger.info(`Created safe models directory: ${this.safeModelsDir}`);
        }
    }

    /**
     * Get list of available models for download.
     * Includes metadata, size, and requirements.
     */
    public getAvailableModels(): ModelInfo[] {
        return [
            {
                id: 'deepseek-coder-6.7b',
                name: 'DeepSeek Coder 6.7B',
                description: 'Lightweight code completion model optimized for multiple languages',
                size: 3.8 * 1024 * 1024 * 1024,
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false,
                downloadUrl: 'https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-GGUF/resolve/main/deepseek-coder-6.7b-instruct.Q4_K_M.gguf'
            },
            {
                id: 'starcoder2-3b',
                name: 'StarCoder2 3B',
                description: 'Fast and efficient model for quick completions',
                size: 1.7 * 1024 * 1024 * 1024,
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp'],
                requirements: { vram: 4, ram: 8, cpu: true, gpu: false },
                isDownloaded: false,
                downloadUrl: 'https://huggingface.co/TheBloke/starcoder2-3b-GGUF/resolve/main/starcoder2-3b.Q4_K_M.gguf'
            },
            {
                id: 'codellama-7b',
                name: 'Code Llama 7B',
                description: 'Meta\'s code model with excellent understanding',
                size: 4.1 * 1024 * 1024 * 1024, // 4.1GB
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false,
                downloadUrl: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf'
            }
        ];
    }

    public getDownloadedModels(): ModelInfo[] {
        const availableModels = this.getAvailableModels();
        const downloadedModels: ModelInfo[] = [];

        for (const model of availableModels) {
            const modelPath = this.getModelPath(model.id);
            if (modelPath && fs.existsSync(modelPath)) {
                downloadedModels.push(model);
            }
        }

        return downloadedModels;
    }

    public getDownloadProgress(modelId: string): DownloadProgress | null {
        return this.activeDownloads.get(modelId) || null;
    }

    public async downloadModel(
        model: ModelInfo,
        progressCallback?: (progress: number) => void,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const task: DownloadTask = {
                model,
                progressCallback,
                resolve,
                reject,
                cancellationToken
            };

            this.downloadQueue.push(task);
            this.processQueue();
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isDownloading || this.downloadQueue.length === 0) {
            return;
        }

        this.isDownloading = true;
        const task = this.downloadQueue.shift()!;

        try {
            const fileName = `${task.model.id}.gguf`;
            const filePath = path.join(this.safeModelsDir, fileName);

            // Check if model already exists
            if (fs.existsSync(filePath)) {
                task.resolve(filePath);
                return;
            }

            // Check if download URL is available
            if (!task.model.downloadUrl) {
                throw new Error('No download URL available for this model');
            }

            // Initialize progress tracking
            const progress: DownloadProgress = {
                modelId: task.model.id,
                progress: 0,
                downloadedBytes: 0,
                totalBytes: task.model.size,
                speed: 0,
                eta: 0
            };
            this.activeDownloads.set(task.model.id, progress);

            // Real HTTP download
            await this.downloadFile(
                task.model.downloadUrl,
                filePath,
                (progressPercent) => {
                    if (task.progressCallback) {
                        task.progressCallback(progressPercent);
                    }
                },
                task.cancellationToken,
                progress
            );

            this.logger.info(`Model downloaded successfully: ${task.model.name}`);
            task.resolve(filePath);
        } catch (error: unknown) {
            this.logger.error(`Failed to download model: ${error}`);
            task.reject(error);
        } finally {
            this.isDownloading = false;
            this.activeDownloads.delete(task.model.id);
            this.processQueue();
        }
    }

    private async simulateDownload(
        progressCallback?: (progress: number) => void,
        cancellationToken?: vscode.CancellationToken,
        progress?: DownloadProgress
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            let currentProgress = 0;
            const totalSteps = 100;
            const stepDelay = 100; // 100ms per step = 10 seconds total

            const interval = setInterval(() => {
                if (cancellationToken?.isCancellationRequested) {
                    clearInterval(interval);
                    reject(new Error('Download cancelled'));
                    return;
                }

                currentProgress++;

                if (progress && progressCallback) {
                    progress.progress = currentProgress;
                    progress.downloadedBytes = Math.floor((currentProgress / 100) * progress.totalBytes);

                    // Simulate speed and ETA
                    progress.speed = progress.totalBytes / (totalSteps * stepDelay / 1000); // bytes per second

                    if (currentProgress < 100) {
                        progress.eta = ((totalSteps - currentProgress) * stepDelay) / 1000;
                    } else {
                        progress.eta = 0;
                    }

                    progressCallback(currentProgress);
                } else if (progressCallback) {
                    progressCallback(currentProgress);
                }

                if (currentProgress >= totalSteps) {
                    clearInterval(interval);
                    resolve();
                }
            }, stepDelay);
        });
    }

    private async downloadFile(
        url: string,
        destPath: string,
        progressCallback?: (progress: number) => void,
        cancellationToken?: vscode.CancellationToken,
        progress?: DownloadProgress
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);
            const startTime = Date.now();
            let lastUpdateTime = startTime;

            const request = https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] || '0');
                let downloadedSize = 0;

                // Handle cancellation
                if (cancellationToken) {
                    cancellationToken.onCancellationRequested(() => {
                        request.destroy();
                        file.close();
                        fs.unlinkSync(destPath);
                        reject(new Error('Download cancelled'));
                    });
                }

                response.on('data', (chunk) => {
                    if (cancellationToken?.isCancellationRequested) {
                        return;
                    }

                    downloadedSize += chunk.length;
                    file.write(chunk);

                    if (progress && progressCallback) {
                        const currentTime = Date.now();
                        const timeDiff = (currentTime - lastUpdateTime) / 1000; // seconds

                        if (timeDiff >= 0.5) { // Update every 0.5 seconds
                            progress.downloadedBytes = downloadedSize;
                            progress.totalBytes = totalSize;
                            progress.progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;

                            // Calculate speed and ETA
                            const elapsedSeconds = (currentTime - startTime) / 1000;
                            progress.speed = downloadedSize / elapsedSeconds; // bytes per second

                            if (progress.speed > 0 && totalSize > downloadedSize) {
                                progress.eta = (totalSize - downloadedSize) / progress.speed; // seconds
                            }

                            progressCallback(progress.progress);
                            lastUpdateTime = currentTime;
                        }
                    } else if (totalSize > 0 && progressCallback) {
                        const progress = (downloadedSize / totalSize) * 100;
                        progressCallback(progress);
                    }
                });

                response.on('end', () => {
                    if (cancellationToken?.isCancellationRequested) {
                        return;
                    }
                    file.end();
                    resolve();
                });
            });

            request.on('error', (error) => {
                file.close();
                if (fs.existsSync(destPath)) {
                    fs.unlinkSync(destPath);
                }
                reject(error);
            });

            file.on('error', (error) => {
                reject(error);
            });
        });
    }

    public async importModel(filePath: string): Promise<ModelInfo> {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            const fileExtension = path.extname(filePath).toLowerCase();
            let modelId = `imported_${path.basename(filePath, fileExtension).replace(/[^a-zA-Z0-9]/g, '_')}`;
            let destPath: string;

            // Validate file type
            if (fileExtension !== '.gguf' && fileExtension !== '.tar.gz' && fileExtension !== '.tgz') {
                throw new Error('Unsupported file format. Please provide a .gguf or .tar.gz file');
            }

            // Create temp directory for processing
            const tempDir = path.join(os.tmpdir(), `inline-import-${Date.now()}`);
            fs.mkdirSync(tempDir, { recursive: true });

            try {
                if (fileExtension === '.gguf') {
                    // Direct GGUF file import

                    // Validate GGUF magic number
                    const fd = fs.openSync(filePath, 'r');
                    const magicBuffer = Buffer.alloc(4);
                    fs.readSync(fd, magicBuffer as any, 0, 4, 0);
                    fs.closeSync(fd);

                    if (magicBuffer.toString('utf8') !== 'GGUF') {
                        throw new Error('Invalid GGUF file: Magic number mismatch');
                    }

                    destPath = path.join(this.safeModelsDir, `${modelId}.gguf`);

                    // Copy file with progress tracking
                    await this.copyFileWithProgress(filePath, destPath);
                } else {
                    // Handle archive extraction (existing logic)
                    await this.extractModel(filePath, tempDir);

                    // Look for GGUF files in extracted content
                    const files = fs.readdirSync(tempDir);
                    const ggufFile = files.find(f => f.endsWith('.gguf'));

                    if (!ggufFile) {
                        throw new Error('No GGUF model file found in the archive');
                    }

                    modelId = `imported_${path.basename(ggufFile, '.gguf')}_${Date.now()}`;
                    destPath = path.join(this.safeModelsDir, `${modelId}.gguf`);

                    fs.renameSync(path.join(tempDir, ggufFile), destPath);
                }

                const modelInfo: ModelInfo = {
                    id: modelId,

                    name: path.basename(destPath, '.gguf').replace(/_/g, ' '),
                    description: `Imported model (${this.formatFileSize(stats.size)})`,
                    languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'shellscript', 'c', 'shell'], // Assumed general purpose
                    requirements: {
                        vram: 8, // Default VRAM requirement
                        ram: 12,
                        cpu: true,
                        gpu: true
                    },
                    isDownloaded: true,
                    path: destPath,
                    size: stats.size,
                    architecture: 'llama', // Assumed for GGUF
                    quantization: 'unknown', // Could extract from metadata
                    contextWindow: 4096, // Default
                    downloadUrl: '', // Local import

                };

                return modelInfo;
            } finally {
                // Cleanup temp directory
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
        } catch (error) {
            this.logger.error(`Failed to import model: ${error}`);
            throw error;
        }
    }

    private async copyFileWithProgress(src: string, dest: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stat = fs.statSync(src);
            const totalBytes = stat.size;
            let processedBytes = 0;

            const readStream = fs.createReadStream(src);
            const writeStream = fs.createWriteStream(dest);

            readStream.on('data', (chunk) => {
                processedBytes += chunk.length;
                // We could emit progress here if we had a callback
            });

            readStream.on('error', reject);
            writeStream.on('error', reject);

            writeStream.on('finish', () => resolve());

            readStream.pipe(writeStream);
        });
    }

    private async extractModel(tarPath: string, extractPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            tar.extract({
                file: tarPath,
                cwd: extractPath,
                strip: 1
            }).then(() => {
                resolve();
            }).catch((error: unknown) => {
                reject(error);
            });
        });
    }

    private formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    public getModelPath(modelId: string): string | null {
        const filePath = path.join(this.safeModelsDir, `${modelId}.gguf`);
        return fs.existsSync(filePath) ? filePath : null;
    }

    public deleteModel(modelId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const filePath = path.join(this.safeModelsDir, `${modelId}.gguf`);

            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    this.logger.info(`Model deleted successfully: ${modelId}`);
                    resolve();
                } catch (error) {
                    this.logger.error(`Failed to delete model: ${error}`);
                    reject(error);
                }
            } else {
                reject(new Error(`Model not found: ${modelId}`));
            }
        });
    }

    public getModelsDirectorySize(): number {
        try {
            const files = fs.readdirSync(this.safeModelsDir);
            let totalSize = 0;

            for (const file of files) {
                const filePath = path.join(this.safeModelsDir, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
            }

            return totalSize;
        } catch (error) {
            return 0;
        }
    }

    public cancelDownload(modelId: string): void {
        this.downloadQueue = this.downloadQueue.filter(task => task.model.id !== modelId);
    }

    public getQueueLength(): number {
        return this.downloadQueue.length;
    }
}
