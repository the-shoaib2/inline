/**
 * Native module loader for platform-specific functionality
 * Handles loading of native addons (Rust/C++) with fallback support
 */

export class NativeLoader {
    private static instance: NativeLoader;
    private loadedModules: Map<string, any> = new Map();

    private constructor() {}

    public static getInstance(): NativeLoader {
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
    public loadModule<T>(moduleName: string, fallback?: T): T {
        // Check if already loaded
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }

        try {
            // Try to load native module
            let nativeModule: T;
            
            switch (moduleName) {
                case '@inline/analyzer':
                    nativeModule = require('@inline/analyzer') as T;
                    break;
                case '@inline/accelerator':
                    nativeModule = require('@inline/accelerator') as T;
                    break;
                default:
                    if (fallback) {
                        console.warn(`[NativeLoader] Unknown module '${moduleName}', using fallback`);
                        nativeModule = fallback;
                    } else {
                        throw new Error(`Unknown native module: ${moduleName}`);
                    }
            }

            this.loadedModules.set(moduleName, nativeModule);
            return nativeModule;
        } catch (error) {
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
    public isAvailable(moduleName: string): boolean {
        try {
            this.loadModule(moduleName);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Unload a module from cache
     */
    public unloadModule(moduleName: string): void {
        this.loadedModules.delete(moduleName);
    }

    /**
     * Clear all loaded modules
     */
    public clearCache(): void {
        this.loadedModules.clear();
    }
}
