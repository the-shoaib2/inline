// Context package main exports
export { ContextEngine, CodeContext, FIMTemplate, FIM_TEMPLATES } from './context-engine';
export type {
    ImportInfo,
    ParameterInfo,
    FunctionInfo,
    PropertyInfo,
    ClassInfo,
    InterfaceInfo,
    TypeInfo,
    VariableInfo,
    SymbolInfo,
    ScopeInfo,
    DependencyInfo,
    RelatedCodeBlock,
    EditHistory,
    CursorIntent,
    ProjectConfig,
    CodingPattern,
    StyleGuide,
    ProjectPatterns
} from './context-engine';
export { ContextAnalyzer } from './context-analyzer';
export { ContextOptimizer } from './context-optimizer';
export { ContextSelector } from './context-selector';
export { AdaptiveContextManager, ModelSize } from './adaptive-context-manager';
export { ContextWindowBuilder } from './builders/context-window-builder';
export { ContextEnricher } from './builders/context-enricher';
export { FeedbackLoop } from './analysis/feedback-loop';
