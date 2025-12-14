// Export main context engine
export { ContextEngine, CodeContext, CursorIntent, FunctionInfo, ImportInfo, TypeInfo, InterfaceInfo, SymbolInfo, ProjectPatterns, FIMTemplate, FIM_TEMPLATES } from './context-engine';

// Export context builders
export { ContextWindowBuilder } from './builders/context-window-builder';
export { ContextEnricher } from './builders/context-enricher';
export { SmartContextBuilder, SmartContext, FileContext, ClassContext, FunctionContext, InterfaceContext, PrioritizedSmartContext } from './builders/smart-context-builder';

// Export context analysis
export { ContextAnalyzer } from './context-analyzer';
export { ContextSelector, OptimizedContext, PrioritizedContext } from './context-selector';
export { ContextOptimizer } from './context-optimizer';

// Export adaptive context management
export { AdaptiveContextManager, ModelSize, ContextConfig } from './adaptive-context-manager';

// Export smart context detection (NEW)
export { FileTypeDetector, FileType, CodeType, FileTypeResult } from './analysis/file-type-detector';
export { FileRelationshipMapper, FileRelationship, RelationshipType } from './analysis/file-relationship-mapper';
export { FeedbackLoop } from './analysis/feedback-loop';
export { CrossFileContextAnalyzer, CrossFileContext } from './analysis/cross-file-context-analyzer';
