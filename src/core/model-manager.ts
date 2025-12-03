import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.modelsDirectory = path.join(context.globalStorageUri.fsPath, 'models');
        this.initializeModelsDirectory();
        this.loadAvailableModels();
    }

    private async initializeModelsDirectory(): Promise<void> {
        try {
            if (!fs.existsSync(this.modelsDirectory)) {
                fs.mkdirSync(this.modelsDirectory, { recursive: true });
            }
        } catch (error) {
            console.error('Failed to create models directory:', error);
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
                isDownloaded: false
            },
            {
                id: 'stablecode:3b',
                name: 'StableCode 3B',
                size: 3.0 * 1024 * 1024 * 1024, // 3GB
                description: 'Multi-language support with good performance',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go'],
                requirements: { vram: 4, ram: 6, cpu: true, gpu: false },
                isDownloaded: false
            },
            {
                id: 'deepseek-coder:6.7b',
                name: 'DeepSeek Coder 6.7B',
                size: 6.7 * 1024 * 1024 * 1024, // 6.7GB
                description: 'Excellent for complex patterns and scientific computing',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false
            },
            {
                id: 'starcoder2:7b',
                name: 'StarCoder2 7B',
                size: 7.0 * 1024 * 1024 * 1024, // 7GB
                description: 'Strong across multiple programming languages',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go', 'rust', 'php'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false
            },
            {
                id: 'codellama:7b',
                name: 'CodeLlama 7B',
                size: 7.0 * 1024 * 1024 * 1024, // 7GB
                description: 'Meta\'s proven model for enterprise patterns',
                languages: ['python', 'javascript', 'typescript', 'cpp', 'java', 'go'],
                requirements: { vram: 8, ram: 12, cpu: true, gpu: true },
                isDownloaded: false
            }
        ];

        models.forEach(model => {
            this.availableModels.set(model.id, model);
        });

        this.checkDownloadedModels();
    }

    private checkDownloadedModels(): void {
        try {
            const downloaded = fs.readdirSync(this.modelsDirectory);
            downloaded.forEach(modelId => {
                const modelPath = path.join(this.modelsDirectory, modelId);
                if (fs.statSync(modelPath).isDirectory()) {
                    const model = this.availableModels.get(modelId);
                    if (model) {
                        model.isDownloaded = true;
                        model.path = modelPath;
                    }
                }
            });
        } catch (error) {
            console.error('Failed to check downloaded models:', error);
        }
    }

    async downloadModel(modelId: string, progressCallback?: (progress: number) => void): Promise<void> {
        const model = this.availableModels.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found`);
        }

        if (model.isDownloaded) {
            return;
        }

        try {
            const modelPath = path.join(this.modelsDirectory, modelId);
            fs.mkdirSync(modelPath, { recursive: true });

            // Simulate download progress
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                progressCallback?.(i);
            }

            // Create a placeholder file to simulate downloaded model
            const placeholderFile = path.join(modelPath, 'model.gguf');
            fs.writeFileSync(placeholderFile, 'placeholder model data');

            model.isDownloaded = true;
            model.path = modelPath;

            vscode.window.showInformationMessage(`Successfully downloaded ${model.name}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download model: ${error}`);
            throw error;
        }
    }

    async removeModel(modelId: string): Promise<void> {
        const model = this.availableModels.get(modelId);
        if (!model || !model.isDownloaded) {
            return;
        }

        try {
            if (model.path && fs.existsSync(model.path)) {
                fs.rmSync(model.path, { recursive: true, force: true });
            }
            model.isDownloaded = false;
            model.path = undefined;

            if (this.currentModel?.id === modelId) {
                this.currentModel = null;
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
        if (!model || !model.isDownloaded) {
            throw new Error(`Model ${modelId} is not available`);
        }

        this.currentModel = model;
        vscode.window.showInformationMessage(`Switched to ${model.name}`);
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
        // Cleanup resources
        this.currentModel = null;
    }
}
