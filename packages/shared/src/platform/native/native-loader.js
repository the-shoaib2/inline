"use strict";
/**
 * Native module loader for platform-specific functionality
 * Handles loading of native addons (Rust/C++) with fallback support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeLoader = void 0;
class NativeLoader {
    constructor() {
        this.loadedModules = new Map();
    }
    static getInstance() {
        if (!NativeLoader.instance) {
            NativeLoader.instance = new NativeLoader();
        }
        return NativeLoader.instance;
    }
    /**
     * Load a native module with fallback to JavaScript implementation
     * @param moduleName Name of the module to load
     * @param fallback Optional fallback implementation
     */
    loadModule(moduleName, fallback) {
        // Check if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }
        try {
            // Try to load native module
            let nativeModule;
            switch (moduleName) {
                case '@inline/analyzer':
                    nativeModule = require('@inline/analyzer');
                    break;
                case '@inline/accelerator':
                    nativeModule = require('@inline/accelerator');
                    break;
                default:
                    if (fallback) {
                        console.warn(`[NativeLoader] Unknown module '${moduleName}', using fallback`);
                        nativeModule = fallback;
                    }
                    else {
                        throw new Error(`Unknown native module: ${moduleName}`);
                    }
            }
            this.loadedModules.set(moduleName, nativeModule);
            return nativeModule;
        }
        catch (error) {
            console.error(`[NativeLoader] Failed to load native module '${moduleName}':`, error);
            if (fallback) {
                console.warn(`[NativeLoader] Using fallback for '${moduleName}'`);
                this.loadedModules.set(moduleName, fallback);
                return fallback;
            }
            throw error;
        }
    }
    /**
     * Check if a native module is available
     */
    isAvailable(moduleName) {
        try {
            this.loadModule(moduleName);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Unload a module from cache
     */
    unloadModule(moduleName) {
        this.loadedModules.delete(moduleName);
    }
    /**
     * Clear all loaded modules
     */
    clearCache() {
        this.loadedModules.clear();
    }
}
exports.NativeLoader = NativeLoader;
//# sourceMappingURL=native-loader.js.map