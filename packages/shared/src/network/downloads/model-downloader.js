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
exports.ModelDownloader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
const os = __importStar(require("os"));
// @ts-ignore - tar module types not available
const tar = __importStar(require("tar"));
const logger_1 = require("../../platform/system/logger");
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
class ModelDownloader {
    /**
     * Initialize downloader with target models directory.
     * @param modelsDir Directory to store downloaded models
     */
    constructor(modelsDir) {
        this.modelsDir = modelsDir;
        this.downloadQueue = [];
        this.isDownloading = false;
        this.activeDownloads = new Map();
        this.logger = new logger_1.Logger('ModelDownloader');
        this.safeModelsDir = modelsDir;
        this.ensureModelsDirectory();
    }
    /**
     * Get safe models directory path.
     * Prefers extension global storage, falls back to ~/.inline/models.
     */
    getSafeModelsDirectory() {
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
    ensureModelsDirectory() {
        if (!fs.existsSync(this.safeModelsDir)) {
            fs.mkdirSync(this.safeModelsDir, { recursive: true });
            this.logger.info(`Created safe models directory: ${this.safeModelsDir}`);
        }
    }
    /**
     * Get list of available models for download.
     * Includes metadata, size, and requirements.
     */
    getAvailableModels() {
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
    getDownloadedModels() {
        const availableModels = this.getAvailableModels();
        const downloadedModels = [];
        for (const model of availableModels) {
            const modelPath = this.getModelPath(model.id);
            if (modelPath && fs.existsSync(modelPath)) {
                downloadedModels.push(model);
            }
        }
        return downloadedModels;
    }
    getDownloadProgress(modelId) {
        return this.activeDownloads.get(modelId) || null;
    }
    async downloadModel(model, progressCallback, cancellationToken) {
        return new Promise((resolve, reject) => {
            const task = {
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
    async processQueue() {
        if (this.isDownloading || this.downloadQueue.length === 0) {
            return;
        }
        this.isDownloading = true;
        const task = this.downloadQueue.shift();
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
            const progress = {
                modelId: task.model.id,
                progress: 0,
                downloadedBytes: 0,
                totalBytes: task.model.size,
                speed: 0,
                eta: 0
            };
            this.activeDownloads.set(task.model.id, progress);
            // Real HTTP download
            await this.downloadFile(task.model.downloadUrl, filePath, (progressPercent) => {
                if (task.progressCallback) {
                    task.progressCallback(progressPercent);
                }
            }, task.cancellationToken, progress);
            this.logger.info(`Model downloaded successfully: ${task.model.name}`);
            task.resolve(filePath);
        }
        catch (error) {
            this.logger.error(`Failed to download model: ${error}`);
            task.reject(error);
        }
        finally {
            this.isDownloading = false;
            this.activeDownloads.delete(task.model.id);
            this.processQueue();
        }
    }
    async simulateDownload(progressCallback, cancellationToken, progress) {
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
                    }
                    else {
                        progress.eta = 0;
                    }
                    progressCallback(currentProgress);
                }
                else if (progressCallback) {
                    progressCallback(currentProgress);
                }
                if (currentProgress >= totalSteps) {
                    clearInterval(interval);
                    resolve();
                }
            }, stepDelay);
        });
    }
    async downloadFile(url, destPath, progressCallback, cancellationToken, progress) {
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
                    }
                    else if (totalSize > 0 && progressCallback) {
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
    async importModel(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            const fileExtension = path.extname(filePath).toLowerCase();
            let modelId = `imported_${path.basename(filePath, fileExtension).replace(/[^a-zA-Z0-9]/g, '_')}`;
            let destPath;
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
                    fs.readSync(fd, magicBuffer, 0, 4, 0);
                    fs.closeSync(fd);
                    if (magicBuffer.toString('utf8') !== 'GGUF') {
                        throw new Error('Invalid GGUF file: Magic number mismatch');
                    }
                    destPath = path.join(this.safeModelsDir, `${modelId}.gguf`);
                    // Copy file with progress tracking
                    await this.copyFileWithProgress(filePath, destPath);
                }
                else {
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
                const modelInfo = {
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
            }
            finally {
                // Cleanup temp directory
                if (fs.existsSync(tempDir)) {
                    fs.rmSync(tempDir, { recursive: true, force: true });
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to import model: ${error}`);
            throw error;
        }
    }
    async copyFileWithProgress(src, dest) {
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
    async extractModel(tarPath, extractPath) {
        return new Promise((resolve, reject) => {
            tar.extract({
                file: tarPath,
                cwd: extractPath,
                strip: 1
            }).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            });
        });
    }
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    getModelPath(modelId) {
        const filePath = path.join(this.safeModelsDir, `${modelId}.gguf`);
        return fs.existsSync(filePath) ? filePath : null;
    }
    deleteModel(modelId) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(this.safeModelsDir, `${modelId}.gguf`);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    this.logger.info(`Model deleted successfully: ${modelId}`);
                    resolve();
                }
                catch (error) {
                    this.logger.error(`Failed to delete model: ${error}`);
                    reject(error);
                }
            }
            else {
                reject(new Error(`Model not found: ${modelId}`));
            }
        });
    }
    getModelsDirectorySize() {
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
        }
        catch (error) {
            return 0;
        }
    }
    cancelDownload(modelId) {
        this.downloadQueue = this.downloadQueue.filter(task => task.model.id !== modelId);
    }
    getQueueLength() {
        return this.downloadQueue.length;
    }
}
exports.ModelDownloader = ModelDownloader;
//# sourceMappingURL=model-downloader.js.map