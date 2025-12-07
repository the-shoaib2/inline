import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { LlamaInference } from './llama-inference';
import { Logger } from '../system/logger';

/**
 * Metadata for a code completion model.
 * Includes size, language support, resource requirements, and FIM template info.
 */
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
    fimTemplate?: string;
}

/**
 * Extracted metadata from model filenames or registry.
 */
export interface ModelMetadata {
    architecture?: string;
    parameterCount?: string;
    quantization?: string;
}

/**
 * Constraints for selecting the best model for a given task.
 */
export interface ModelRequirements {
    language?: string;
    maxVRAM?: number;
    maxRAM?: number;
    preferGPU?: boolean;
    speed?: 'fast' | 'balanced' | 'quality';
}

/**
 * Manages model lifecycle: discovery, loading, switching, and cleanup.
 *
 * Responsibilities:
 * - Load model registry from JSON and discover downloaded models
 * - Track workspace-local and global models
 * - Persist last active model across sessions
 * - Load/unload models with progress feedback
 * - Select best model based on language and resource constraints
 * - Extract metadata from model filenames
 */
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

        // Resolve models directory from config or use default ~/.inline/models
        const config = vscode.workspace.getConfiguration('inline');
        const customPath = config.get<string>('modelPath');

        if (customPath && customPath.trim().length > 0) {
            this.modelsDirectory = customPath;
        } else {
            this.modelsDirectory = path.join(os.homedir(), '.inline', 'models');
        }

        this.inferenceEngine = new LlamaInference();
        this.initializeModelsDirectory();
        this.loadAvailableModels();

        // Watch for model path changes and refresh discovery
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('inline.modelPath')) {
                const newConfig = vscode.workspace.getConfiguration('inline');
                const newPath = newConfig.get<string>('modelPath');
                if (newPath && newPath !== this.modelsDirectory) {
                    this.modelsDirectory = newPath;
                    this.initializeModelsDirectory();
                    this.refreshModels();
                }
            }
        });
    }

    /**
     * Create models directory if it doesn't exist.
     */
    private async initializeModelsDirectory(): Promise<void> {
        try {
            if (!fs.existsSync(this.modelsDirectory)) {
                fs.mkdirSync(this.modelsDirectory, { recursive: true });
            }
        } catch (error) {
            this.logger.error(`Failed to create models directory: ${error}`);
        }
    }

    /**
     * Load model registry from JSON and discover downloaded models.
     * Restores last active model if it's still available.
     */
    private async loadAvailableModels(): Promise<void> {
        try {
            // Load predefined models from extension registry
            const registryPath = path.join(this.context.extensionPath, 'src', 'resources', 'models.json');

            if (fs.existsSync(registryPath)) {
                const content = fs.readFileSync(registryPath, 'utf8');
                const models = JSON.parse(content) as ModelInfo[];

                models.forEach(model => {
                    this.availableModels.set(model.id, model);
                });
            } else {
                this.logger.warn(`Models registry not found at ${registryPath}`);
            }
        } catch (error) {
            this.logger.error(`Failed to load model registry: ${error}`);
        }

        // Discover downloaded and imported models
        await this.checkDownloadedModels();
        this.restoreLastActiveModel();
    }

    /**
     * Restore the last active model from persistent state.
     * Sets currentModel reference; actual engine loading is deferred to warmup phase.
     */
    private restoreLastActiveModel(): void {
        const lastModelId = this.context.globalState.get<string>('lastActiveModelId');
        if (lastModelId) {
            const model = this.availableModels.get(lastModelId);
            if (model && model.isDownloaded) {
                // Set reference only; extension warmup will trigger engine load if needed
                this.currentModel = model;
                this.logger.info(`Restored last active model: ${model.name}`);
            } else {
                // Clear stale state if model no longer exists or isn't downloaded
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
                            contextWindow: 4096,
                            fimTemplate: metadata.architecture // Heuristic: arch often maps to template
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

                        const modelId = path.basename(file, '.gguf');

                        // Workspace models are treated as imported unless they match standard naming
                        const name = modelId.replace(/_/g, ' ').replace(/-/g, ' ');

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

    /**
     * Load a model into the inference engine with progress feedback.
     * Unloads previous model if switching. Persists selection across sessions.
     *
     * @throws Error if model not found or loading fails
     */
    async setCurrentModel(modelId: string): Promise<void> {
        // Refresh to discover any newly added models
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

                // Unload previous model to free resources
                if (this.currentModel) {
                     await this.inferenceEngine.unloadModel();
                }

                // Read inference configuration
                const config = vscode.workspace.getConfiguration('inline');
                const threads = config.get<number>('inference.threads', 4);
                const gpuLayers = config.get<number>('inference.gpuLayers');
                const contextSize = config.get<number>('contextWindow', 4096);

                // Load model with configured parameters
                await this.inferenceEngine.loadModel(model.path!, {
                     threads,
                     gpuLayers,
                     contextSize
                });
                this.currentModel = model;

                // Persist selection for next session
                await this.context.globalState.update('lastActiveModelId', model.id);

                this.logger.info(`Successfully loaded model: ${model.name} from ${model.path}`);
            });

            vscode.window.showInformationMessage(`Switched to ${model.name}`);
        } catch (error) {
            this.logger.error(`Failed to load model ${modelId}: ${error}`);
            vscode.window.showErrorMessage(`Failed to load model: ${error instanceof Error ? error.message : String(error)}`);
            // Clear reference on failure to avoid stale state
            if (this.currentModel?.id === modelId) {
                this.currentModel = null;
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

    /**
     * Get the FIM template ID for the current model based on heuristics
     */
    getFimTemplateId(): string {
        // 1. Check for manual user override in settings (Universal Support)
        const config = vscode.workspace.getConfiguration('inline');
        const customFim = config.get<{prefix: string, suffix: string, middle: string}>('fim');
        if (customFim && customFim.prefix) {
            // If user defined a custom FIM, we return a special ID
            // But wait, the context engine needs to know the TOKENS, not just ID.
            // Problem: ID maps to hardcoded tokens.
            // Solution: We should extend ContextEngine to accept dynamic tokens OR map 'custom' to user settings.
            // Better: ModelManager returns ID 'custom', passing config is hard via just ID.
            // Actually, simplest is to check config HERE, but ContextEngine needs the tokens.
            // Okay, let's keep it simple: If config exists, we can't just return 'custom' unless ContextEngine reads config.
            // Let's assume ContextEngine will read config for 'custom' ID or we pass it.
            // For now, let's stick to auto-detection and handle custom in next step if needed.
            // Actually, the user asked for "custom settings".
            // I will implement 'custom' ID and update ContextEngine to read settings for it.
            return 'custom';
        }

        if (!this.currentModel) return 'default';

        // Check if model has explicit FIM template defined in JSON
        if (this.currentModel.fimTemplate) {
            return this.currentModel.fimTemplate;
        }

        const rawString = (this.currentModel.id + this.currentModel.name + (this.currentModel.path || '')).toLowerCase();

        // Heuristics for all major models
        if (rawString.includes('deepseek')) return 'deepseek';
        if (rawString.includes('codestral') || rawString.includes('mistral')) return 'codestral';
        if (rawString.includes('codegemma') || rawString.includes('gemma')) return 'codegemma';
        if (rawString.includes('qwen')) return 'qwen';
        if (rawString.includes('yi-') || rawString.includes('yi_')) return 'yi';
        if (rawString.includes('starcoder')) return 'starcoder';
        if (rawString.includes('codellama')) return 'codellama';
        if (rawString.includes('stable')) return 'stable-code';

        return 'default';
    }

    cleanup(): void {
        this.inferenceEngine.unloadModel().catch(console.error);
        this.currentModel = null;
    }
}
