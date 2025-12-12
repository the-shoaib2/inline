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
exports.ModelRegistry = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const shared_1 = require("@inline/shared");
class ModelRegistry {
    constructor(modelsDir) {
        this.logger = new shared_1.Logger('ModelRegistry');
        // Use provided directory or default to ~/.inline/models
        if (modelsDir) {
            this.modelsDir = modelsDir;
        }
        else {
            const homeDir = os.homedir();
            this.modelsDir = path.join(homeDir, '.inline', 'models');
        }
        this.registryPath = path.join(this.modelsDir, 'registry.json');
        this.registry = new Map();
        this.ensureDirectories();
        this.loadRegistry();
    }
    ensureDirectories() {
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
            this.logger.info(`Created models directory: ${this.modelsDir}`);
        }
    }
    loadRegistry() {
        try {
            if (fs.existsSync(this.registryPath)) {
                const data = fs.readFileSync(this.registryPath, 'utf8');
                const registryData = JSON.parse(data);
                this.registry = new Map(Object.entries(registryData));
                this.logger.info(`Loaded ${this.registry.size} models from registry`);
            }
            else {
                this.logger.info('No existing registry found, starting fresh');
            }
        }
        catch (error) {
            this.logger.error(`Failed to load registry: ${error}`);
            this.registry = new Map();
        }
    }
    saveRegistry() {
        try {
            const registryData = Object.fromEntries(this.registry);
            fs.writeFileSync(this.registryPath, JSON.stringify(registryData, null, 2), 'utf8');
            this.logger.info('Registry saved successfully');
        }
        catch (error) {
            this.logger.error(`Failed to save registry: ${error}`);
        }
    }
    registerModel(metadata) {
        this.registry.set(metadata.id, metadata);
        this.saveRegistry();
        this.logger.info(`Registered model: ${metadata.name} (${metadata.id})`);
    }
    unregisterModel(modelId) {
        const deleted = this.registry.delete(modelId);
        if (deleted) {
            this.saveRegistry();
            this.logger.info(`Unregistered model: ${modelId}`);
        }
        return deleted;
    }
    getModel(modelId) {
        return this.registry.get(modelId);
    }
    getAllModels() {
        return Array.from(this.registry.values());
    }
    getDownloadedModels() {
        return this.getAllModels().filter(model => fs.existsSync(model.path));
    }
    updateModelUsage(modelId) {
        const model = this.registry.get(modelId);
        if (model) {
            model.lastUsed = Date.now();
            model.usageCount = (model.usageCount || 0) + 1;
            this.saveRegistry();
        }
    }
    updateModelMetadata(modelId, updates) {
        const model = this.registry.get(modelId);
        if (model) {
            Object.assign(model, updates);
            this.saveRegistry();
            this.logger.info(`Updated metadata for model: ${modelId}`);
        }
    }
    isModelRegistered(modelId) {
        return this.registry.has(modelId);
    }
    getModelsDirectory() {
        return this.modelsDir;
    }
    getTotalSize() {
        return this.getAllModels().reduce((total, model) => total + model.size, 0);
    }
    cleanupMissingModels() {
        let cleaned = 0;
        const models = this.getAllModels();
        for (const model of models) {
            if (!fs.existsSync(model.path)) {
                this.unregisterModel(model.id);
                cleaned++;
                this.logger.info(`Cleaned up missing model: ${model.id}`);
            }
        }
        return cleaned;
    }
    exportRegistry() {
        return JSON.stringify(Object.fromEntries(this.registry), null, 2);
    }
    importRegistry(registryJson) {
        try {
            const registryData = JSON.parse(registryJson);
            this.registry = new Map(Object.entries(registryData));
            this.saveRegistry();
            this.logger.info('Registry imported successfully');
        }
        catch (error) {
            this.logger.error(`Failed to import registry: ${error}`);
            throw error;
        }
    }
}
exports.ModelRegistry = ModelRegistry;
//# sourceMappingURL=model-registry.js.map