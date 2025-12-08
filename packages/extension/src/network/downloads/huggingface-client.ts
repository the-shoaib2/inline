import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as crypto from 'crypto';
import { Logger } from '@platform/system/logger';

/**
 * HuggingFace model metadata from the Hub API.
 */
export interface HFModelInfo {
    id: string;
    modelId: string;
    author: string;
    downloads: number;
    likes: number;
    tags: string[];
    pipeline_tag?: string;
    library_name?: string;
}

/**
 * Model file information from HuggingFace repository.
 */
export interface HFModelFile {
    filename: string;
    size: number;
    sha256?: string;
    downloadUrl: string;
}

/**
 * Download progress callback.
 */
export interface DownloadProgress {
    downloaded: number;
    total: number;
    percentage: number;
    speed: number; // bytes per second
}

/**
 * Client for interacting with HuggingFace Hub API.
 * 
 * Features:
 * - Search models by query and filters
 * - Download GGUF models directly
 * - Resume interrupted downloads
 * - Verify checksums (SHA256)
 * - Progress tracking
 * - Model metadata caching
 */
export class HuggingFaceClient {
    private logger: Logger;
    private readonly HF_API_BASE = 'https://huggingface.co';
    private readonly HF_API_ENDPOINT = 'https://huggingface.co/api';

    constructor() {
        this.logger = new Logger('HuggingFaceClient');
    }

    /**
     * Search for models on HuggingFace Hub.
     * @param query Search query
     * @param filters Optional filters (e.g., { library: 'gguf', tags: ['code'] })
     * @returns Array of model info
     */
    async searchModels(query: string, filters?: {
        library?: string;
        tags?: string[];
        author?: string;
        limit?: number;
    }): Promise<HFModelInfo[]> {
        try {
            const params = new URLSearchParams();
            params.append('search', query);
            
            if (filters?.library) {
                params.append('filter', `library:${filters.library}`);
            }
            if (filters?.tags) {
                filters.tags.forEach(tag => params.append('filter', `tag:${tag}`));
            }
            if (filters?.author) {
                params.append('filter', `author:${filters.author}`);
            }
            if (filters?.limit) {
                params.append('limit', filters.limit.toString());
            }

            const url = `${this.HF_API_ENDPOINT}/models?${params.toString()}`;
            this.logger.info(`Searching models: ${url}`);

            const response = await this.httpGet(url);
            const models = JSON.parse(response) as HFModelInfo[];
            
            this.logger.info(`Found ${models.length} models`);
            return models;
        } catch (error) {
            this.logger.error(`Failed to search models: ${error}`);
            throw new Error(`HuggingFace search failed: ${error}`);
        }
    }

    /**
     * Get model information from HuggingFace.
     * @param repoId Repository ID (e.g., "TheBloke/deepseek-coder-6.7B-instruct-GGUF")
     * @returns Model information
     */
    async getModelInfo(repoId: string): Promise<HFModelInfo> {
        try {
            const url = `${this.HF_API_ENDPOINT}/models/${repoId}`;
            const response = await this.httpGet(url);
            return JSON.parse(response) as HFModelInfo;
        } catch (error) {
            this.logger.error(`Failed to get model info for ${repoId}: ${error}`);
            throw new Error(`Failed to get model info: ${error}`);
        }
    }

    /**
     * List files in a HuggingFace repository.
     * @param repoId Repository ID
     * @param filter Optional file filter (e.g., ".gguf")
     * @returns Array of model files
     */
    async listModelFiles(repoId: string, filter?: string): Promise<HFModelFile[]> {
        try {
            const url = `${this.HF_API_ENDPOINT}/models/${repoId}/tree/main`;
            const response = await this.httpGet(url);
            const files = JSON.parse(response) as Array<{ path: string; size: number; lfs?: { sha256?: string } }>;

            const modelFiles: HFModelFile[] = files
                .filter(f => !filter || f.path.endsWith(filter))
                .map(f => ({
                    filename: f.path,
                    size: f.size,
                    sha256: f.lfs?.sha256,
                    downloadUrl: `${this.HF_API_BASE}/${repoId}/resolve/main/${f.path}`
                }));

            this.logger.info(`Found ${modelFiles.length} files in ${repoId}`);
            return modelFiles;
        } catch (error) {
            this.logger.error(`Failed to list files for ${repoId}: ${error}`);
            throw new Error(`Failed to list model files: ${error}`);
        }
    }

    /**
     * Download a model file from HuggingFace.
     * @param repoId Repository ID
     * @param filename File name to download
     * @param destination Local destination path
     * @param progressCallback Optional progress callback
     * @returns Promise that resolves when download is complete
     */
    async downloadModel(
        repoId: string,
        filename: string,
        destination: string,
        progressCallback?: (progress: DownloadProgress) => void
    ): Promise<void> {
        const url = `${this.HF_API_BASE}/${repoId}/resolve/main/${filename}`;
        this.logger.info(`Downloading ${filename} from ${repoId} to ${destination}`);

        return new Promise((resolve, reject) => {
            // Ensure destination directory exists
            const destDir = path.dirname(destination);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }

            // Check if file already exists and get size for resume
            let downloadedBytes = 0;
            if (fs.existsSync(destination)) {
                const stats = fs.statSync(destination);
                downloadedBytes = stats.size;
                this.logger.info(`Resuming download from ${downloadedBytes} bytes`);
            }

            const file = fs.createWriteStream(destination, { flags: downloadedBytes > 0 ? 'a' : 'w' });
            const startTime = Date.now();

            const options = {
                headers: downloadedBytes > 0 ? { 'Range': `bytes=${downloadedBytes}-` } : {}
            };

            https.get(url, options, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Follow redirect
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        reject(new Error('Redirect location not found'));
                        return;
                    }

                    https.get(redirectUrl, (redirectResponse) => {
                        this.handleDownloadResponse(
                            redirectResponse,
                            file,
                            downloadedBytes,
                            startTime,
                            progressCallback,
                            resolve,
                            reject
                        );
                    }).on('error', reject);
                } else {
                    this.handleDownloadResponse(
                        response,
                        file,
                        downloadedBytes,
                        startTime,
                        progressCallback,
                        resolve,
                        reject
                    );
                }
            }).on('error', (error) => {
                file.close();
                reject(error);
            });
        });
    }

    private handleDownloadResponse(
        response: any,
        file: fs.WriteStream,
        downloadedBytes: number,
        startTime: number,
        progressCallback: ((progress: DownloadProgress) => void) | undefined,
        resolve: () => void,
        reject: (error: Error) => void
    ): void {
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10) + downloadedBytes;
        let currentBytes = downloadedBytes;

        response.on('data', (chunk: Buffer) => {
            currentBytes += chunk.length;
            file.write(chunk);

            if (progressCallback && totalBytes > 0) {
                const elapsed = (Date.now() - startTime) / 1000; // seconds
                const speed = currentBytes / elapsed;
                progressCallback({
                    downloaded: currentBytes,
                    total: totalBytes,
                    percentage: (currentBytes / totalBytes) * 100,
                    speed
                });
            }
        });

        response.on('end', () => {
            file.end();
            this.logger.info(`Download complete: ${currentBytes} bytes`);
            resolve();
        });

        response.on('error', (error: Error) => {
            file.close();
            reject(error);
        });
    }

    /**
     * Verify file checksum.
     * @param filePath Path to file
     * @param expectedHash Expected SHA256 hash
     * @returns True if checksum matches
     */
    async verifyChecksum(filePath: string, expectedHash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('data', (data) => hash.update(data as any));
            stream.on('end', () => {
                const fileHash = hash.digest('hex');
                const matches = fileHash.toLowerCase() === expectedHash.toLowerCase();
                
                if (matches) {
                    this.logger.info(`Checksum verified for ${filePath}`);
                } else {
                    this.logger.warn(`Checksum mismatch for ${filePath}: expected ${expectedHash}, got ${fileHash}`);
                }
                
                resolve(matches);
            });
            stream.on('error', reject);
        });
    }

    /**
     * Download model with VS Code progress UI.
     * @param repoId Repository ID
     * @param filename File name
     * @param destination Destination path
     * @returns Promise that resolves when download is complete
     */
    async downloadWithProgress(
        repoId: string,
        filename: string,
        destination: string
    ): Promise<void> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading ${filename}`,
            cancellable: false
        }, async (progress) => {
            await this.downloadModel(repoId, filename, destination, (p) => {
                const speedMB = (p.speed / (1024 * 1024)).toFixed(2);
                progress.report({
                    message: `${p.percentage.toFixed(1)}% (${speedMB} MB/s)`,
                    increment: p.percentage
                });
            });
        });
    }

    /**
     * Simple HTTP GET request.
     * @param url URL to fetch
     * @returns Response body as string
     */
    private httpGet(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}: ${data}`));
                    }
                });
            }).on('error', reject);
        });
    }
}
