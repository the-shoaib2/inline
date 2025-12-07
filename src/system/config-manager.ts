import * as vscode from 'vscode';

/**
 * Centralized configuration management for the Inline extension.
 *
 * Wraps VS Code's workspace configuration API with:
 * - Type-safe getters for common settings
 * - Automatic config reloading on changes
 * - Global scope persistence for user settings
 */
export class ConfigManager {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration('inline');

        // Auto-reload configuration when user changes settings
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('inline')) {
                this.config = vscode.workspace.getConfiguration('inline');
            }
        });
    }

    /**
     * Automatically switch to offline mode when internet is unavailable.
     */
    public get autoOffline(): boolean {
        return this.config.get('autoOffline', true);
    }

    /**
     * Default model ID for code completion.
     */
    public get defaultModel(): string {
        return this.config.get('defaultModel', 'deepseek-coder:6.7b');
    }

    /**
     * Maximum tokens to generate per completion (0-2048).
     */
    public get maxTokens(): number {
        return this.config.get('maxTokens', 512);
    }

    /**
     * Model temperature for generation (0.0=deterministic, 1.0=creative).
     */
    public get temperature(): number {
        return this.config.get('temperature', 0.1);
    }

    /**
     * Maximum number of completion entries to cache.
     */
    public get cacheSize(): number {
        return this.config.get('cacheSize', 100);
    }

    /**
     * Enable CPU/memory monitoring and adaptive resource management.
     */
    public get resourceMonitoring(): boolean {
        return this.config.get('resourceMonitoring', true);
    }

    /**
     * Generic configuration getter with type safety.
     * @param key Configuration key (e.g., 'inline.maxTokens')
     * @param defaultValue Fallback value if key not found
     */
    public get<T>(key: string, defaultValue?: T): T | undefined {
        if (defaultValue !== undefined) {
            return this.config.get<T>(key, defaultValue);
        }
        return this.config.get<T>(key);
    }

    /**
     * Update default model in global user settings.
     */
    public async setDefaultModel(modelId: string): Promise<void> {
        await this.config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update auto-offline setting in global user settings.
     */
    public async setAutoOffline(enabled: boolean): Promise<void> {
        await this.config.update('autoOffline', enabled, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update max tokens in global user settings.
     */
    public async setMaxTokens(tokens: number): Promise<void> {
        await this.config.update('maxTokens', tokens, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update temperature in global user settings.
     */
    public async setTemperature(temp: number): Promise<void> {
        await this.config.update('temperature', temp, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update cache size in global user settings.
     */
    public async setCacheSize(size: number): Promise<void> {
        await this.config.update('cacheSize', size, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update resource monitoring setting in global user settings.
     */
    public async setResourceMonitoring(enabled: boolean): Promise<void> {
        await this.config.update('resourceMonitoring', enabled, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get all configuration settings as a single object.
     */
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

/**
 * Type-safe configuration interface for Inline extension.
 */
export interface InlineConfig {
    autoOffline: boolean;
    defaultModel: string;
    maxTokens: number;
    temperature: number;
    cacheSize: number;
    resourceMonitoring: boolean;
}
