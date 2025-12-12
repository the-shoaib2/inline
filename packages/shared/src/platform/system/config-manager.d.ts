/**
 * Centralized configuration management for the Inline extension.
 *
 * Wraps VS Code's workspace configuration API with:
 * - Type-safe getters for common settings
 * - Automatic config reloading on changes
 * - Global scope persistence for user settings
 */
export declare class ConfigManager {
    private config;
    constructor();
    /**
     * Automatically switch to offline mode when internet is unavailable.
     */
    get autoOffline(): boolean;
    /**
     * Default model ID for code completion.
     */
    get defaultModel(): string;
    /**
     * Maximum tokens to generate per completion (0-2048).
     */
    get maxTokens(): number;
    /**
     * Model temperature for generation (0.0=deterministic, 1.0=creative).
     */
    get temperature(): number;
    /**
     * Maximum number of completion entries to cache.
     */
    get cacheSize(): number;
    /**
     * Enable CPU/memory monitoring and adaptive resource management.
     */
    get resourceMonitoring(): boolean;
    /**
     * Generic configuration getter with type safety.
     * @param key Configuration key (e.g., 'inline.maxTokens')
     * @param defaultValue Fallback value if key not found
     */
    get<T>(key: string, defaultValue?: T): T | undefined;
    /**
     * Update default model in global user settings.
     */
    setDefaultModel(modelId: string): Promise<void>;
    /**
     * Update auto-offline setting in global user settings.
     */
    setAutoOffline(enabled: boolean): Promise<void>;
    /**
     * Update max tokens in global user settings.
     */
    setMaxTokens(tokens: number): Promise<void>;
    /**
     * Update temperature in global user settings.
     */
    setTemperature(temp: number): Promise<void>;
    /**
     * Update cache size in global user settings.
     */
    setCacheSize(size: number): Promise<void>;
    /**
     * Update resource monitoring setting in global user settings.
     */
    setResourceMonitoring(enabled: boolean): Promise<void>;
    /**
     * Get all configuration settings as a single object.
     */
    getAll(): InlineConfig;
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
//# sourceMappingURL=config-manager.d.ts.map