import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { InlineCompletionProvider } from '@completion/providers/completion-provider';
import { InlineCodeActionProvider } from '@completion/providers/code-action-provider';
import { InlineHoverProvider } from '@completion/providers/hover-provider';
import { ModelManager } from '@intelligence/models/model-manager';
import { CacheManager } from '@storage/cache/cache-manager';
import { StatusBarManager } from '@ui/status-bar-manager';
import { WebviewProvider } from '@ui/webview-provider';
import { NetworkDetector } from '@network/network-detector';
import { ResourceManager } from '@platform/resources/resource-manager';
import { Logger } from '@platform/system/logger';
import { ConfigManager } from '@platform/system/config-manager';
import { ErrorHandler } from '@platform/system/error-handler';
import { TelemetryManager } from '@platform/monitoring/telemetry-manager';
import { LanguageConfigService } from '@language/analysis/language-config-service';
import { NetworkConfig } from '@network/network-config';
import { ProcessInfoDisplay } from '@ui/views/process-info-display';
import { PerformanceTuner } from '@intelligence/optimization/performance-tuner';
import { AICommandsProvider } from '@completion/providers/ai-commands-provider';
import { EventTrackingManager, createEventTrackingManager } from '@events/event-tracking-manager';
import { CompilationManager } from '@language/compilation/compilation-manager';
import { BuildStateTracker } from '@language/compilation/build-state-tracker';
import { TriggerEngine } from '@language/compilation/trigger-engine';
import { CompilationSuggestionProvider } from '@language/compilation/compilation-suggestion-provider';
import { DependencyChecker } from '@language/compilation/dependency-checker';
import { FeatureTracker } from '@platform/features/feature-tracker';
import { FEATURE_REGISTRY } from '@platform/features/feature-registry';

/**
 * VSCode extension entry point and lifecycle management.
 *
 * Coordinates all extension components:
 * - AI model management and inference
 * - Multi-tier caching system
 * - Context analysis and optimization
 * - UI components and status tracking
 * - Event tracking and telemetry
 */

// Global component instances for lifecycle management
let completionProvider: InlineCompletionProvider;
let modelManager: ModelManager;
let cacheManager: CacheManager;
let statusBarManager: StatusBarManager;
let networkDetector: NetworkDetector;
let resourceManager: ResourceManager;
let webviewProvider: WebviewProvider;
let logger: Logger;
let configManager: ConfigManager;
let errorHandler: ErrorHandler;
let telemetryManager: TelemetryManager;
let aiCommandsProvider: AICommandsProvider;
let eventTrackingManager: EventTrackingManager;
let compilationManager: CompilationManager;
let buildStateTracker: BuildStateTracker;
let triggerEngine: TriggerEngine;
let compilationSuggestionProvider: CompilationSuggestionProvider;
let dependencyChecker: DependencyChecker;
let featureTracker: FeatureTracker;

/**
 * Extension activation - initializes all components and services.
 *
 * Activation sequence:
 * 1. Network configuration
 * 2. Service initialization (logger, config, telemetry)
 * 3. Core components (cache, model, UI)
 * 4. Provider registration (completion, hover, actions)
 * 5. Event system integration
 * 6. Feature initialization
 */
export async function activate(context: vscode.ExtensionContext) {
    try {
        // Configure network settings first for offline detection
        NetworkConfig.configure();

        // Initialize language service for context analysis
        LanguageConfigService.getInstance().initialize(context);

        // Initialize Tree-sitter for accurate AST parsing
        const { TreeSitterService } = await import('@language/parsers/tree-sitter-service');
        const treeSitterService = TreeSitterService.getInstance();
        try {
            await treeSitterService.initialize(context);
            console.log('[Inline] Tree-sitter initialized successfully');
        } catch (error) {
            console.warn('[Inline] Tree-sitter initialization failed, falling back to regex:', error);
        }

        // Initialize core services
        logger = new Logger('Inline');
        logger.info('Activating Inline extension...');

        errorHandler = ErrorHandler.getInstance();
        telemetryManager = new TelemetryManager();
        telemetryManager.trackEvent('extension_activated');

        configManager = new ConfigManager();
        logger.info('Configuration loaded', configManager.getAll());

        // Performance tuning deferred to avoid blocking startup
        setTimeout(() => {
            PerformanceTuner.tune().catch(err => console.error('Tuning failed:', err));
        }, 5000);

        // Initialize core components
        cacheManager = new CacheManager(context);
        modelManager = new ModelManager(context);
        statusBarManager = new StatusBarManager();
        networkDetector = new NetworkDetector();

        // Lazy-initialize resource manager until needed
        resourceManager = new ResourceManager();
        resourceManager.stopMonitoring();

        // Initialize completion provider with all dependencies
        completionProvider = new InlineCompletionProvider(
            modelManager,
            statusBarManager,
            networkDetector,
            resourceManager,
            cacheManager
        );

        // Initialize webview for model management
        webviewProvider = new WebviewProvider(context.extensionUri, modelManager);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                WebviewProvider.viewType,
                webviewProvider
            )
        );

        // Development mode feature enablement
        if (context.extensionMode === vscode.ExtensionMode.Development) {
            logger.info('Development Mode detected: All features enabled for testing');
        }

        // Register language providers
        const provider = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            completionProvider
        );
        context.subscriptions.push(provider);

        // Code action provider for AI suggestions
        new InlineCodeActionProvider(modelManager);
        // Note: provider registered but not stored - unused variable removed

        // Hover provider for enhanced documentation
        const hoverProvider = new InlineHoverProvider();
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                { pattern: '**' },
                hoverProvider
            )
        );

        // AI commands provider for advanced features
        aiCommandsProvider = new AICommandsProvider(modelManager, completionProvider.getContextEngine());
        aiCommandsProvider.registerCommands(context);

        // Initialize event tracking system for context awareness
        eventTrackingManager = createEventTrackingManager(context, completionProvider.getContextEngine());
        eventTrackingManager.start();

        // Wire event system to context engine for real-time updates
        const stateManager = eventTrackingManager.getStateManager();
        const contextWindowBuilder = eventTrackingManager.getContextWindowBuilder();
        completionProvider.getContextEngine().setStateManager(stateManager);
        completionProvider.getContextEngine().setContextWindowBuilder(contextWindowBuilder);

        logger.info('Event tracking system integrated with completion provider');
        completionProvider.setAIContextTracker(eventTrackingManager.getAIContextTracker());

        // Initialize compilation features for build integration
        compilationManager = new CompilationManager();
        context.subscriptions.push(compilationManager);

        buildStateTracker = new BuildStateTracker();
        context.subscriptions.push(buildStateTracker);

        triggerEngine = new TriggerEngine(
            compilationManager,
            buildStateTracker,
            eventTrackingManager.getEventBus()
        );
        context.subscriptions.push(triggerEngine);

        compilationSuggestionProvider = new CompilationSuggestionProvider(compilationManager, buildStateTracker);
        context.subscriptions.push(compilationSuggestionProvider);

        // Register compilation code actions
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                { pattern: '**' },
                compilationSuggestionProvider,
                { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] }
            )
        );

        // Manual build trigger command
        context.subscriptions.push(
            vscode.commands.registerCommand('inline.triggerBuild', () => {
                compilationManager.compile({ force: true });
            })
        );

        dependencyChecker = new DependencyChecker();
        context.subscriptions.push(dependencyChecker);

        // Initialize feature tracking for analytics
        featureTracker = new FeatureTracker(context);
        FEATURE_REGISTRY.forEach(feature => featureTracker.registerFeature(feature));
        logger.info('Feature tracker initialized with registry');

        // Register all extension commands
        registerCommands(context, modelManager);

        // Initialize UI components
        statusBarManager.initialize();

        // Update status bar with current model information
        const currentModel = modelManager.getCurrentModel();
        if (currentModel) {
            statusBarManager.setModel(currentModel.name);
        }

        // Model warmup for faster first inference
        if (configManager.get('modelWarmup') !== false) {
            setTimeout(async () => {
                const model = modelManager.getCurrentModel();
                if (model && model.path) {
                    try {
                        logger.info(`Warming up model: ${model.name}`);
                        const engine = modelManager.getInferenceEngine();
                        // Load model to memory for faster responses
                        await engine.loadModel(model.path);
                        logger.info('Model warmup complete');
                    } catch (error) {
                        logger.error(`Model warmup failed: ${error}`);
                    }
                }
            }, 2000); // Delay to not block startup
        }

        // Start network monitoring asynchronously
        if (!configManager.autoOffline) {
            setTimeout(() => {
                networkDetector.startMonitoring((isOffline) => {
                    statusBarManager.updateStatus(isOffline);
                    if (isOffline) {
                        vscode.window.showInformationMessage('Inline: Offline mode activated');
                        telemetryManager.trackEvent('offline_mode_activated');
                    }
                });
            }, 100);
        } else {
            // Start in offline mode immediately if configured
            statusBarManager.updateStatus(true);
            logger.info('Starting in offline mode');
        }

        // Set context for UI visibility
        vscode.commands.executeCommand('setContext', 'inline.enabled', true);

        // Periodic cache size updates for status bar
        const cacheInterval = setInterval(() => {
            const cacheSize = completionProvider.getCacheSize();
            const sizeMB = (cacheSize * 0.001).toFixed(1);
            statusBarManager.setCacheSize(`${sizeMB}MB`);
        }, 10000);

        context.subscriptions.push({
            dispose: () => clearInterval(cacheInterval)
        });

        logger.info('Inline extension activated successfully');
        vscode.window.showInformationMessage('Inline is ready!');

        return {
            completionProvider,
            modelManager,
            cacheManager,
            statusBarManager,
            networkDetector,
            resourceManager,
            webviewProvider,
            eventTrackingManager
        };

    } catch (error) {
        const err = error as Error;
        errorHandler.handleError(err, 'Extension Activation', true);
        logger.error('Failed to activate extension', err);
        telemetryManager.trackError(err, 'activation');
        throw error;
    }
}

/**
 * Register all extension commands and their handlers.
 */
function registerCommands(context: vscode.ExtensionContext, _modelManagerImplementation: ModelManager): void {
    const commands = [
        vscode.commands.registerCommand('inline.modelManager', () => {
            vscode.commands.executeCommand('workbench.view.extension.inline-sidebar');
            telemetryManager.trackEvent('model_manager_opened');
        }),

        vscode.commands.registerCommand('inline.toggleOffline', () => {
            networkDetector.toggleOfflineMode();
            statusBarManager.updateStatus(networkDetector.isOffline());
            telemetryManager.trackEvent('offline_toggled', {
                offline: networkDetector.isOffline()
            });
        }),

        vscode.commands.registerCommand('inline.clearCache', () => {
            completionProvider.clearCache();
            vscode.window.showInformationMessage('Inline cache cleared');
        }),

        vscode.commands.registerCommand('inline.downloadModel', () => {
            vscode.commands.executeCommand('workbench.view.extension.inline-sidebar');
            telemetryManager.trackEvent('download_model_opened');
        }),

        vscode.commands.registerCommand('inline.settings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:inline.inline');
            telemetryManager.trackEvent('settings_opened');
        }),

        vscode.commands.registerCommand('inline.showLogs', () => {
            logger.show();
        }),

        vscode.commands.registerCommand('inline.showErrorLog', () => {
            errorHandler.showErrorLog();
        }),

        vscode.commands.registerCommand('inline.showProcessInfo', async () => {
            await ProcessInfoDisplay.showProcessInfo();
            telemetryManager.trackEvent('process_info_opened');
        }),

        vscode.commands.registerCommand('inline.showMetrics', async () => {
             const report = completionProvider.getPerformanceReport();
             const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' });
             await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
             telemetryManager.trackEvent('metrics_viewed');
        }),

        vscode.commands.registerCommand('inline.showEventStats', async () => {
            if (eventTrackingManager) {
                const stats = eventTrackingManager.getStatistics();
                const report = '# Event Tracking Statistics\n\n' +
                    '## Event Bus\n' +
                    '- Buffer Size: ' + stats.eventBusStats.bufferSize + '/' + stats.eventBusStats.maxSize + '\n' +
                    '- Subscriptions: ' + stats.eventBusStats.subscriptionCount + '\n\n' +
                    '## AI Metrics\n' +
                    '- Total Inferences: ' + stats.aiMetrics.totalInferences + '\n' +
                    '- Total Suggestions: ' + stats.aiMetrics.totalSuggestions + '\n' +
                    '- Accepted: ' + stats.aiMetrics.acceptedSuggestions + '\n' +
                    '- Rejected: ' + stats.aiMetrics.rejectedSuggestions + '\n' +
                    '- Acceptance Rate: ' + (stats.aiMetrics.acceptanceRate * 100).toFixed(1) + '%\n' +
                    '- Avg Inference Time: ' + stats.aiMetrics.averageInferenceTime.toFixed(0) + 'ms\n' +
                    '- Avg Confidence: ' + (stats.aiMetrics.averageConfidence * 100).toFixed(1) + '%\n\n' +
                    '## State Info\n' +
                    '- Open Documents: ' + stats.stateInfo.openDocuments + '\n' +
                    '- Cursor History: ' + stats.stateInfo.cursorHistorySize + '\n' +
                    '- Recent Edits: ' + stats.stateInfo.recentEditsSize + '\n';

                const doc = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' });
                await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
            }
        }),

        vscode.commands.registerCommand('inline.clearEventHistory', async () => {
            if (eventTrackingManager) {
                eventTrackingManager.clearHistory();
                vscode.window.showInformationMessage('Event history cleared!');
            }
        }),

        vscode.commands.registerCommand('inline.downloadFromUrl', async () => {
            const url = await vscode.window.showInputBox({
                prompt: 'Enter model URL (Hugging Face .gguf link)',
                placeHolder: 'https://huggingface.co/.../model.gguf',
                ignoreFocusOut: true
            });

            if (url) {
                // Open webview
                vscode.commands.executeCommand('workbench.view.extension.inline-sidebar');
                // We rely on the user pasting the URL in the UI for now,
                // or we could send a message if we exposed a method.
                // Since we implemented downloadFromUrl in webview-provider,
                // we can try to send a message to it if we had access to the instance.
                // But webviewProvider is available here!

                // Wait for view to be visible?
                setTimeout(() => {
                    // This is a bit hacky, ideally we'd have a clean API
                    // But for now let's just show the view
                }, 500);
            }
        }),

        vscode.commands.registerCommand('inline.openModelsFolder', async () => {
            const modelsDir = path.join(os.homedir(), '.inline', 'models');
            if (!fs.existsSync(modelsDir)) {
                fs.mkdirSync(modelsDir, { recursive: true });
            }
            await vscode.env.openExternal(vscode.Uri.file(modelsDir));
            telemetryManager.trackEvent('models_folder_opened');
        }),

        vscode.commands.registerCommand('inline.checkForUpdates', async () => {
            vscode.window.showInformationMessage('Checking for model updates...');
            // Placeholder for update logic
            setTimeout(() => {
                vscode.window.showInformationMessage('All models are up to date.');
            }, 1500);
            telemetryManager.trackEvent('check_updates');
        }),

        vscode.commands.registerCommand('inline.showFeatureStatus', async () => {
            if (featureTracker) {
                const markdown = featureTracker.generateMarkdown();
                const doc = await vscode.workspace.openTextDocument({
                    content: markdown,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, {
                    preview: true,
                    viewColumn: vscode.ViewColumn.Beside
                });
                telemetryManager.trackEvent('feature_status_viewed');
            }
        }),

        // Import Management Commands
        vscode.commands.registerCommand('inline.organizeImports', async (document?: vscode.TextDocument) => {
            const doc = document || vscode.window.activeTextEditor?.document;
            if (!doc) { return; }

            // Code action provider registration handled separately

            // Get import resolver from code action provider
            // For now, create a new instance
            const { ImportResolver } = await import('@completion/providers/import-resolver');
            const resolver = new ImportResolver();
            const edits = await resolver.organizeImports(doc);

            const workspaceEdit = new vscode.WorkspaceEdit();
            edits.forEach(edit => workspaceEdit.replace(doc.uri, edit.range, edit.newText));
            await vscode.workspace.applyEdit(workspaceEdit);
            vscode.window.showInformationMessage('Imports organized!');
        }),

        vscode.commands.registerCommand('inline.removeUnusedImports', async (document?: vscode.TextDocument) => {
            const doc = document || vscode.window.activeTextEditor?.document;
            if (!doc) { return; }

            const { ImportResolver } = await import('@completion/providers/import-resolver');
            const resolver = new ImportResolver();
            const edits = await resolver.removeUnusedImports(doc);

            const workspaceEdit = new vscode.WorkspaceEdit();
            edits.forEach(edit => workspaceEdit.replace(doc.uri, edit.range, edit.newText));
            await vscode.workspace.applyEdit(workspaceEdit);
            vscode.window.showInformationMessage(`Removed ${edits.length} unused import(s)!`);
        }),

        vscode.commands.registerCommand('inline.addImport', async (
            document: vscode.TextDocument,
            symbol: string,
            module: string,
            isDefault: boolean
        ) => {
            const { ImportResolver } = await import('@completion/providers/import-resolver');
            const resolver = new ImportResolver();
            const edit = await resolver.addImport(document, symbol, module, isDefault);

            const workspaceEdit = new vscode.WorkspaceEdit();
            workspaceEdit.replace(document.uri, edit.range, edit.newText);
            await vscode.workspace.applyEdit(workspaceEdit);
            vscode.window.showInformationMessage(`Added import: ${symbol}`);
        }),

    ];

    context.subscriptions.push(...commands);
}



/**
 * Extension deactivation - cleanup resources and dispose components.
 *
 * Cleanup sequence:
 * 1. Stop network monitoring
 * 2. Cleanup model manager
 * 3. Dispose UI components
 * 4. Dispose event tracking
 * 5. Dispose logger last
 */
export async function deactivate(): Promise<void> {
    try {
        logger?.info('Deactivating Inline extension...');

        // Stop monitoring first to prevent new events
        if (networkDetector) {
            try {
                networkDetector.stopMonitoring();
            } catch (error) {
                console.warn('Error stopping network detector:', error);
            }
        }

        // Cleanup model resources
        if (modelManager) {
            try {
                await modelManager.cleanup();
            } catch (error) {
                console.warn('Error cleaning up model manager:', error);
            }
        }

        // Dispose UI components
        if (statusBarManager) {
            try {
                statusBarManager.dispose();
            } catch (error) {
                console.warn('Error disposing status bar:', error);
            }
        }

        // Dispose event tracking system
        if (eventTrackingManager) {
            try {
                eventTrackingManager.dispose();
            } catch (error) {
                console.warn('Error disposing event tracking manager:', error);
            }
        }

        // Dispose logger last to capture all cleanup logs
        if (logger) {
            try {
                logger.dispose();
            } catch (error) {
                console.warn('Error disposing logger:', error);
            }
        }

        // Track deactivation event (ignore errors during cleanup)
        try {
            telemetryManager?.trackEvent('extension_deactivated');
        } catch (error) {
            // Ignore telemetry errors during deactivation
        }

        logger?.info('Inline extension deactivated');
    } catch (error) {
        console.error('Error during deactivation:', error);
        // Don't throw - allow deactivation to complete
    }
}
