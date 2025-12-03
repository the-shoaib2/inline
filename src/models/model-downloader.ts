import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as https from 'https';
// @ts-ignore - tar module types not available
import * as tar from 'tar';
import { ModelInfo } from '../core/model-manager';
import { Logger } from '../utils/logger';


interface DownloadTask {
    model: ModelInfo;
    progressCallback?: (progress: number) => void;
    resolve: (filePath: string) => void;
    reject: (error: unknown) => void;
}

export class ModelDownloader {
    private downloadQueue: DownloadTask[] = [];
    private isDownloading: boolean = false;
    private logger: Logger;

    constructor(private modelsDir: string) {
        this.logger = new Logger('ModelDownloader');
        this.ensureModelsDirectory();
    }

    private ensureModelsDirectory(): void {
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
            this.logger.info(`Created models directory: ${this.modelsDir}`);
        }
    }

    public getAvailableModels(): ModelInfo[] {
        return [
            {
                id: 'deepseek-coder-6.7b',
                name: 'DeepSeek Coder 6.7B',
                description: 'Lightweight code completion model optimized for multiple languages',
                size: 3.8 * 1024 * 1024 * 1024, // 3.8GB
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false
            },
            {
                id: 'starcoder2-3b',
                name: 'StarCoder2 3B',
                description: 'Fast and efficient model for quick completions',
                size: 1.7 * 1024 * 1024 * 1024, // 1.7GB
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp'],
                requirements: { vram: 4, ram: 8, cpu: true, gpu: false },
                isDownloaded: false
            },
            {
                id: 'codellama-7b',
                name: 'Code Llama 7B',
                description: 'Meta\'s code model with excellent understanding',
                size: 4.1 * 1024 * 1024 * 1024, // 4.1GB
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false
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

    public async downloadModel(
        model: ModelInfo,
        progressCallback?: (progress: number) => void
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const task: DownloadTask = {
                model,
                progressCallback,
                resolve,
                reject
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
            const filePath = path.join(this.modelsDir, fileName);

            // Check if model already exists
            if (fs.existsSync(filePath)) {
                task.resolve(filePath);
                return;
            }

            // Simulate download for now - replace with actual download URL
            await this.downloadFile('https://example.com/model.gguf', filePath, task.progressCallback);
            this.logger.info(`Model downloaded successfully: ${task.model.name}`);
            task.resolve(filePath);
        } catch (error: unknown) {
            this.logger.error(`Failed to download model: ${error}`);
            task.reject(error);
        } finally {
            this.isDownloading = false;
            this.processQueue();
        }
    }

    private async downloadFile(url: string, destPath: string, progressCallback?: (progress: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(destPath);

            const request = https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] || '0');
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    file.write(chunk);

                    if (totalSize > 0 && progressCallback) {
                        const progress = (downloadedSize / totalSize) * 100;
                        progressCallback(progress);
                    }
                });

                response.on('end', () => {
                    file.end();
                    resolve();
                });
            });

            request.on('error', (error) => {
                file.close();
                fs.unlinkSync(destPath);
                reject(error);
            });

            file.on('error', (error) => {
                reject(error);
            });
        });
    }

    public async importModel(filePath: string): Promise<ModelInfo> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileExtension = path.extname(filePath).toLowerCase();
        let modelId: string;
        let destPath: string;

        if (fileExtension === '.gguf') {
            // Direct GGUF file import
            const fileName = path.basename(filePath, '.gguf');
            modelId = `imported_${fileName}_${Date.now()}`;
            destPath = path.join(this.modelsDir, `${modelId}.gguf`);

            // Copy file to models directory
            fs.copyFileSync(filePath, destPath);

        } else if (fileExtension === '.tar.gz' || fileExtension === '.tgz') {
            // Extract and import
            const tempDir = path.join(this.modelsDir, 'temp_import');
            fs.mkdirSync(tempDir, { recursive: true });

            await this.extractModel(filePath, tempDir);

            // Look for GGUF files in extracted content
            const extractedFiles = fs.readdirSync(tempDir);
            const ggufFile = extractedFiles.find(f => f.endsWith('.gguf'));

            if (!ggufFile) {
                fs.rmSync(tempDir, { recursive: true });
                throw new Error('No GGUF model file found in the archive');
            }

            modelId = `imported_${path.basename(ggufFile, '.gguf')}_${Date.now()}`;
            destPath = path.join(this.modelsDir, `${modelId}.gguf`);

            fs.renameSync(path.join(tempDir, ggufFile), destPath);
            fs.rmSync(tempDir, { recursive: true });

        } else {
            throw new Error('Unsupported file format. Please provide a .gguf or .tar.gz file');
        }

        const importedModel: ModelInfo = {
            id: modelId,
            name: `Imported: ${path.basename(filePath)}`,
            description: 'User-imported model',
            size: fs.statSync(destPath).size,
            languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'shell'],
            requirements: { vram: 0, ram: Math.ceil(fs.statSync(destPath).size / (1024 * 1024 * 1024)), cpu: true, gpu: false },
            isDownloaded: true
        };

        this.logger.info(`Model imported successfully: ${modelId}`);
        return importedModel;
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
        const filePath = path.join(this.modelsDir, `${modelId}.gguf`);
        return fs.existsSync(filePath) ? filePath : null;
    }

    public cancelDownload(modelId: string): void {
        this.downloadQueue = this.downloadQueue.filter(task => task.model.id !== modelId);
    }

    public getQueueLength(): number {
        return this.downloadQueue.length;
    }
}
