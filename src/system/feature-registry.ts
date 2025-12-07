import { FeatureStatus } from './feature-tracker';

export const FEATURE_REGISTRY: FeatureStatus[] = [
    // ========== A. CODE INTELLIGENCE FEATURES ==========
    
    // 1. Code Completion
    { id: 'completion-single-line', category: 'Code Completion', name: 'Single-line completion', implemented: true, notes: 'InlineCompletionProvider' },
    { id: 'completion-multi-line', category: 'Code Completion', name: 'Multi-line completion', implemented: true, notes: 'InlineCompletionProvider with maxCompletionLines' },
    { id: 'completion-function', category: 'Code Completion', name: 'Whole function generation', implemented: true, notes: 'FunctionCompleter' },
    { id: 'completion-class', category: 'Code Completion', name: 'Class/interface scaffolding', implemented: true, notes: 'ClassScaffolder' },
    { id: 'completion-import', category: 'Code Completion', name: 'Import statement auto-addition', implemented: true, notes: 'ImportResolver' },
    { id: 'completion-parameter', category: 'Code Completion', name: 'Parameter suggestion', implemented: true, notes: 'Context-aware via ContextEngine' },
    { id: 'completion-method-chain', category: 'Code Completion', name: 'Method chaining completion', implemented: false },
    { id: 'completion-generic-type', category: 'Code Completion', name: 'Generic type inference', implemented: false },
    { id: 'completion-context-aware', category: 'Code Completion', name: 'Context-aware snippets', implemented: true, notes: 'ContextEngine with multi-file analysis' },
    { id: 'completion-bracket-pair', category: 'Code Completion', name: 'Smart bracket/quote pairing', implemented: true, notes: 'SmartCompletionEnhancer' },
    { id: 'completion-auto-close-tag', category: 'Code Completion', name: 'Auto-closing tags (HTML/XML)', implemented: true, notes: 'SmartCompletionEnhancer' },
    { id: 'completion-variable-name', category: 'Code Completion', name: 'Variable name suggestions', implemented: true, notes: 'SmartCompletionEnhancer' },
    { id: 'completion-path', category: 'Code Completion', name: 'Path completion (file paths)', implemented: true, notes: 'PathCompletionProvider' },
    { id: 'completion-regex', category: 'Code Completion', name: 'Regex pattern completion', implemented: true, notes: 'RegexCompletionProvider' },
    { id: 'completion-method-chain', category: 'Code Completion', name: 'Method chaining completion', implemented: true, notes: 'SmartCompletionEnhancer' },

    // 2. Code Generation
    { id: 'gen-function-signature', category: 'Code Generation', name: 'Generate function from signature', implemented: true, notes: 'FunctionCompleter' },
    { id: 'gen-tests', category: 'Code Generation', name: 'Generate tests from code', implemented: true, notes: 'TestGenerator' },
    { id: 'gen-docs', category: 'Code Generation', name: 'Generate documentation', implemented: true, notes: 'DocGenerator' },
    { id: 'gen-getters-setters', category: 'Code Generation', name: 'Generate getters/setters', implemented: true, notes: 'CodeGeneratorUtils' },
    { id: 'gen-constructors', category: 'Code Generation', name: 'Generate constructors', implemented: true, notes: 'CodeGeneratorUtils' },
    { id: 'gen-crud', category: 'Code Generation', name: 'Generate CRUD operations', implemented: true, notes: 'CRUDGenerator' },
    { id: 'gen-api-endpoints', category: 'Code Generation', name: 'Generate API endpoints', implemented: true, notes: 'APIGenerator' },
    { id: 'gen-sql', category: 'Code Generation', name: 'Generate SQL queries', implemented: true, notes: 'SQLGenerator' },
    { id: 'gen-regex', category: 'Code Generation', name: 'Generate regex patterns', implemented: true, notes: 'RegexGenerator' },
    { id: 'gen-mock-data', category: 'Code Generation', name: 'Generate mock data', implemented: true, notes: 'MockDataGenerator' },
    { id: 'gen-type-defs', category: 'Code Generation', name: 'Generate type definitions', implemented: true, notes: 'CodeGeneratorUtils' },
    { id: 'gen-interface-json', category: 'Code Generation', name: 'Generate interfaces from JSON', implemented: true, notes: 'CodeGeneratorUtils' },
    { id: 'gen-dto-model', category: 'Code Generation', name: 'Generate DTO/model classes', implemented: true, notes: 'DTOGenerator' },
    { id: 'gen-boilerplate', category: 'Code Generation', name: 'Generate boilerplate code', implemented: true, notes: 'BoilerplateGenerator' },
    { id: 'gen-config-files', category: 'Code Generation', name: 'Generate configuration files', implemented: true, notes: 'ConfigGenerator' },

    // 3. Code Understanding
    { id: 'understand-explain-code', category: 'Code Understanding', name: 'Explain code in natural language', implemented: true, notes: 'CommandsProvider' },
    { id: 'understand-explain-error', category: 'Code Understanding', name: 'Explain error messages', implemented: true, notes: 'ErrorExplainer' },
    { id: 'understand-complexity', category: 'Code Understanding', name: 'Explain algorithm complexity', implemented: true, notes: 'ComplexityAnalyzer' },
    { id: 'understand-similar-examples', category: 'Code Understanding', name: 'Show similar code examples', implemented: true, notes: 'ContextEngine includeSimilarCode' },
    { id: 'understand-hover-signature', category: 'Code Understanding', name: 'Display function signature on hover', implemented: true, notes: 'InlineHoverProvider' },
    { id: 'understand-hover-docs', category: 'Code Understanding', name: 'Show documentation on hover', implemented: true, notes: 'InlineHoverProvider' },
    { id: 'understand-hover-type', category: 'Code Understanding', name: 'Show type information', implemented: true, notes: 'InlineHoverProvider with type info' },
    { id: 'understand-param-hints', category: 'Code Understanding', name: 'Display parameter hints', implemented: true, notes: 'SignatureHelpProvider' },
    { id: 'understand-design-patterns', category: 'Code Understanding', name: 'Explain design patterns used', implemented: false },

    // 4. Code Navigation
    { id: 'nav-go-to-def', category: 'Code Navigation', name: 'Go to definition', implemented: true, notes: 'DefinitionProvider' },
    { id: 'nav-find-references', category: 'Code Navigation', name: 'Find all references', implemented: true, notes: 'ReferenceProvider' },
    { id: 'nav-symbol', category: 'Code Navigation', name: 'Navigate to symbol', implemented: true, notes: 'WorkspaceSymbolProvider' },
    { id: 'nav-file', category: 'Code Navigation', name: 'Navigate to file', implemented: true, notes: 'FileNavigationProvider' },

    // ========== B. EDITING & REFACTORING FEATURES ==========

    // 6. Refactoring
    { id: 'refactor-rename', category: 'Refactoring', name: 'Rename symbol (all references)', implemented: true, notes: 'RefactoringActions' },
    { id: 'refactor-extract-var', category: 'Refactoring', name: 'Extract variable', implemented: true, notes: 'RefactoringActions' },
    { id: 'refactor-extract-function', category: 'Refactoring', name: 'Extract function/method', implemented: true, notes: 'RefactoringActions' },
    { id: 'refactor-inline-var', category: 'Refactoring', name: 'Inline variable', implemented: true, notes: 'RefactoringActions' },
    { id: 'refactor-suggest', category: 'Refactoring', name: 'Suggest refactorings', implemented: true, notes: 'RefactoringEngine' },
    { id: 'refactor-code', category: 'Refactoring', name: 'Refactor code', implemented: true, notes: 'RefactoringEngine' },

    // 7. Code Actions
    { id: 'action-quick-fix', category: 'Code Actions', name: 'Quick fix suggestions', implemented: true, notes: 'InlineCodeActionProvider' },
    { id: 'action-organize-imports', category: 'Code Actions', name: 'Organize imports', implemented: true, notes: 'ImportResolver' },
    { id: 'action-remove-unused', category: 'Code Actions', name: 'Remove unused imports', implemented: true, notes: 'ImportResolver' },
    { id: 'action-add-imports', category: 'Code Actions', name: 'Add missing imports', implemented: true, notes: 'ImportResolver' },
    { id: 'action-fix-all-file', category: 'Code Actions', name: 'Fix all in file', implemented: true, notes: 'AutoFixProvider' },

    // ========== C. ERROR DETECTION & DEBUGGING ==========

    // 8. Error Detection
    { id: 'error-syntax', category: 'Error Detection', name: 'Syntax error highlighting', implemented: true, notes: 'SyntaxValidator' },
    { id: 'error-semantic', category: 'Error Detection', name: 'Semantic error detection', implemented: true, notes: 'SemanticValidator' },
    { id: 'error-type-check', category: 'Error Detection', name: 'Type checking', implemented: true, notes: 'TypeChecker' },
    { id: 'error-lint', category: 'Error Detection', name: 'Linting (style violations)', implemented: true, notes: 'Linter' },
    { id: 'error-unused-var', category: 'Error Detection', name: 'Unused variable detection', implemented: true, notes: 'ErrorDetectionSystem' },
    { id: 'error-security-scan', category: 'Error Detection', name: 'Security vulnerability scan', implemented: true, notes: 'SecurityScanner' },
    { id: 'error-dead-code', category: 'Error Detection', name: 'Dead code detection', implemented: true, notes: 'ErrorDetectionSystem' },

    // 9. Error Assistance
    { id: 'error-explain', category: 'Error Assistance', name: 'Error explanation in plain language', implemented: true, notes: 'ErrorExplainer' },
    { id: 'error-quick-fix', category: 'Error Assistance', name: 'Quick fix suggestions', implemented: true, notes: 'InlineCodeActionProvider' },
    { id: 'error-auto-fix', category: 'Error Assistance', name: 'Auto-fix available errors', implemented: true, notes: 'AutoFixProvider' },

    // ========== D. SMART COMMANDS ==========

    // Chat Features (REMOVED - 3 features)
    { id: 'chat-interface', name: 'Natural Language Chat', category: 'chat', implemented: false, notes: 'Feature removed per user request' },
    { id: 'chat-how-to', name: 'How-to Assistant', category: 'chat', implemented: false, notes: 'Feature removed per user request' },
    { id: 'chat-explain', name: 'Code Explanation Requests', category: 'chat', implemented: false, notes: 'Feature removed per user request' },

    // 13. Smart Commands
    { id: 'cmd-explain', category: 'Smart Commands', name: '/explain - explain selected code', implemented: true, notes: 'CommandsProvider' },
    { id: 'cmd-fix', category: 'Smart Commands', name: '/fix - fix errors', implemented: true, notes: 'CommandsProvider fixCode' },
    { id: 'cmd-optimize', category: 'Smart Commands', name: '/optimize - improve performance', implemented: true, notes: 'CommandsProvider optimizeCode' },
    { id: 'cmd-test', category: 'Smart Commands', name: '/test - generate tests', implemented: true, notes: 'TestGenerator' },
    { id: 'cmd-document', category: 'Smart Commands', name: '/document - add documentation', implemented: true, notes: 'DocGenerator' },
    { id: 'cmd-refactor', category: 'Smart Commands', name: '/refactor - suggest improvements', implemented: true, notes: 'RefactoringEngine' },
    { id: 'cmd-security', category: 'Smart Commands', name: '/security - security analysis', implemented: true, notes: 'SecurityScanner' },

    // ========== E. TESTING FEATURES ==========

    // 14. Test Generation
    { id: 'test-gen-unit', category: 'Test Generation', name: 'Unit test generation', implemented: true, notes: 'TestGenerator' },
    { id: 'test-gen-integration', category: 'Test Generation', name: 'Integration test generation', implemented: true, notes: 'IntegrationTestGenerator' },
    { id: 'test-gen-e2e', category: 'Test Generation', name: 'E2E test generation', implemented: true, notes: 'E2ETestGenerator' },
    { id: 'test-gen-cases', category: 'Test Generation', name: 'Test case suggestions', implemented: true, notes: 'TestGenerator' },
    { id: 'test-gen-mock', category: 'Test Generation', name: 'Mock/stub generation', implemented: true, notes: 'MockGenerator' },

    // ========== F. COLLABORATION FEATURES ==========

    // 17. Version Control (Git)
    { id: 'git-commit-msg', category: 'Version Control', name: 'Commit with auto-generated message', implemented: true, notes: 'PRGenerator generateCommitMessage' },
    { id: 'git-pr-summary', category: 'Version Control', name: 'PR summary generation', implemented: true, notes: 'PRGenerator' },
    { id: 'git-tracking', category: 'Version Control', name: 'VCS event tracking', implemented: true, notes: 'VCSEventTracker' },

    // ========== G. SEARCH & DISCOVERY ==========

    // 20. Search Features
    { id: 'search-text', category: 'Search', name: 'Text search (find/replace)', implemented: true, notes: 'TextSearchProvider' },
    { id: 'search-similar-code', category: 'Search', name: 'Find similar code', implemented: true, notes: 'DuplicationDetector' },
    { id: 'search-duplicates', category: 'Search', name: 'Find duplicates', implemented: true, notes: 'DuplicationDetector' },

    // ========== H. DOCUMENTATION FEATURES ==========

    // 22. Auto-documentation
    { id: 'doc-gen-jsdoc', category: 'Documentation', name: 'Generate JSDoc/docstrings', implemented: true, notes: 'DocGenerator' },
    { id: 'doc-gen-file', category: 'Documentation', name: 'Document entire file', implemented: true, notes: 'DocGenerator documentFile' },
    { id: 'doc-gen-api', category: 'Documentation', name: 'Generate API docs', implemented: true, notes: 'APIDocGenerator (via BoilerplateGenerator)' },

    // ========== I. PROJECT MANAGEMENT ==========

    // 25. Dependency Management
    { id: 'dep-check', category: 'Dependency Management', name: 'Dependency checking', implemented: true, notes: 'DependencyChecker' },
    { id: 'dep-vulnerability', category: 'Dependency Management', name: 'Vulnerability scanning', implemented: true, notes: 'VulnerabilityScanner' },

    // 26. Build & Run
    { id: 'build-compile', category: 'Build & Run', name: 'Build project', implemented: true, notes: 'CompilationManager' },
    { id: 'build-auto-save', category: 'Build & Run', name: 'Auto-build on save', implemented: true, notes: 'TriggerEngine' },
    { id: 'build-idle', category: 'Build & Run', name: 'Background idle build', implemented: true, notes: 'TriggerEngine' },
    { id: 'build-suggest', category: 'Build & Run', name: 'Suggest rebuild when outdated', implemented: true, notes: 'CompilationSuggestionProvider' },
    { id: 'build-state-track', category: 'Build & Run', name: 'Build state tracking', implemented: true, notes: 'BuildStateTracker' },

    // ========== J. TERMINAL & COMMAND ==========

    // 27. Integrated Terminal
    { id: 'terminal-tracking', category: 'Terminal', name: 'Terminal event tracking', implemented: true, notes: 'TerminalCollector' },
    { id: 'terminal-suggest', category: 'Terminal', name: 'Command suggestions', implemented: true, notes: 'TerminalAssistant' },
    { id: 'terminal-explain', category: 'Terminal', name: 'Explain terminal commands', implemented: true, notes: 'TerminalAssistant' },

    // ========== K. PERFORMANCE & DIAGNOSTICS ==========

    // 37. Performance Tools
    { id: 'perf-monitor', category: 'Performance', name: 'Performance monitoring', implemented: true, notes: 'PerformanceMonitor' },
    { id: 'perf-metrics', category: 'Performance', name: 'Performance metrics', implemented: true, notes: 'PerformanceEventCollector' },
    { id: 'perf-tuner', category: 'Performance', name: 'Auto-tuning', implemented: true, notes: 'PerformanceTuner' },

    // 38. Diagnostics
    { id: 'diag-error-logs', category: 'Diagnostics', name: 'Error logs', implemented: true, notes: 'ErrorHandler' },
    { id: 'diag-logger', category: 'Diagnostics', name: 'Logging system', implemented: true, notes: 'Logger' },
    { id: 'diag-telemetry', category: 'Diagnostics', name: 'Telemetry', implemented: true, notes: 'TelemetryManager' },
    { id: 'diag-collector', category: 'Diagnostics', name: 'Diagnostic collection', implemented: true, notes: 'DiagnosticCollector' },

    // ========== L. CACHING & OPTIMIZATION ==========

    { id: 'cache-completion', category: 'Caching', name: 'Completion caching', implemented: true, notes: 'CacheManager, LRU cache' },
    { id: 'cache-prompt', category: 'Caching', name: 'Prompt caching', implemented: true, notes: 'PromptCache' },
    { id: 'cache-kv', category: 'Caching', name: 'KV cache for inference', implemented: true, notes: 'LlamaInference' },
    { id: 'cache-symbol', category: 'Caching', name: 'Symbol caching', implemented: true, notes: 'ContextEngine symbolCacheSize' },
    { id: 'opt-streaming', category: 'Optimization', name: 'Streaming token generation', implemented: true, notes: 'LlamaInference streaming' },
    { id: 'opt-speculative', category: 'Optimization', name: 'Speculative decoding', implemented: true, notes: 'Config speculativeDecoding' },
    { id: 'opt-parallel', category: 'Optimization', name: 'Parallel processing', implemented: true, notes: 'ParallelProcessor' },
    { id: 'opt-dedup', category: 'Optimization', name: 'Code deduplication', implemented: true, notes: 'DuplicationDetector' },

    // ========== M. MODEL MANAGEMENT ==========

    { id: 'model-download', category: 'Model Management', name: 'Model download', implemented: true, notes: 'ModelDownloader' },
    { id: 'model-manager-ui', category: 'Model Management', name: 'Model manager UI', implemented: true, notes: 'WebviewProvider' },
    { id: 'model-registry', category: 'Model Management', name: 'Model registry', implemented: true, notes: 'ModelRegistry' },
    { id: 'model-validation', category: 'Model Management', name: 'Model validation', implemented: true, notes: 'ModelValidator' },
    { id: 'model-auto-select', category: 'Model Management', name: 'Auto model selection', implemented: true, notes: 'ModelManager' },
    { id: 'model-warmup', category: 'Model Management', name: 'Model warmup', implemented: true, notes: 'Extension activation' },
    { id: 'model-quantization', category: 'Model Management', name: 'Quantization management', implemented: true, notes: 'QuantizationManager' },

    // ========== N. CONTEXT INTELLIGENCE ==========

    { id: 'context-multi-file', category: 'Context Intelligence', name: 'Multi-file analysis', implemented: true, notes: 'ContextEngine enableMultiFileAnalysis' },
    { id: 'context-types', category: 'Context Intelligence', name: 'Type definitions', implemented: true, notes: 'ContextEngine includeTypes' },
    { id: 'context-similar', category: 'Context Intelligence', name: 'Similar code examples', implemented: true, notes: 'ContextEngine includeSimilarCode' },
    { id: 'context-adaptive', category: 'Context Intelligence', name: 'Adaptive context ratio', implemented: true, notes: 'ContextEngine adaptiveRatio' },
    { id: 'context-enricher', category: 'Context Intelligence', name: 'Context enrichment', implemented: true, notes: 'ContextEnricher' },
    { id: 'context-window-builder', category: 'Context Intelligence', name: 'Context window building', implemented: true, notes: 'ContextWindowBuilder' },
    { id: 'context-state-manager', category: 'Context Intelligence', name: 'State management', implemented: true, notes: 'StateManager' },

    // ========== O. EVENT TRACKING ==========

    { id: 'event-bus', category: 'Event Tracking', name: 'Event bus system', implemented: true, notes: 'EventBus' },
    { id: 'event-editor', category: 'Event Tracking', name: 'Editor event tracking', implemented: true, notes: 'EditorCollector' },
    { id: 'event-file-system', category: 'Event Tracking', name: 'File system event tracking', implemented: true, notes: 'FileSystemCollector' },
    { id: 'event-user-interaction', category: 'Event Tracking', name: 'User interaction tracking', implemented: true, notes: 'UserInteractionCollector' },
    { id: 'event-code-mod', category: 'Event Tracking', name: 'Code modification tracking', implemented: true, notes: 'CodeModificationCollector' },
    { id: 'event-context', category: 'Event Tracking', name: 'Context tracking', implemented: true, notes: 'ContextTracker' },
    { id: 'event-session', category: 'Event Tracking', name: 'Session state tracking', implemented: true, notes: 'SessionStateTracker' },
    { id: 'event-normalizer', category: 'Event Tracking', name: 'Event normalization', implemented: true, notes: 'EventNormalizer' },
    { id: 'event-manager', category: 'Event Tracking', name: 'Event tracking manager', implemented: true, notes: 'EventTrackingManager' },

    // ========== P. RESOURCE MANAGEMENT ==========

    { id: 'resource-monitor', category: 'Resource Management', name: 'Resource monitoring', implemented: true, notes: 'ResourceManager' },
    { id: 'resource-memory', category: 'Resource Management', name: 'Memory management', implemented: true, notes: 'MemoryManager' },
    { id: 'resource-gpu', category: 'Resource Management', name: 'GPU detection', implemented: true, notes: 'GPUDetector' },
    { id: 'resource-process-info', category: 'Resource Management', name: 'Process info display', implemented: true, notes: 'ProcessInfoDisplay' },

    // ========== Q. NETWORK & OFFLINE ==========

    { id: 'network-detect', category: 'Network', name: 'Network detection', implemented: true, notes: 'NetworkDetector' },
    { id: 'network-offline-mode', category: 'Network', name: 'Offline mode', implemented: true, notes: 'NetworkDetector toggleOfflineMode' },
    { id: 'network-auto-offline', category: 'Network', name: 'Auto offline activation', implemented: true, notes: 'Config autoOffline' },
    { id: 'network-config', category: 'Network', name: 'Network configuration', implemented: true, notes: 'NetworkConfig' },

    // ========== R. CONFIGURATION ==========

    { id: 'config-manager', category: 'Configuration', name: 'Configuration management', implemented: true, notes: 'ConfigManager' },
    { id: 'config-language', category: 'Configuration', name: 'Language configuration service', implemented: true, notes: 'LanguageConfigService' },
    { id: 'config-coding-rules', category: 'Configuration', name: 'Custom coding rules', implemented: true, notes: 'Config codingRules' },
    { id: 'config-fim', category: 'Configuration', name: 'Custom FIM tokens', implemented: true, notes: 'Config fim' },

    // ========== S. UI & STATUS ==========

    { id: 'ui-status-bar', category: 'UI', name: 'Status bar manager', implemented: true, notes: 'StatusBarManager' },
    { id: 'ui-webview', category: 'UI', name: 'Webview provider', implemented: true, notes: 'WebviewProvider' },
    { id: 'ui-model-manager', category: 'UI', name: 'Model manager view', implemented: true, notes: 'ModelManagerView' },

    // ========== T. VALIDATION & ANALYSIS ==========

    { id: 'validate-completion', category: 'Validation', name: 'Completion validation', implemented: true, notes: 'CompletionValidator' },
    { id: 'analyze-ast', category: 'Analysis', name: 'AST parsing', implemented: true, notes: 'ASTParser' },
    { id: 'analyze-semantic', category: 'Analysis', name: 'Semantic analysis', implemented: true, notes: 'SemanticAnalyzer' },
    { id: 'analyze-user-pattern', category: 'Analysis', name: 'User pattern detection', implemented: true, notes: 'UserPatternDetector' },

    // ========== U. FEEDBACK & LEARNING ==========

    { id: 'feedback-loop', category: 'Feedback', name: 'Feedback loop system', implemented: true, notes: 'FeedbackLoop' },
    { id: 'feedback-optimization', category: 'Feedback', name: 'Optimization layer', implemented: true, notes: 'OptimizationLayer' },
];
