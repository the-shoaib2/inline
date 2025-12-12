/**
 * Model size classification for context optimization.
 */
export declare enum ModelSize {
    SMALL = "small",// < 10B parameters (e.g., 1B, 3B, 7B)
    MEDIUM = "medium",// 10B - 40B parameters (e.g., 13B, 34B)
    LARGE = "large"
}
/**
 * Context configuration parameters optimized for different model sizes.
 */
export interface ContextConfig {
    enableVerboseHeader: boolean;
    maxContextLength: number;
    includeTypeDefinitions: boolean;
    includeFunctionSignatures: boolean;
    includeRelatedFiles: boolean;
    includeProjectRules: boolean;
    includeCodingPatterns: boolean;
    maxRelatedFiles: number;
    maxFunctions: number;
    maxTypes: number;
}
/**
 * Automatically adjusts context verbosity based on model capabilities.
 *
 * Optimizes context inclusion to balance:
 * - Small models: Minimal context to avoid confusion
 * - Medium models: Balanced context for good performance
 * - Large models: Rich context for maximum quality
 */
export declare class AdaptiveContextManager {
    /**
     * Detect model size from parameter count or filename patterns.
     * Supports various naming conventions and metadata formats.
     */
    static detectModelSize(modelName: string, parameterCount?: string): ModelSize;
    /**
     * Get optimal context configuration for detected model size.
     * Respects user preferences while applying size-based optimizations.
     */
    static getContextConfig(modelSize: ModelSize): ContextConfig;
    /**
     * Generate recommended VSCode settings for model size.
     * Includes context and inference parameters optimized for each tier.
     */
    static getRecommendedSettings(modelSize: ModelSize): Record<string, any>;
    /**
     * Get human-readable description of model capabilities.
     */
    static getModelSizeDescription(modelSize: ModelSize): string;
}
//# sourceMappingURL=adaptive-context-manager.d.ts.map