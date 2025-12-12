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
exports.AdaptiveContextManager = exports.ModelSize = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Model size classification for context optimization.
 */
var ModelSize;
(function (ModelSize) {
    ModelSize["SMALL"] = "small";
    ModelSize["MEDIUM"] = "medium";
    ModelSize["LARGE"] = "large"; // > 40B parameters (e.g., 70B, 405B)
})(ModelSize || (exports.ModelSize = ModelSize = {}));
/**
 * Automatically adjusts context verbosity based on model capabilities.
 *
 * Optimizes context inclusion to balance:
 * - Small models: Minimal context to avoid confusion
 * - Medium models: Balanced context for good performance
 * - Large models: Rich context for maximum quality
 */
class AdaptiveContextManager {
    /**
     * Detect model size from parameter count or filename patterns.
     * Supports various naming conventions and metadata formats.
     */
    static detectModelSize(modelName, parameterCount) {
        const name = modelName.toLowerCase();
        // Parse parameter count from metadata if available
        let params = 0;
        if (parameterCount) {
            const match = parameterCount.match(/(\d+(?:\.\d+)?)\s*([bm])/i);
            if (match) {
                const value = parseFloat(match[1]);
                const unit = match[2].toLowerCase();
                params = unit === 'b' ? value : value / 1000;
            }
        }
        // Extract from filename patterns (e.g., "qwen-7b", "llama-70b", "phi-3b")
        if (params === 0) {
            const sizeMatch = name.match(/(\d+(?:\.\d+)?)\s*b/i);
            if (sizeMatch) {
                params = parseFloat(sizeMatch[1]);
            }
        }
        // Classify by parameter count
        if (params > 0) {
            if (params < 10)
                return ModelSize.SMALL;
            if (params < 40)
                return ModelSize.MEDIUM;
            return ModelSize.LARGE;
        }
        // Fallback to common model name patterns
        if (name.includes('1b') || name.includes('3b') || name.includes('7b')) {
            return ModelSize.SMALL;
        }
        if (name.includes('13b') || name.includes('34b')) {
            return ModelSize.MEDIUM;
        }
        if (name.includes('70b') || name.includes('405b')) {
            return ModelSize.LARGE;
        }
        // Default to small for safety and performance
        return ModelSize.SMALL;
    }
    /**
     * Get optimal context configuration for detected model size.
     * Respects user preferences while applying size-based optimizations.
     */
    static getContextConfig(modelSize) {
        const config = vscode.workspace.getConfiguration('inline');
        // Check for explicit user preference
        const userVerbose = config.get('context.enableVerboseHeader');
        const hasUserPreference = userVerbose !== undefined;
        switch (modelSize) {
            case ModelSize.SMALL:
                // Minimal context for small models (< 10B)
                // These models get confused with too much information
                return {
                    enableVerboseHeader: hasUserPreference ? userVerbose : false,
                    maxContextLength: 2000,
                    includeTypeDefinitions: false,
                    includeFunctionSignatures: false,
                    includeRelatedFiles: false,
                    includeProjectRules: true, // Keep essential project rules
                    includeCodingPatterns: false,
                    maxRelatedFiles: 0,
                    maxFunctions: 0,
                    maxTypes: 0
                };
            case ModelSize.MEDIUM:
                // Balanced context for medium models (10B-40B)
                // Can handle moderate context without confusion
                return {
                    enableVerboseHeader: hasUserPreference ? userVerbose : true,
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
                    enableVerboseHeader: hasUserPreference ? userVerbose : true,
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
     * Generate recommended VSCode settings for model size.
     * Includes context and inference parameters optimized for each tier.
     */
    static getRecommendedSettings(modelSize) {
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
     * Get human-readable description of model capabilities.
     */
    static getModelSizeDescription(modelSize) {
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
exports.AdaptiveContextManager = AdaptiveContextManager;
//# sourceMappingURL=adaptive-context-manager.js.map