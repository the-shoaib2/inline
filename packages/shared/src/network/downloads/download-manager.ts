import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { Logger } from '../../platform/system/logger';

export interface DownloadOptions {
    url: string;
    destPath: string;
    onProgress?: (progress: DownloadProgress) => void;
    onComplete?: (filePath: string) => void;
    onError?: (error: Error) => void;
    maxRetries?: number;
    timeout?: number;
}

export interface DownloadProgress {
    downloadedBytes: number;
    totalBytes: number;
    progress: number;
    speed: number;
    eta: number;
    status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
}

export interface DownloadTask {
    id: string;
    options: DownloadOptions;
    progress: DownloadProgress;
    retries: number;
    abortController?: AbortController;
}

export class DownloadManager {
    private tasks: Map<string, DownloadTask>;
    private queue: string[];
    private activeDownloads: Set<string>;
    private maxConcurrent: number;
    private logger: Logger;

    constructor(maxConcurrent: number = 2) {
        this.tasks = new Map();
        this.queue = [];
        this.activeDownloads = new Set();
        this.maxConcurrent = maxConcurrent;
        this.logger = new Logger('DownloadManager');
    }

    public async download(options: DownloadOptions): Promise<string> {
        const taskId = this.generateTaskId(options.url);

        // Check if already downloading
        if (this.tasks.has(taskId)) {
            throw new Error('Download already in progress');
        }

        const task: DownloadTask = {
            id: taskId,
            options,
            progress: {
                downloadedBytes: 0,
                totalBytes: 0,
                progress: 0,
                speed: 0,
                eta: 0,
                status: 'pending'
            },
            retries: 0
        };

        this.tasks.set(taskId, task);
        this.queue.push(taskId);

        this.processQueue();

        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                const currentTask = this.tasks.get(taskId);
                if (!currentTask) {
                    clearInterval(checkInterval);
                    reject(new Error('Task not found'));
                    return;
                }

                if (currentTask.progress.status === 'completed') {
                    clearInterval(checkInterval);
                    this.tasks.delete(taskId);
                    resolve(options.destPath);
                } else if (currentTask.progress.status === 'failed') {
                    clearInterval(checkInterval);
                    this.tasks.delete(taskId);
                    reject(new Error('Download failed'));
                }
            }, 100);
        });
    }

    private async processQueue(): Promise<void> {
        while (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
            const taskId = this.queue.shift();
            if (!taskId) continue;

            const task = this.tasks.get(taskId);
            if (!task) continue;

            this.activeDownloads.add(taskId);
            this.executeDownload(task).catch(error => {
                this.logger.error(`Download failed for ${taskId}: ${error}`);
            });
        }
    }

    private async executeDownload(task: DownloadTask): Promise<void> {
        const { options } = task;
        const maxRetries = options.maxRetries || 3;

        while (task.retries < maxRetries) {
            try {
                task.progress.status = 'downloading';
                await this.downloadFile(task);
                task.progress.status = 'completed';

                if (options.onComplete) {
                    options.onComplete(options.destPath);
                }

                this.activeDownloads.delete(task.id);
                this.processQueue();
                return;
            } catch (error) {
                task.retries++;
                this.logger.warn(`Download attempt ${task.retries}/${maxRetries} failed: ${error}`);

                if (task.retries >= maxRetries) {
                    task.progress.status = 'failed';

                    if (options.onError) {
                        options.onError(error as Error);
                    }

                    this.activeDownloads.delete(task.id);
                    this.processQueue();
                    throw error;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * task.retries));
            }
        }
    }

    private async downloadFile(task: DownloadTask): Promise<void> {
        const { options } = task;
        const url = new URL(options.url);
        const protocol = url.protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
            // Ensure destination directory exists
            const destDir = path.dirname(options.destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            const file = fs.createWriteStream(options.destPath);
            const startTime = Date.now();
            let lastUpdateTime = startTime;

            const request = protocol.get(options.url, {
                timeout: options.timeout || 30000
            }, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    // Handle redirects
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        file.close();
                        fs.unlinkSync(options.destPath);
                        options.url = redirectUrl;
                        this.downloadFile(task).then(resolve).catch(reject);
                        return;
                    }
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(options.destPath);
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
                task.progress.totalBytes = totalBytes;

                response.on('data', (chunk: Buffer) => {
                    task.progress.downloadedBytes += chunk.length;
                    file.write(chunk);

                    const currentTime = Date.now();
                    const timeDiff = (currentTime - lastUpdateTime) / 1000;

                    if (timeDiff >= 0.5) {
                        const elapsedSeconds = (currentTime - startTime) / 1000;
                        task.progress.speed = task.progress.downloadedBytes / elapsedSeconds;
                        task.progress.progress = totalBytes > 0
                            ? (task.progress.downloadedBytes / totalBytes) * 100
                            : 0;

                        if (task.progress.speed > 0 && totalBytes > task.progress.downloadedBytes) {
                            task.progress.eta = (totalBytes - task.progress.downloadedBytes) / task.progress.speed;
                        }

                        if (options.onProgress) {
                            options.onProgress({ ...task.progress });
                        }

                        lastUpdateTime = currentTime;
                    }
                });

                response.on('end', () => {
                    file.end();
                    task.progress.progress = 100;

                    if (options.onProgress) {
                        options.onProgress({ ...task.progress });
                    }

                    resolve();
                });

                response.on('error', (error) => {
                    file.close();
                    if (fs.existsSync(options.destPath)) {
                        fs.unlinkSync(options.destPath);
                    }
                    reject(error);
                });
            });

            request.on('error', (error) => {
                file.close();
                if (fs.existsSync(options.destPath)) {
                    fs.unlinkSync(options.destPath);
                }
                reject(error);
            });

            request.on('timeout', () => {
                request.destroy();
                file.close();
                if (fs.existsSync(options.destPath)) {
                    fs.unlinkSync(options.destPath);
                }
                reject(new Error('Download timeout'));
            });
        });
    }

    public cancelDownload(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;

        if (task.abortController) {
            task.abortController.abort();
        }

        task.progress.status = 'failed';
        this.activeDownloads.delete(taskId);
        this.tasks.delete(taskId);

        // Remove from queue if pending
        const queueIndex = this.queue.indexOf(taskId);
        if (queueIndex > -1) {
            this.queue.splice(queueIndex, 1);
        }

        this.processQueue();
        return true;
    }

    public getProgress(taskId: string): DownloadProgress | null {
        const task = this.tasks.get(taskId);
        return task ? { ...task.progress } : null;
    }

    public getAllTasks(): DownloadTask[] {
        return Array.from(this.tasks.values());
    }

    private generateTaskId(url: string): string {
        return `download_${Date.now()}_${url.split('/').pop()}`;
    }

    public setMaxConcurrent(max: number): void {
        this.maxConcurrent = max;
        this.processQueue();
    }
}
