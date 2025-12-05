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
    parameterCount?: string;
    contextWindow?: number;
    downloadUrl?: string;
}

export interface ModelMetadata {
    architecture?: string;
    parameterCount?: string;
    quantization?: string;
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
        this.modelsDirectory = path.join(os.homedir(), '.inline', 'models');
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

    private async loadAvailableModels(): Promise<void> {
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

        // Await the check so imported models are registered before we try to restore one
        await this.checkDownloadedModels();
        this.restoreLastActiveModel();
    }

    private restoreLastActiveModel(): void {
        const lastModelId = this.context.globalState.get<string>('lastActiveModelId');
        if (lastModelId) {
            const model = this.availableModels.get(lastModelId);
            if (model && model.isDownloaded) {
                // Determine if we should auto-load the engine or just set the current object
                // The user wants it "when active never remveo", so we should probably keep it selected.
                // But loading the engine is heavy.
                // However, updated setCurrentModel loads the engine.
                // Let's just set the reference here and let the user (or warmup) trigger load if needed?
                // OR, effectively "restore" means making it active.

                // If I just set this.currentModel, it's "selected" in UI but not loaded in engine.
                // If I want it to be truly active (ready to gen), I should load it.
                // But forcing a load on startup might be aggressive if the user just wants to see it selected.
                // Wait, the Extension Activation has a warmup block that calls `engine.loadModel(model.path)`.
                // So if I set `this.currentModel` here, the warmup logic in `extension.ts` will pick it up and load it!

                this.currentModel = model;
                this.logger.info(`Restored last active model: ${model.name}`);
            } else {
                // If model no longer exists or isn't downloaded, clear the state
                this.context.globalState.update('lastActiveModelId', undefined);
            }
        }
    }

    public async refreshModels(): Promise<void> {
        await this.checkDownloadedModels();
    }

    private async checkDownloadedModels(): Promise<void> {
        try {
            // 1. Check workspace models first (prioritize local project models)
            await this.checkWorkspaceModels();

            // 2. Check global models directory
            if (fs.existsSync(this.modelsDirectory)) {
                const files = fs.readdirSync(this.modelsDirectory);

                // Check for known models
                this.availableModels.forEach(model => {
                    // Skip if already found in workspace (preserve workspace path)
                    if (model.isDownloaded && model.path && model.path.includes(this.modelsDirectory) === false) {
                        return;
                    }

                    const modelPath = path.join(this.modelsDirectory, `${model.id}.gguf`);
                    if (fs.existsSync(modelPath)) {
                        model.isDownloaded = true;
                        model.path = modelPath;
                    }
                });

                // Check for imported models in global dir
                files.filter(f => f.startsWith('imported_') && f.endsWith('.gguf')).forEach(file => {
                    const modelId = path.basename(file, '.gguf');
                    // Skip if we already have this model from workspace
                    if (this.availableModels.has(modelId) && this.availableModels.get(modelId)?.isDownloaded) {
                        return;
                    }

                    const modelPath = path.join(this.modelsDirectory, file);
                    try {
                        const stats = fs.statSync(modelPath);
                        const name = modelId.replace('imported_', '').replace(/_/g, ' ').replace(/\d+$/, '');

                        const metadata = this.extractModelMetadata(file);

                        this.availableModels.set(modelId, {
                            id: modelId,
                            name: `Imported: ${name}`,
                            description: 'Imported model',
                            size: stats.size,
                            languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'],
                            requirements: { vram: 0, ram: Math.ceil(stats.size / (1024 * 1024 * 1024)) + 2, cpu: true },
                            isDownloaded: true,
                            path: modelPath,
                            architecture: metadata.architecture || 'llama',
                            quantization: metadata.quantization,
                            parameterCount: metadata.parameterCount,
                            contextWindow: 4096
                        });
                    } catch (e) {
                        this.logger.warn(`Failed to stat imported model ${file}: ${e}`);
                    }
                });
            }
        } catch (error) {
            this.logger.error(`Failed to check downloaded models: ${error}`);
        }
    }

    private async checkWorkspaceModels(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        for (const folder of workspaceFolders) {
            try {
                const modelsDir = path.join(folder.uri.fsPath, 'models');
                if (fs.existsSync(modelsDir)) {
                    const files = await fs.promises.readdir(modelsDir);
                    const ggufFiles = files.filter(f => f.endsWith('.gguf'));

                    for (const file of ggufFiles) {
                        const modelPath = path.join(modelsDir, file);
                        const stats = fs.statSync(modelPath);
                        // Use filename as ID, removing extension.
                        // If it matches a known ID (e.g. starcoder2:7b), we map it.
                        // But filenames usually don't have colons.
                        // Let's normalize name: imported_starcoder2_7b_Q4_K_M.gguf -> imported_starcoder2_7b_Q4_K_M

                        let modelId = path.basename(file, '.gguf');

                        // Heuristic: If user is trying to provide a standard model manually
                        // e.g. models/starcoder2-7b.gguf -> map to 'starcoder2:7b' if plausible?
                        // For now, treat workspace models as "Imported" unless they match specific naming convention
                        // preventing conflicts.

                        // Actually, if the user mentioned 'imported_starcoder2_7b_Q4_K_M.gguf', it's likely custom.

                        // Check if we can map to existing model definition
                        // ... (Skipping complex mapping for now, treating as generic or imported)

                        const name = modelId.replace(/_/g, ' ').replace(/-/g, ' ');

                        // If it's already in availableModels (e.g. standard model), update it
                        // This is hard because IDs differ.
                        // Let's add it as a new entry if not found.

                        if (!this.availableModels.has(modelId)) {
                             this.availableModels.set(modelId, {
                                id: modelId,
                                name: `Workspace: ${name}`,
                                description: `Model from ${folder.name}/models`,
                                size: stats.size,
                                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'], // Generic
                                requirements: { vram: 0, ram: Math.ceil(stats.size / (1024 * 1024 * 1024)) + 2, cpu: true },
                                isDownloaded: true,
                                path: modelPath,
                                architecture: 'llama', // Best guess
                                contextWindow: 4096
                            });
                        } else {
                            // Update existing model (if checking repeatedly)
                            const model = this.availableModels.get(modelId)!;
                            model.isDownloaded = true;
                            model.path = modelPath;
                        }
                    }
                }
            } catch (err) {
                this.logger.warn(`Error checking workspace folder ${folder.name} for models: ${err}`);
            }
        }
    }

    async downloadModel(modelId: string, _progressCallback?: (progress: number) => void): Promise<void> {
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
                // Clear persistence
                await this.context.globalState.update('lastActiveModelId', undefined);
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
        // Refresh to find any new models (like workspace ones)
        await this.checkDownloadedModels();

        const model = this.availableModels.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found in registry`);
        }

        if (!model.isDownloaded || !model.path) {
             throw new Error(`Model ${modelId} is not available/downloaded`);
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Loading model ${model.name}...`,
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Initializing engine...' });

                // If switching, unload first
                if (this.currentModel) {
                     await this.inferenceEngine.unloadModel();
                }

                const config = vscode.workspace.getConfiguration('inline');
                const threads = config.get<number>('inference.threads', 4);
                const gpuLayers = config.get<number>('inference.gpuLayers');
                const contextSize = config.get<number>('contextWindow', 4096);

                await this.inferenceEngine.loadModel(model.path!, {
                     threads,
                     gpuLayers,
                     contextSize
                });
                this.currentModel = model;

                // Save persistence
                await this.context.globalState.update('lastActiveModelId', model.id);

                this.logger.info(`Successfully loaded model: ${model.name} from ${model.path}`);
            });

            vscode.window.showInformationMessage(`Switched to ${model.name}`);
        } catch (error) {
            this.logger.error(`Failed to load model ${modelId}: ${error}`);
            vscode.window.showErrorMessage(`Failed to load model: ${error instanceof Error ? error.message : String(error)}`);
            // Ensure we don't leave it in a half-state
            if (this.currentModel?.id === modelId) {
                this.currentModel = null;
                // Don't clear persistence here necessarily, maybe they can retry?
                // But it wasn't loaded successfully, so null is correct.
            }
            throw error;
        }
    }

    async unloadModel(): Promise<void> {
        if (this.currentModel) {
            await this.inferenceEngine.unloadModel();
            this.currentModel = null;
            // Clear persistence
            await this.context.globalState.update('lastActiveModelId', undefined);
            this.logger.info('Model unloaded manually');
            vscode.window.showInformationMessage('Model unloaded');
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

    private extractModelMetadata(filename: string): { architecture?: string; quantization?: string; parameterCount?: string } {
        // Extract metadata from filename patterns like:
        // "imported_starcoder2_7b_Q4_K_M.gguf" -> { architecture: 'starcoder2', quantization: 'Q4_K_M', parameterCount: '7B' }
        // "imported_deepseek_coder_6_7b.gguf" -> { architecture: 'deepseek_coder', parameterCount: '6.7B' }

        const baseName = filename.replace('imported_', '').replace('.gguf', '');
        const parts = baseName.split('_');

        let architecture: string | undefined;
        let quantization: string | undefined;
        let parameterCount: string | undefined;

        // Common quantization patterns
        const quantPatterns = ['Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q8', 'F16', 'F32'];
        const quantParts = parts.filter(part =>
            quantPatterns.some(pattern => part.includes(pattern))
        );

        if (quantParts.length > 0) {
            quantization = quantParts.join('_');
        }

        // Extract parameters (e.g., 7b, 1.5b, 7B)
        // Look for parts ending in 'b' or 'B' that start with a number
        const paramPart = parts.find(part => /^\d+(\.\d+)?[bB]$/.test(part));
        if (paramPart) {
            parameterCount = paramPart.toUpperCase();
        }

        // Try to extract architecture from common patterns
        const archCandidates = parts.filter(part =>
            !part.match(/^\d+$/) && // Not just numbers
            !quantParts.includes(part) && // Not quantization
            part !== paramPart && // Not parameter count
            part.length > 2 // Not too short
        );

        if (archCandidates.length > 0) {
            architecture = archCandidates.join('_');
        }

        return { architecture, quantization, parameterCount };
    }

    cleanup(): void {
        this.inferenceEngine.unloadModel().catch(console.error);
        this.currentModel = null;
    }
}
