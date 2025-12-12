/**
 * Native module loader for platform-specific functionality
 * Handles loading of native addons (Rust/C++) with fallback support
 */
export declare class NativeLoader {
    private static instance;
    private loadedModules;
    private constructor();
    static getInstance(): NativeLoader;
    /**
     * Load a native module with fallback to JavaScript implementation
     * @param moduleName Name of the module to load
     * @param fallback Optional fallback implementation
     */
    loadModule<T>(moduleName: string, fallback?: T): T;
    /**
     * Check if a native module is available
     */
    isAvailable(moduleName: string): boolean;
    /**
     * Unload a module from cache
     */
    unloadModule(moduleName: string): void;
    /**
     * Clear all loaded modules
     */
    clearCache(): void;
}
//# sourceMappingURL=native-loader.d.ts.map