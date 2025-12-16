// Export main completion provider
export { InlineCompletionProvider } from './providers/completion-provider';
export { InlineCodeActionProvider } from './providers/code-action-provider';
export { InlineHoverProvider } from './providers/hover-provider';
export { AICommandsProvider } from './providers/commands-provider';
export { SmartCompletionEnhancer } from './providers/smart-completion-enhancer';

// Export handlers
export { PartialAcceptanceHandler } from './handlers/partial-acceptance-handler';

// Export rendering
export { GhostTextDecorator } from './rendering/ghost-text-decorator';

// Export optimization
export { OptimizedStreamingHandler } from './optimization/streaming-handler';
export { CacheWarmer } from './optimization/cache-warmer';

// Export other providers
export * from './providers/definition-provider';
export * from './providers/reference-provider';
export * from './providers/signature-help-provider';
export * from './providers/workspace-symbol-provider';
export * from './providers/import-resolver';
export * from './types';
export { registerAllStrategies } from './strategy-registration';

// Register strategies on module load
import { registerAllStrategies } from './strategy-registration';
registerAllStrategies();
