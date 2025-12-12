// Export model management
export { ModelManager, ModelInfo, ModelRequirements } from './models/model-manager';
export { ModelRegistry } from './registry/model-registry';
export { LlamaInference, InferenceOptions, TokenCallback } from './engines/llama-engine';

// Export optimization
export * from './optimization/performance-tuner';
export * from './optimization/prompt-cache';
export { UserPatternDetector } from './optimization/user-pattern-detector';

// Analysis exports
export { ErrorExplainer } from './analysis/error-explainer';
export { RefactoringEngine } from './analysis/refactoring-engine';
export { RefactoringActions } from './analysis/refactoring-actions';
export { SecurityScanner } from './analysis/security-scanner';
