import * as vscode from 'vscode';

export enum ModelSize {
    SMALL = 'small',      // < 10B parameters (e.g., 1B, 3B, 7B)
    MEDIUM = 'medium',    // 10B - 40B parameters (e.g., 13B, 34B)
    LARGE = 'large'       // > 40B parameters (e.g., 70B, 405B)
}

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
 * Adaptive Context Manager
 * Automatically adjusts context verbosity based on model size
 */
export class AdaptiveContextManager {
    
    /**
     * Detect model size from parameter count or filename
     */
    static detectModelSize(modelName: string, parameterCount?: string): ModelSize {
        // Extract parameter count from name or metadata
        const name = modelName.toLowerCase();
        
        // Parse parameter count
        let params = 0;
        if (parameterCount) {
            const match = parameterCount.match(/(\d+(?:\.\d+)?)\s*([bm])/i);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].toLowerCase();
                params = unit === 'b' ? value : value / 1000;
            }
        }
        
        // Try to extract from filename (e.g., "qwen-7b", "llama-70b", "phi-3b")
        if (params === 0) {
            const sizeMatch = name.match(/(\d+(?:\.\d+)?)\s*b/i);
            if (sizeMatch) {
                params = parseFloat(sizeMatch[1]);
            }
        }
        
        // Classify by size
        if (params > 0) {
            if (params < 10) return ModelSize.SMALL;
            if (params < 40) return ModelSize.MEDIUM;
            return ModelSize.LARGE;
        }
        
        // Fallback: detect from common model names
        if (name.includes('1b') || name.includes('3b') || name.includes('7b')) {
            return ModelSize.SMALL;
        }
        if (name.includes('13b') || name.includes('34b')) {
            return ModelSize.MEDIUM;
        }
        if (name.includes('70b') || name.includes('405b')) {
            return ModelSize.LARGE;
        }
        
        // Default to small for safety
        return ModelSize.SMALL;
    }
    
    /**
     * Get optimal context configuration for model size
     */
    static getContextConfig(modelSize: ModelSize): ContextConfig {
        const config = vscode.workspace.getConfiguration('inline');
        
        // Check if user has explicitly set verbose mode
        const userVerbose = config.get<boolean>('context.enableVerboseHeader');
        const hasUserPreference = userVerbose !== undefined;
        
        switch (modelSize) {
            case ModelSize.SMALL:
                // Minimal context for small models (< 10B)
                // These models can get confused with too much information
                return {
                    enableVerboseHeader: hasUserPreference ? userVerbose! : false,
                    maxContextLength: 2000,
                    includeTypeDefinitions: false,
                    includeFunctionSignatures: false,
                    includeRelatedFiles: false,
                    includeProjectRules: true,  // Keep project rules
                    includeCodingPatterns: false,
                    maxRelatedFiles: 0,
                    maxFunctions: 0,
                    maxTypes: 0
                };
                
            case ModelSize.MEDIUM:
                // Balanced context for medium models (10B-40B)
                // Can handle moderate context without confusion
                return {
                    enableVerboseHeader: hasUserPreference ? userVerbose! : true,
                    maxContextLength: 4000,
                    includeTypeDefinitions: true,
                    includeFunctionSignatures: true,
                    includeRelatedFiles: true,
                    includeProjectRules: true,
                    includeCodingPatterns: true,
                    maxRelatedFiles: 2,
                    maxFunctions: 5,
                    maxTypes: 5
                };
                
            case ModelSize.LARGE:
                // Full context for large models (> 40B)
                // Can handle extensive context and benefit from it
                return {
                    enableVerboseHeader: hasUserPreference ? userVerbose! : true,
                    maxContextLength: 8000,
                    includeTypeDefinitions: true,
                    includeFunctionSignatures: true,
                    includeRelatedFiles: true,
                    includeProjectRules: true,
                    includeCodingPatterns: true,
                    maxRelatedFiles: 5,
                    maxFunctions: 10,
                    maxTypes: 10
                };
        }
    }
    
    /**
     * Get recommended settings for model size
     */
    static getRecommendedSettings(modelSize: ModelSize): Record<string, any> {
        switch (modelSize) {
            case ModelSize.SMALL:
                return {
                    'inline.context.enableVerboseHeader': false,
                    'inline.context.maxContextLength': 2000,
                    'inline.context.includeRelatedFiles': false,
                    'inline.inference.maxTokens': 256,
                    'inline.inference.temperature': 0.7,
                    'inline.inference.topP': 0.9
                };
                
            case ModelSize.MEDIUM:
                return {
                    'inline.context.enableVerboseHeader': true,
                    'inline.context.maxContextLength': 4000,
                    'inline.context.includeRelatedFiles': true,
                    'inline.inference.maxTokens': 512,
                    'inline.inference.temperature': 0.6,
                    'inline.inference.topP': 0.95
                };
                
            case ModelSize.LARGE:
                return {
                    'inline.context.enableVerboseHeader': true,
                    'inline.context.maxContextLength': 8000,
                    'inline.context.includeRelatedFiles': true,
                    'inline.inference.maxTokens': 1024,
                    'inline.inference.temperature': 0.5,
                    'inline.inference.topP': 0.95
                };
        }
    }
    
    /**
     * Get human-readable description of model size
     */
    static getModelSizeDescription(modelSize: ModelSize): string {
        switch (modelSize) {
            case ModelSize.SMALL:
                return 'Small Model (< 10B parameters) - Optimized for speed, minimal context';
            case ModelSize.MEDIUM:
                return 'Medium Model (10B-40B parameters) - Balanced performance, moderate context';
            case ModelSize.LARGE:
                return 'Large Model (> 40B parameters) - Maximum quality, extensive context';
        }
    }
}
