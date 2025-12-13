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
    // Removed cached config to avoid stale state during rapid updates

    private getConfig(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration('inline');
    }

    /**
     * Automatically switch to offline mode when internet is unavailable.
     */
    public get autoOffline(): boolean {
        return this.getConfig().get('autoOffline', true);
    }

    /**
     * Default model ID for code completion.
     */
    public get defaultModel(): string {
        return this.getConfig().get('defaultModel', 'deepseek-coder:6.7b');
    }

    /**
     * Maximum tokens to generate per completion (0-2048).
     */
    public get maxTokens(): number {
        return this.getConfig().get('maxTokens', 512);
    }

    /**
     * Model temperature for generation (0.0=deterministic, 1.0=creative).
     */
    public get temperature(): number {
        return this.getConfig().get('temperature', 0.1);
    }

    /**
     * Maximum number of completion entries to cache.
     */
    public get cacheSize(): number {
        return this.getConfig().get('cacheSize', 100);
    }

    /**
     * Enable CPU/memory monitoring and adaptive resource management.
     */
    public get resourceMonitoring(): boolean {
        return this.getConfig().get('resourceMonitoring', true);
    }

    /**
     * Generic configuration getter with type safety.
     * @param key Configuration key (e.g., 'inline.maxTokens')
     * @param defaultValue Fallback value if key not found
     */
    public get<T>(key: string, defaultValue?: T): T | undefined {
        if (defaultValue !== undefined) {
            return this.getConfig().get<T>(key, defaultValue);
        }
        return this.getConfig().get<T>(key);
    }

    /**
     * Update default model in global user settings.
     */
    public async setDefaultModel(modelId: string): Promise<void> {
        await this.getConfig().update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update auto-offline setting in global user settings.
     */
    public async setAutoOffline(enabled: boolean): Promise<void> {
        await this.getConfig().update('autoOffline', enabled, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update max tokens in global user settings.
     */
    public async setMaxTokens(tokens: number): Promise<void> {
        await this.getConfig().update('maxTokens', tokens, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update temperature in global user settings.
     */
    public async setTemperature(temp: number): Promise<void> {
        await this.getConfig().update('temperature', temp, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update cache size in global user settings.
     */
    public async setCacheSize(size: number): Promise<void> {
        await this.getConfig().update('cacheSize', size, vscode.ConfigurationTarget.Global);
    }

    /**
     * Update resource monitoring setting in global user settings.
     */
    public async setResourceMonitoring(enabled: boolean): Promise<void> {
        await this.getConfig().update('resourceMonitoring', enabled, vscode.ConfigurationTarget.Global);
    }

    /**
     * Get all configuration settings as a single object.
     */
    public getAll(): InlineConfig {
        const config = this.getConfig();
        return {
            autoOffline: config.get('autoOffline', true),
            defaultModel: config.get('defaultModel', 'deepseek-coder:6.7b'),
            maxTokens: config.get('maxTokens', 512),
            temperature: config.get('temperature', 0.1),
            cacheSize: config.get('cacheSize', 100),
            resourceMonitoring: config.get('resourceMonitoring', true),
            codingRules: config.get('codingRules', [])
        };
    }

    /**
     * Get coding rules from configuration.
     */
    public get codingRules(): CodingRule[] {
        return this.getConfig().get('codingRules', []);
    }

    /**
     * Update coding rules in global user settings.
     */
    public async setCodingRules(rules: CodingRule[]): Promise<void> {
        await this.getConfig().update('codingRules', rules, vscode.ConfigurationTarget.Global);
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
    codingRules?: CodingRule[];
}

export interface CodingRule {
    name: string;
    pattern: string;
    description: string;
    enabled: boolean;
}
