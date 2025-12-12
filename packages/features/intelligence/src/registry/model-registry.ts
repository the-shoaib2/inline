import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ModelInfo } from '../models/model-manager';
import { Logger } from '@inline/shared';

export interface ModelMetadata {
    id: string;
    name: string;
    description: string;
    path: string;
    size: number;
    architecture?: string;
    quantization?: string;
    contextWindow?: number;
    installedAt: number;
    lastUsed?: number;
    usageCount: number;
    version?: string;
    source: 'download' | 'import';
    sourceUrl?: string;
}

export class ModelRegistry {
    private registryPath: string;
    private modelsDir: string;
    private registry: Map<string, ModelMetadata>;
    private logger: Logger;

    constructor(modelsDir?: string) {
        this.logger = new Logger('ModelRegistry');

        // Use provided directory or default to ~/.inline/models
        if (modelsDir) {
            this.modelsDir = modelsDir;
        } else {
            const homeDir = os.homedir();
            this.modelsDir = path.join(homeDir, '.inline', 'models');
        }

        this.registryPath = path.join(this.modelsDir, 'registry.json');
        this.registry = new Map();

        this.ensureDirectories();
        this.loadRegistry();
    }

    private ensureDirectories(): void {
        if (!fs.existsSync(this.modelsDir)) {
            fs.mkdirSync(this.modelsDir, { recursive: true });
            this.logger.info(`Created models directory: ${this.modelsDir}`);
        }
    }

    private loadRegistry(): void {
        try {
            if (fs.existsSync(this.registryPath)) {
                const data = fs.readFileSync(this.registryPath, 'utf8');
                const registryData = JSON.parse(data);

                this.registry = new Map(Object.entries(registryData));
                this.logger.info(`Loaded ${this.registry.size} models from registry`);
            } else {
                this.logger.info('No existing registry found, starting fresh');
            }
        } catch (error) {
            this.logger.error(`Failed to load registry: ${error}`);
            this.registry = new Map();
        }
    }

    private saveRegistry(): void {
        try {
            const registryData = Object.fromEntries(this.registry);
            fs.writeFileSync(
                this.registryPath,
                JSON.stringify(registryData, null, 2),
                'utf8'
            );
            this.logger.info('Registry saved successfully');
        } catch (error) {
            this.logger.error(`Failed to save registry: ${error}`);
        }
    }

    public registerModel(metadata: ModelMetadata): void {
        this.registry.set(metadata.id, metadata);
        this.saveRegistry();
        this.logger.info(`Registered model: ${metadata.name} (${metadata.id})`);
    }

    public unregisterModel(modelId: string): boolean {
        const deleted = this.registry.delete(modelId);
        if (deleted) {
            this.saveRegistry();
            this.logger.info(`Unregistered model: ${modelId}`);
        }
        return deleted;
    }

    public getModel(modelId: string): ModelMetadata | undefined {
        return this.registry.get(modelId);
    }

    public getAllModels(): ModelMetadata[] {
        return Array.from(this.registry.values());
    }

    public getDownloadedModels(): ModelMetadata[] {
        return this.getAllModels().filter(model =>
            fs.existsSync(model.path)
        );
    }

    public updateModelUsage(modelId: string): void {
        const model = this.registry.get(modelId);
        if (model) {
            model.lastUsed = Date.now();
            model.usageCount = (model.usageCount || 0) + 1;
            this.saveRegistry();
        }
    }

    public updateModelMetadata(modelId: string, updates: Partial<ModelMetadata>): void {
        const model = this.registry.get(modelId);
        if (model) {
            Object.assign(model, updates);
            this.saveRegistry();
            this.logger.info(`Updated metadata for model: ${modelId}`);
        }
    }

    public isModelRegistered(modelId: string): boolean {
        return this.registry.has(modelId);
    }

    public getModelsDirectory(): string {
        return this.modelsDir;
    }

    public getTotalSize(): number {
        return this.getAllModels().reduce((total, model) => total + model.size, 0);
    }

    public cleanupMissingModels(): number {
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

    public exportRegistry(): string {
        return JSON.stringify(Object.fromEntries(this.registry), null, 2);
    }

    public importRegistry(registryJson: string): void {
        try {
            const registryData = JSON.parse(registryJson);
            this.registry = new Map(Object.entries(registryData));
            this.saveRegistry();
            this.logger.info('Registry imported successfully');
        } catch (error) {
            this.logger.error(`Failed to import registry: ${error}`);
            throw error;
        }
    }
}
