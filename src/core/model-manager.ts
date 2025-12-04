import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LlamaInference } from './llama-inference';
import { Logger } from '../utils/logger';

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
    contextWindow?: number;
    downloadUrl?: string;
}

export interface ModelRequirements {
    language?: string;
    maxVRAM?: number;
    maxRAM?: number;
    preferGPU?: boolean;
    speed?: 'fast' | 'balanced' | 'quality';
}

export class ModelManager {
    private context: vscode.ExtensionContext;
    private modelsDirectory: string;
    private availableModels: Map<string, ModelInfo> = new Map();
    private currentModel: ModelInfo | null = null;
    private inferenceEngine: LlamaInference;
    private logger: Logger;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.logger = new Logger('ModelManager');
        this.modelsDirectory = path.join(context.globalStorageUri.fsPath, 'models');
        this.inferenceEngine = new LlamaInference();
        this.initializeModelsDirectory();
        this.loadAvailableModels();
    }

    private async initializeModelsDirectory(): Promise<void> {
        try {
            if (!fs.existsSync(this.modelsDirectory)) {
                fs.mkdirSync(this.modelsDirectory, { recursive: true });
            }
        } catch (error) {
            this.logger.error(`Failed to create models directory: ${error}`);
        }
    }

    private loadAvailableModels(): void {
        const models: ModelInfo[] = [
            {
                id: 'codegemma:2b',
                name: 'CodeGemma 2B',
                size: 1.6 * 1024 * 1024 * 1024, // 1.6GB
                description: 'Fast and efficient model for Python/JavaScript',
                languages: ['python', 'javascript', 'typescript'],
                requirements: { vram: 2, ram: 4, cpu: true, gpu: false },
                isDownloaded: false,
                architecture: 'gemma',
                contextWindow: 8192
            },
            {
                id: 'stablecode:3b',
                name: 'StableCode 3B',
                size: 3.0 * 1024 * 1024 * 1024, // 3GB
                description: 'Multi-language support with good performance',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go'],
                requirements: { vram: 4, ram: 6, cpu: true, gpu: false },
                isDownloaded: false,
                architecture: 'stablelm',
                contextWindow: 16384
            },
            {
                id: 'deepseek-coder:6.7b',
                name: 'DeepSeek Coder 6.7B',
                size: 6.7 * 1024 * 1024 * 1024, // 6.7GB
                description: 'Excellent for complex patterns and scientific computing',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false,
                architecture: 'llama',
                contextWindow: 16384
            },
            {
                id: 'starcoder2:7b',
                name: 'StarCoder2 7B',
                size: 7.0 * 1024 * 1024 * 1024, // 7GB
                description: 'Strong across multiple programming languages',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'php'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false,
                architecture: 'starcoder2',
                contextWindow: 16384
            },
            {
                id: 'codellama:7b',
                name: 'CodeLlama 7B',
                size: 7.0 * 1024 * 1024 * 1024, // 7GB
                description: 'Meta\'s proven model for enterprise patterns',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false,
                architecture: 'llama',
                contextWindow: 16384
            }
        ];

        models.forEach(model => {
            this.availableModels.set(model.id, model);
        });

        this.checkDownloadedModels();
    }

    private checkDownloadedModels(): void {
        try {
            if (!fs.existsSync(this.modelsDirectory)) return;

            const files = fs.readdirSync(this.modelsDirectory);

            // Check for known models
            this.availableModels.forEach(model => {
                const modelPath = path.join(this.modelsDirectory, `${model.id}.gguf`);
                if (fs.existsSync(modelPath)) {
                    model.isDownloaded = true;
                    model.path = modelPath;
                }
            });

            // Check for imported models
            files.filter(f => f.startsWith('imported_') && f.endsWith('.gguf')).forEach(file => {
                const modelId = path.basename(file, '.gguf');
                const modelPath = path.join(this.modelsDirectory, file);
                const stats = fs.statSync(modelPath);

                if (!this.availableModels.has(modelId)) {
                    const name = modelId.replace('imported_', '').replace(/_/g, ' ').replace(/\d+$/, '');
                    this.availableModels.set(modelId, {
                        id: modelId,
                        name: `Imported: ${name}`,
                        description: 'User imported model',
                        size: stats.size,
                        languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'],
                        requirements: { vram: 0, ram: Math.ceil(stats.size / (1024 * 1024 * 1024)) + 2, cpu: true },
                        isDownloaded: true,
                        path: modelPath,
                        architecture: 'llama', // Assumed
                        contextWindow: 4096
                    });
                }
            });
        } catch (error) {
            this.logger.error(`Failed to check downloaded models: ${error}`);
        }
    }

    async downloadModel(modelId: string, progressCallback?: (progress: number) => void): Promise<void> {
        // This is mainly a metadata update wrapper now, actual download happens in ModelDownloader
        const model = this.availableModels.get(modelId);
        if (!model) {
            // Might be a newly imported model
            this.checkDownloadedModels();
            if (!this.availableModels.has(modelId)) {
                throw new Error(`Model ${modelId} not found`);
            }
            return;
        }

        if (model.isDownloaded) {
            return;
        }

        // Verify file exists
        const modelPath = path.join(this.modelsDirectory, `${modelId}.gguf`);
        if (fs.existsSync(modelPath)) {
            model.isDownloaded = true;
            model.path = modelPath;
            vscode.window.showInformationMessage(`Model ${model.name} is ready`);
        }
    }

    async removeModel(modelId: string): Promise<void> {
        const model = this.availableModels.get(modelId);
        if (!model || !model.isDownloaded) {
            return;
        }

        try {
            // Unload if current
            if (this.currentModel?.id === modelId) {
                await this.inferenceEngine.unloadModel();
                this.currentModel = null;
            }

            // File deletion handled by ModelDownloader
            model.isDownloaded = false;
            model.path = undefined;

            // If it was an imported model, remove from map
            if (modelId.startsWith('imported_')) {
                this.availableModels.delete(modelId);
            }

            vscode.window.showInformationMessage(`Successfully removed ${model.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove model: ${error}`);
            throw error;
        }
    }

    getBestModel(requirements: ModelRequirements): ModelInfo | null {
        const availableModels = Array.from(this.availableModels.values())
            .filter(model => model.isDownloaded);

        if (availableModels.length === 0) {
            return null;
        }

        // Filter by language if specified
        let candidates = availableModels;
        if (requirements.language) {
            candidates = availableModels.filter(model =>
                model.languages.includes(requirements.language!)
            );
        }

        // If no models match language, use all available models
        if (candidates.length === 0) {
            candidates = availableModels;
        }

        // Sort by preference (smaller, faster models first)
        candidates.sort((a, b) => {
            if (requirements.speed === 'fast') {
                return a.size - b.size;
            } else if (requirements.speed === 'quality') {
                return b.size - a.size;
            }
            return Math.abs(a.size - 4 * 1024 * 1024 * 1024) - Math.abs(b.size - 4 * 1024 * 1024 * 1024);
        });

        return candidates[0];
    }

    async setCurrentModel(modelId: string): Promise<void> {
        const model = this.availableModels.get(modelId);
        if (!model || !model.isDownloaded || !model.path) {
            throw new Error(`Model ${modelId} is not available`);
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Loading model ${model.name}...`,
                cancellable: false
            }, async () => {
                await this.inferenceEngine.loadModel(model.path!);
                this.currentModel = model;
            });

            vscode.window.showInformationMessage(`Switched to ${model.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load model: ${error}`);
            throw error;
        }
    }

    getCurrentModel(): ModelInfo | null {
        return this.currentModel;
    }

    getAllModels(): ModelInfo[] {
        return Array.from(this.availableModels.values());
    }

    getDownloadedModels(): ModelInfo[] {
        return Array.from(this.availableModels.values()).filter(model => model.isDownloaded);
    }

    validateModel(modelPath: string): boolean {
        try {
            return fs.existsSync(modelPath) && fs.statSync(modelPath).isFile();
        } catch {
            return false;
        }
    }

    getInferenceEngine(): LlamaInference {
        return this.inferenceEngine;
    }

    async optimizeModel(language: string): Promise<void> {
        // TODO: Implement model optimization for specific languages
        vscode.window.showInformationMessage(`Optimizing model for ${language}...`);
    }

    monitorResources(): { vram: number; ram: number; cpu: number } {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        return {
            vram: 0, // TODO: Implement VRAM monitoring
            ram: usedMemory / totalMemory,
            cpu: os.loadavg()[0] / os.cpus().length
        };
    }

    cleanup(): void {
        this.inferenceEngine.unloadModel().catch(console.error);
        this.currentModel = null;
    }
}
