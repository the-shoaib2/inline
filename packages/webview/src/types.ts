export interface Model {
    id: string;
    name: string;
    description: string;
    size: number;
    url?: string;
    requirements: {
        ram: number;
        vram: number;
    };
    contextWindow: number;
    isDownloaded: boolean;
    isImported?: boolean;
    languages?: string[];
    architecture?: string;
    quantization?: string;
    parameterCount?: string;
}

export interface Settings {
    temperature?: number;
    maxTokens?: number;
    cacheSize?: number;
    autoOffline?: boolean;
    resourceMonitoring?: boolean;
    modelWarmup?: boolean;
    [key: string]: any;
}

export interface CodingRule {
    name: string;
    pattern: string;
    description: string;
    enabled: boolean;
}

export interface Statistics {
    completionsGenerated: number;
    acceptedSuggestions: number;
    rejectedSuggestions: number;
    acceptanceRate: number;
    cacheHitRate: number;
    averageLatency: number;
    currentModel: string;
    sessionUptime: number;
}

export interface AppData {
    models: Model[];
    settings: Settings;
    rules: CodingRule[];
    currentModel: string | null;
    isOffline: boolean;
    logoUri?: string;
    statistics?: Statistics;
}

export interface DownloadProgress {
    modelId: string;
    progress: number;
    speed?: number;
}
