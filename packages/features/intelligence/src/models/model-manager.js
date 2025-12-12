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
exports.ModelManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const llama_engine_1 = require("../engines/llama-engine");
const shared_1 = require("@inline/shared");
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
class ModelManager {
    constructor(context) {
        this.availableModels = new Map();
        this.currentModel = null;
        this.context = context;
        this.logger = new shared_1.Logger('ModelManager');
        // Resolve models directory from config or use default ~/.inline/models
        const config = vscode.workspace.getConfiguration('inline');
        const customPath = config.get('modelPath');
        if (customPath && customPath.trim().length > 0) {
            this.modelsDirectory = customPath;
        }
        else {
            this.modelsDirectory = path.join(os.homedir(), '.inline', 'models');
        }
        this.inferenceEngine = new llama_engine_1.LlamaInference();
        this.initializeModelsDirectory();
        this.loadAvailableModels();
        // Watch for model path changes and refresh discovery
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('inline.modelPath')) {
                const newConfig = vscode.workspace.getConfiguration('inline');
                const newPath = newConfig.get('modelPath');
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
    async initializeModelsDirectory() {
        try {
            if (!fs.existsSync(this.modelsDirectory)) {
                fs.mkdirSync(this.modelsDirectory, { recursive: true });
            }
        }
        catch (error) {
            this.logger.error(`Failed to create models directory: ${error}`);
        }
    }
    /**
     * Load model registry from JSON and discover downloaded models.
     * Restores last active model if it's still available.
     */
    async loadAvailableModels() {
        try {
            // Load predefined models from extension registry
            const registryPath = path.join(this.context.extensionPath, 'src', 'resources', 'models.json');
            if (fs.existsSync(registryPath)) {
                const content = fs.readFileSync(registryPath, 'utf8');
                const models = JSON.parse(content);
                models.forEach(model => {
                    this.availableModels.set(model.id, model);
                });
            }
            else {
                this.logger.warn(`Models registry not found at ${registryPath}`);
            }
        }
        catch (error) {
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
    restoreLastActiveModel() {
        const lastModelId = this.context.globalState.get('lastActiveModelId');
        if (lastModelId) {
            const model = this.availableModels.get(lastModelId);
            if (model && model.isDownloaded) {
                // Set reference only; extension warmup will trigger engine load if needed
                this.currentModel = model;
                this.logger.info(`Restored last active model: ${model.name}`);
            }
            else {
                // Clear stale state if model no longer exists or isn't downloaded
                this.context.globalState.update('lastActiveModelId', undefined);
            }
        }
    }
    async refreshModels() {
        await this.checkDownloadedModels();
    }
    async checkDownloadedModels() {
        try {
            // Run workspace and global checks in parallel for better performance
            await Promise.all([
                this.checkWorkspaceModels(),
                this.checkGlobalModels()
            ]);
        }
        catch (error) {
            this.logger.error(`Failed to check downloaded models: ${error}`);
        }
    }
    async checkGlobalModels() {
        // Check global models directory
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
                        languages: ['all'], // Universal support for imported models
                        requirements: { vram: 0, ram: Math.ceil(stats.size / (1024 * 1024 * 1024)) + 2, cpu: true },
                        isDownloaded: true,
                        path: modelPath,
                        architecture: metadata.architecture || 'llama',
                        quantization: metadata.quantization,
                        parameterCount: metadata.parameterCount,
                        contextWindow: 4096,
                        fimTemplate: metadata.architecture // Heuristic: arch often maps to template
                    });
                }
                catch (e) {
                    this.logger.warn(`Failed to stat imported model ${file}: ${e}`);
                }
            });
        }
    }
    async checkWorkspaceModels() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
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
                        }
                        else {
                            // Update existing model (if checking repeatedly)
                            const model = this.availableModels.get(modelId);
                            model.isDownloaded = true;
                            model.path = modelPath;
                        }
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Error checking workspace folder ${folder.name} for models: ${err}`);
            }
        }
    }
    async downloadModel(modelId, _progressCallback) {
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
    async removeModel(modelId) {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to remove model: ${error}`);
            throw error;
        }
    }
    getBestModel(requirements) {
        const availableModels = Array.from(this.availableModels.values())
            .filter(model => model.isDownloaded);
        if (availableModels.length === 0) {
            return null;
        }
        // Filter by language if specified
        let candidates = availableModels;
        if (requirements.language) {
            candidates = availableModels.filter(model => model.languages.includes(requirements.language) || model.languages.includes('all'));
        }
        // If no models match language, use all available models
        if (candidates.length === 0) {
            candidates = availableModels;
        }
        // Sort by preference (smaller, faster models first)
        candidates.sort((a, b) => {
            if (requirements.speed === 'fast') {
                return a.size - b.size;
            }
            else if (requirements.speed === 'quality') {
                return b.size - a.size;
            }
            return Math.abs(a.size - 4 * 1024 * 1024 * 1024) - Math.abs(b.size - 4 * 1024 * 1024 * 1024);
        });
        return candidates[0];
    }
    /**
     * Get optimal model for a specific language.
     * Prioritizes language-specific models over universal ones.
     * @param language Language ID
     * @returns Best model for the language or null
     */
    getOptimalModelForLanguage(language) {
        const downloadedModels = Array.from(this.availableModels.values())
            .filter(model => model.isDownloaded);
        if (downloadedModels.length === 0) {
            return null;
        }
        // 1. Try to find language-specific models
        const languageSpecific = downloadedModels.filter(model => model.languages.includes(language) && !model.languages.includes('all'));
        if (languageSpecific.length > 0) {
            // Return smallest language-specific model for speed
            return languageSpecific.sort((a, b) => a.size - b.size)[0];
        }
        // 2. Fall back to universal models
        const universal = downloadedModels.filter(model => model.languages.includes('all'));
        if (universal.length > 0) {
            // Return smallest universal model
            return universal.sort((a, b) => a.size - b.size)[0];
        }
        // 3. Last resort: any downloaded model
        return downloadedModels.sort((a, b) => a.size - b.size)[0];
    }
    /**
     * Download a model from HuggingFace Hub.
     * @param modelId Model ID from registry
     * @returns Promise that resolves when download is complete
     */
    async downloadFromHuggingFace(modelId) {
        const model = this.availableModels.get(modelId);
        if (!model) {
            throw new Error(`Model ${modelId} not found in registry`);
        }
        if (!model.huggingfaceRepo || !model.huggingfaceFile) {
            throw new Error(`Model ${modelId} does not have HuggingFace metadata`);
        }
        // Lazy load HuggingFace client
        if (!this.hfClient) {
            const { HuggingFaceClient } = await Promise.resolve().then(() => __importStar(require('@inline/shared')));
            this.hfClient = new HuggingFaceClient();
        }
        const destination = path.join(this.modelsDirectory, `${modelId}.gguf`);
        try {
            this.logger.info(`Downloading ${model.name} from HuggingFace...`);
            await this.hfClient.downloadWithProgress(model.huggingfaceRepo, model.huggingfaceFile, destination);
            // Update model info
            model.isDownloaded = true;
            model.path = destination;
            this.logger.info(`Successfully downloaded ${model.name}`);
            vscode.window.showInformationMessage(`Model ${model.name} downloaded successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to download model from HuggingFace: ${error}`);
            throw error;
        }
    }
    /**
     * Import a model directly from HuggingFace by repository and file name.
     * @param repoId HuggingFace repository ID
     * @param filename GGUF file name
     * @returns Promise that resolves when import is complete
     */
    async importFromHuggingFace(repoId, filename) {
        // Lazy load HuggingFace client
        if (!this.hfClient) {
            const { HuggingFaceClient } = await Promise.resolve().then(() => __importStar(require('@inline/shared')));
            this.hfClient = new HuggingFaceClient();
        }
        const modelId = `imported_${repoId.replace('/', '_')}_${path.basename(filename, '.gguf')}`;
        const destination = path.join(this.modelsDirectory, `${modelId}.gguf`);
        try {
            this.logger.info(`Importing ${filename} from ${repoId}...`);
            await this.hfClient.downloadWithProgress(repoId, filename, destination);
            // Refresh models to pick up the new import
            await this.checkDownloadedModels();
            this.logger.info(`Successfully imported model from ${repoId}`);
            vscode.window.showInformationMessage(`Model imported successfully from ${repoId}`);
        }
        catch (error) {
            this.logger.error(`Failed to import model from HuggingFace: ${error}`);
            throw error;
        }
    }
    /**
     * Search for models on HuggingFace Hub.
     * @param query Search query
     * @returns Promise with array of model info
     */
    async searchHuggingFaceModels(query) {
        // Lazy load HuggingFace client
        if (!this.hfClient) {
            const { HuggingFaceClient } = await Promise.resolve().then(() => __importStar(require('@inline/shared')));
            this.hfClient = new HuggingFaceClient();
        }
        try {
            return await this.hfClient.searchModels(query, {
                tags: ['code', 'gguf'],
                limit: 20
            });
        }
        catch (error) {
            this.logger.error(`Failed to search HuggingFace models: ${error}`);
            throw error;
        }
    }
    /**
     * Load a model into the inference engine with progress feedback.
     * Unloads previous model if switching. Persists selection across sessions.
     *
     * @throws Error if model not found or loading fails
     */
    async setCurrentModel(modelId) {
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
                const threads = config.get('inference.threads', 4);
                const gpuLayers = config.get('inference.gpuLayers');
                const contextSize = config.get('contextWindow', 4096);
                // Detect FIM template
                const fimTemplate = this.getFimTemplateId(model);
                // Load model with configured parameters
                await this.inferenceEngine.loadModel(model.path, {
                    threads,
                    gpuLayers,
                    contextSize,
                    fimTemplate
                });
                this.currentModel = model;
                // Persist selection for next session
                await this.context.globalState.update('lastActiveModelId', model.id);
                this.logger.info(`Successfully loaded model: ${model.name} from ${model.path}`);
            });
            vscode.window.showInformationMessage(`Switched to ${model.name}`);
        }
        catch (error) {
            this.logger.error(`Failed to load model ${modelId}: ${error}`);
            vscode.window.showErrorMessage(`Failed to load model: ${error instanceof Error ? error.message : String(error)}`);
            // Clear reference on failure to avoid stale state
            if (this.currentModel?.id === modelId) {
                this.currentModel = null;
            }
            throw error;
        }
    }
    async unloadModel() {
        if (this.currentModel) {
            await this.inferenceEngine.unloadModel();
            this.currentModel = null;
            // Clear persistence
            await this.context.globalState.update('lastActiveModelId', undefined);
            this.logger.info('Model unloaded manually');
            vscode.window.showInformationMessage('Model unloaded');
        }
    }
    getCurrentModel() {
        return this.currentModel;
    }
    getAllModels() {
        return Array.from(this.availableModels.values());
    }
    getDownloadedModels() {
        return Array.from(this.availableModels.values()).filter(model => model.isDownloaded);
    }
    validateModel(modelPath) {
        try {
            return fs.existsSync(modelPath) && fs.statSync(modelPath).isFile();
        }
        catch {
            return false;
        }
    }
    getInferenceEngine() {
        return this.inferenceEngine;
    }
    async optimizeModel(language) {
        // Dynamic language optimization with intelligent categorization
        const languageCategories = {
            // Statically-typed, strict languages (lower temperature for precision)
            strict: ['python', 'java', 'cpp', 'c', 'rust', 'go', 'kotlin', 'swift', 'csharp', 'c#', 'scala', 'haskell', 'ocaml', 'fsharp', 'f#'],
            // Dynamically-typed, flexible languages (moderate temperature)
            dynamic: ['javascript', 'typescript', 'jsx', 'tsx', 'ruby', 'perl', 'lua', 'php', 'groovy', 'clojure', 'lisp', 'elisp'],
            // Web markup and data formats (lower temperature)
            markup: ['html', 'html5', 'css', 'css3', 'xml', 'json', 'yaml', 'toml', 'markdown', 'md'],
            // Functional languages (moderate-high temperature)
            functional: ['haskell', 'elixir', 'erlang', 'clojure', 'scheme', 'racket', 'lisp'],
            // Systems programming (low temperature)
            systems: ['rust', 'cpp', 'c', 'zig', 'nim', 'crystal', 'fortran', 'cobol'],
            // Data science (moderate temperature)
            datascience: ['python', 'r', 'julia', 'sql'],
            // Mobile (moderate temperature)
            mobile: ['swift', 'kotlin', 'dart', 'objective-c', 'objc'],
            // Scripting (high temperature for flexibility)
            scripting: ['shell', 'bash', 'powershell', 'perl', 'lua', 'groovy'],
            // Blockchain/Smart contracts (low temperature)
            blockchain: ['solidity', 'vyper'],
            // Query languages (low temperature)
            query: ['sql', 'codeql', 'ql', 'graphql']
        };
        // Determine language category and apply optimized config
        const normalizedLang = language.toLowerCase();
        let config = { temperature: 0.3, topP: 0.95, maxTokens: 512 };
        if (languageCategories.strict.includes(normalizedLang)) {
            config = { temperature: 0.2, topP: 0.9, maxTokens: 512 };
        }
        else if (languageCategories.dynamic.includes(normalizedLang)) {
            config = { temperature: 0.3, topP: 0.95, maxTokens: 512 };
        }
        else if (languageCategories.markup.includes(normalizedLang)) {
            config = { temperature: 0.15, topP: 0.85, maxTokens: 256 };
        }
        else if (languageCategories.functional.includes(normalizedLang)) {
            config = { temperature: 0.35, topP: 0.95, maxTokens: 512 };
        }
        else if (languageCategories.systems.includes(normalizedLang)) {
            config = { temperature: 0.15, topP: 0.85, maxTokens: 512 };
        }
        else if (languageCategories.datascience.includes(normalizedLang)) {
            config = { temperature: 0.25, topP: 0.9, maxTokens: 512 };
        }
        else if (languageCategories.mobile.includes(normalizedLang)) {
            config = { temperature: 0.25, topP: 0.9, maxTokens: 512 };
        }
        else if (languageCategories.scripting.includes(normalizedLang)) {
            config = { temperature: 0.4, topP: 0.98, maxTokens: 512 };
        }
        else if (languageCategories.blockchain.includes(normalizedLang)) {
            config = { temperature: 0.15, topP: 0.85, maxTokens: 512 };
        }
        else if (languageCategories.query.includes(normalizedLang)) {
            config = { temperature: 0.2, topP: 0.9, maxTokens: 256 };
        }
        this.logger.info(`Optimizing model for ${language}: temp=${config.temperature}, topP=${config.topP}, maxTokens=${config.maxTokens}`);
        vscode.window.showInformationMessage(`Optimizing model for ${language}...`);
    }
    monitorResources() {
        // System memory checks removed completely as requested
        return {
            vram: 0,
            ram: 0,
            cpu: 0
        };
    }
    extractModelMetadata(filename) {
        // Extract metadata from filename patterns like:
        // "imported_starcoder2_7b_Q4_K_M.gguf" -> { architecture: 'starcoder2', quantization: 'Q4_K_M', parameterCount: '7B' }
        // "imported_deepseek_coder_6_7b.gguf" -> { architecture: 'deepseek_coder', parameterCount: '6.7B' }
        const baseName = filename.replace('imported_', '').replace('.gguf', '');
        const parts = baseName.split('_');
        let architecture;
        let quantization;
        let parameterCount;
        // Common quantization patterns
        const quantPatterns = ['Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q8', 'F16', 'F32'];
        const quantParts = parts.filter(part => quantPatterns.some(pattern => part.includes(pattern)));
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
        const archCandidates = parts.filter(part => !part.match(/^\d+$/) && // Not just numbers
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
    getFimTemplateId(model) {
        // 1. Check for manual user override in settings (Universal Support)
        const config = vscode.workspace.getConfiguration('inline');
        const customFim = config.get('fim');
        if (customFim && customFim.prefix) {
            return 'custom';
        }
        const targetModel = model || this.currentModel;
        if (!targetModel)
            return 'default';
        // Check if model has explicit FIM template defined in JSON
        if (targetModel.fimTemplate) {
            return targetModel.fimTemplate;
        }
        const rawString = (targetModel.id + targetModel.name + (targetModel.path || '')).toLowerCase();
        // Heuristics for all major models
        if (rawString.includes('deepseek'))
            return 'deepseek';
        if (rawString.includes('codestral') || rawString.includes('mistral'))
            return 'codestral';
        if (rawString.includes('codegemma') || rawString.includes('gemma'))
            return 'codegemma';
        if (rawString.includes('qwen'))
            return 'qwen';
        if (rawString.includes('yi-') || rawString.includes('yi_'))
            return 'yi';
        if (rawString.includes('starcoder'))
            return 'starcoder';
        if (rawString.includes('codellama'))
            return 'codellama';
        if (rawString.includes('stable'))
            return 'stable-code';
        return 'default';
    }
    cleanup() {
        this.inferenceEngine.unloadModel().catch(console.error);
        this.currentModel = null;
    }
}
exports.ModelManager = ModelManager;
//# sourceMappingURL=model-manager.js.map