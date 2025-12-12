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
export declare class ModelRegistry {
    private registryPath;
    private modelsDir;
    private registry;
    private logger;
    constructor(modelsDir?: string);
    private ensureDirectories;
    private loadRegistry;
    private saveRegistry;
    registerModel(metadata: ModelMetadata): void;
    unregisterModel(modelId: string): boolean;
    getModel(modelId: string): ModelMetadata | undefined;
    getAllModels(): ModelMetadata[];
    getDownloadedModels(): ModelMetadata[];
    updateModelUsage(modelId: string): void;
    updateModelMetadata(modelId: string, updates: Partial<ModelMetadata>): void;
    isModelRegistered(modelId: string): boolean;
    getModelsDirectory(): string;
    getTotalSize(): number;
    cleanupMissingModels(): number;
    exportRegistry(): string;
    importRegistry(registryJson: string): void;
}
//# sourceMappingURL=model-registry.d.ts.map