import * as vscode from 'vscode';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { ModelInfo } from '../core/model-manager';

export class ModelDownloader {
    private downloadQueue: DownloadTask[] = [];
    private isDownloading: boolean = false;

    constructor(private modelsDir: string) {
        this.ensureModelsDirectory();
    }

    private ensureModelsDirectory(): void {
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
        }
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
            const filePath = await this.downloadFile(task);
            task.resolve(filePath);
        } catch (error) {
            task.reject(error);
        } finally {
            this.isDownloading = false;
            this.processQueue();
        }
    }

    private async downloadFile(task: DownloadTask): Promise<string> {
        const { model, progressCallback } = task;
        const fileName = `${model.id}.gguf`;
        const filePath = path.join(this.modelsDir, fileName);

        // Simulate download for now (replace with actual download URL)
        return new Promise((resolve, reject) => {
            // In production, this would download from Hugging Face or Ollama
            // For now, we'll create a placeholder file
            
            const totalSize = model.size;
            let downloaded = 0;

            const interval = setInterval(() => {
                downloaded += totalSize / 20;
                const progress = Math.min((downloaded / totalSize) * 100, 100);
                
                if (progressCallback) {
                    progressCallback(progress);
                }

                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // Create placeholder file
                    fs.writeFileSync(filePath, `Model: ${model.name}\nSize: ${model.size}`);
                    resolve(filePath);
                }
            }, 100);
        });
    }

    public cancelDownload(modelId: string): void {
        this.downloadQueue = this.downloadQueue.filter(task => task.model.id !== modelId);
    }

    public getQueueLength(): number {
        return this.downloadQueue.length;
    }
}

interface DownloadTask {
    model: ModelInfo;
    progressCallback?: (progress: number) => void;
    resolve: (filePath: string) => void;
    reject: (error: any) => void;
}
