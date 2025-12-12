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
export declare class DownloadManager {
    private tasks;
    private queue;
    private activeDownloads;
    private maxConcurrent;
    private logger;
    constructor(maxConcurrent?: number);
    download(options: DownloadOptions): Promise<string>;
    private processQueue;
    private executeDownload;
    private downloadFile;
    cancelDownload(taskId: string): boolean;
    getProgress(taskId: string): DownloadProgress | null;
    getAllTasks(): DownloadTask[];
    private generateTaskId;
    setMaxConcurrent(max: number): void;
}
//# sourceMappingURL=download-manager.d.ts.map