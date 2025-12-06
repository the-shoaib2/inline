import * as vscode from 'vscode';

export class ConfigManager {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('inline');

        // Watch for configuration changes
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('inline')) {
                this.config = vscode.workspace.getConfiguration('inline');
            }
        });
    }

    public get autoOffline(): boolean {
        return this.config.get('autoOffline', true);
    }

    public get defaultModel(): string {
        return this.config.get('defaultModel', 'deepseek-coder:6.7b');
    }

    public get maxTokens(): number {
        return this.config.get('maxTokens', 512);
    }

    public get temperature(): number {
        return this.config.get('temperature', 0.1);
    }

    public get cacheSize(): number {
        return this.config.get('cacheSize', 100);
    }

    public get resourceMonitoring(): boolean {
        return this.config.get('resourceMonitoring', true);
    }

    public get<T>(key: string, defaultValue?: T): T | undefined {
        if (defaultValue !== undefined) {
            return this.config.get<T>(key, defaultValue);
        }
        return this.config.get<T>(key);
    }

    public async setDefaultModel(modelId: string): Promise<void> {
        await this.config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
    }

    public async setAutoOffline(enabled: boolean): Promise<void> {
        await this.config.update('autoOffline', enabled, vscode.ConfigurationTarget.Global);
    }

    public async setMaxTokens(tokens: number): Promise<void> {
        await this.config.update('maxTokens', tokens, vscode.ConfigurationTarget.Global);
    }

    public async setTemperature(temp: number): Promise<void> {
        await this.config.update('temperature', temp, vscode.ConfigurationTarget.Global);
    }

    public async setCacheSize(size: number): Promise<void> {
        await this.config.update('cacheSize', size, vscode.ConfigurationTarget.Global);
    }

    public async setResourceMonitoring(enabled: boolean): Promise<void> {
        await this.config.update('resourceMonitoring', enabled, vscode.ConfigurationTarget.Global);
    }

    public getAll(): InlineConfig {
        return {
            autoOffline: this.autoOffline,
            defaultModel: this.defaultModel,
            maxTokens: this.maxTokens,
            temperature: this.temperature,
            cacheSize: this.cacheSize,
            resourceMonitoring: this.resourceMonitoring
        };
    }
}

export interface InlineConfig {
    autoOffline: boolean;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    cacheSize: number;
    resourceMonitoring: boolean;
}
