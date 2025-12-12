"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const url_1 = require("url");
const logger_1 = require("../../platform/system/logger");
class DownloadManager {
    constructor(maxConcurrent = 2) {
        this.tasks = new Map();
        this.queue = [];
        this.activeDownloads = new Set();
        this.maxConcurrent = maxConcurrent;
        this.logger = new logger_1.Logger('DownloadManager');
    }
    async download(options) {
        const taskId = this.generateTaskId(options.url);
        // Check if already downloading
        if (this.tasks.has(taskId)) {
            throw new Error('Download already in progress');
        }
        const task = {
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
                }
                else if (currentTask.progress.status === 'failed') {
                    clearInterval(checkInterval);
                    this.tasks.delete(taskId);
                    reject(new Error('Download failed'));
                }
            }, 100);
        });
    }
    async processQueue() {
        while (this.queue.length > 0 && this.activeDownloads.size < this.maxConcurrent) {
            const taskId = this.queue.shift();
            if (!taskId)
                continue;
            const task = this.tasks.get(taskId);
            if (!task)
                continue;
            this.activeDownloads.add(taskId);
            this.executeDownload(task).catch(error => {
                this.logger.error(`Download failed for ${taskId}: ${error}`);
            });
        }
    }
    async executeDownload(task) {
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
            }
            catch (error) {
                task.retries++;
                this.logger.warn(`Download attempt ${task.retries}/${maxRetries} failed: ${error}`);
                if (task.retries >= maxRetries) {
                    task.progress.status = 'failed';
                    if (options.onError) {
                        options.onError(error);
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
    async downloadFile(task) {
        const { options } = task;
        const url = new url_1.URL(options.url);
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
                response.on('data', (chunk) => {
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
    cancelDownload(taskId) {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
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
    getProgress(taskId) {
        const task = this.tasks.get(taskId);
        return task ? { ...task.progress } : null;
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    generateTaskId(url) {
        return `download_${Date.now()}_${url.split('/').pop()}`;
    }
    setMaxConcurrent(max) {
        this.maxConcurrent = max;
        this.processQueue();
    }
}
exports.DownloadManager = DownloadManager;
//# sourceMappingURL=download-manager.js.map