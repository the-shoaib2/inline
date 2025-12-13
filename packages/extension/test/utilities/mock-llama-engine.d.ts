import { InferenceOptions, TokenCallback } from '@inline/intelligence';
import * as vscode from 'vscode';
/**
 * Mock implementation of LlamaInference for E2E testing.
 * Provides realistic completions without requiring actual GGUF models.
 */
export declare class MockLlamaEngine {
    private isLoaded;
    private currentModelPath;
    loadModel(modelPath: string, options?: {
        threads?: number;
        gpuLayers?: number;
        contextSize?: number;
        fimTemplate?: string;
    }): Promise<void>;
    unloadModel(): Promise<void>;
    generateCompletion(prompt: string, options?: InferenceOptions, onToken?: TokenCallback, cancellationToken?: vscode.CancellationToken): Promise<string>;
    generateImprovement(code: string, instruction: string, options?: InferenceOptions): Promise<string>;
    isModelLoaded(): boolean;
    getModelPath(): string | null;
    getModelStatus(): {
        loaded: boolean;
        modelPath: string | null;
    };
    private detectLanguage;
    private detectIntent;
    private generateResponse;
    private generateTypeScriptCompletion;
    private generatePythonCompletion;
    private generateJavaCompletion;
    private generateGoCompletion;
    private generateGenericCompletion;
    cachePrefix(key: string, tokens: any[]): void;
    getCachedPrefix(key: string): any[] | null;
    clearPrefixCache(): void;
    getCacheStats(): {
        size: number;
        maxSize: number;
    };
}
//# sourceMappingURL=mock-llama-engine.d.ts.map