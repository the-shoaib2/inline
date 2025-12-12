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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Centralized configuration management for the Inline extension.
 *
 * Wraps VS Code's workspace configuration API with:
 * - Type-safe getters for common settings
 * - Automatic config reloading on changes
 * - Global scope persistence for user settings
 */
class ConfigManager {
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
    get autoOffline() {
        return this.config.get('autoOffline', true);
    }
    /**
     * Default model ID for code completion.
     */
    get defaultModel() {
        return this.config.get('defaultModel', 'deepseek-coder:6.7b');
    }
    /**
     * Maximum tokens to generate per completion (0-2048).
     */
    get maxTokens() {
        return this.config.get('maxTokens', 512);
    }
    /**
     * Model temperature for generation (0.0=deterministic, 1.0=creative).
     */
    get temperature() {
        return this.config.get('temperature', 0.1);
    }
    /**
     * Maximum number of completion entries to cache.
     */
    get cacheSize() {
        return this.config.get('cacheSize', 100);
    }
    /**
     * Enable CPU/memory monitoring and adaptive resource management.
     */
    get resourceMonitoring() {
        return this.config.get('resourceMonitoring', true);
    }
    /**
     * Generic configuration getter with type safety.
     * @param key Configuration key (e.g., 'inline.maxTokens')
     * @param defaultValue Fallback value if key not found
     */
    get(key, defaultValue) {
        if (defaultValue !== undefined) {
            return this.config.get(key, defaultValue);
        }
        return this.config.get(key);
    }
    /**
     * Update default model in global user settings.
     */
    async setDefaultModel(modelId) {
        await this.config.update('defaultModel', modelId, vscode.ConfigurationTarget.Global);
    }
    /**
     * Update auto-offline setting in global user settings.
     */
    async setAutoOffline(enabled) {
        await this.config.update('autoOffline', enabled, vscode.ConfigurationTarget.Global);
    }
    /**
     * Update max tokens in global user settings.
     */
    async setMaxTokens(tokens) {
        await this.config.update('maxTokens', tokens, vscode.ConfigurationTarget.Global);
    }
    /**
     * Update temperature in global user settings.
     */
    async setTemperature(temp) {
        await this.config.update('temperature', temp, vscode.ConfigurationTarget.Global);
    }
    /**
     * Update cache size in global user settings.
     */
    async setCacheSize(size) {
        await this.config.update('cacheSize', size, vscode.ConfigurationTarget.Global);
    }
    /**
     * Update resource monitoring setting in global user settings.
     */
    async setResourceMonitoring(enabled) {
        await this.config.update('resourceMonitoring', enabled, vscode.ConfigurationTarget.Global);
    }
    /**
     * Get all configuration settings as a single object.
     */
    getAll() {
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
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=config-manager.js.map