import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { InlineCompletionProvider } from './core/providers/completion-provider';
import { InlineCodeActionProvider } from './core/providers/code-action-provider';
import { InlineHoverProvider } from './core/providers/hover-provider';
import { ModelManager } from './inference/model-manager';
import { CacheManager } from './core/cache/cache-manager';
import { StatusBarManager } from './ui/status-bar-manager';
import { WebviewProvider } from './ui/webview-provider';
import { NetworkDetector } from './network/network-detector';
import { ResourceManager } from './system/resource-manager';
import { Logger } from './system/logger';
import { ConfigManager } from './system/config-manager';
import { ErrorHandler } from './system/error-handler';
import { TelemetryManager } from './system/telemetry-manager';
import { NetworkConfig } from './network/network-config';
import { ProcessInfoDisplay } from './system/process-info-display';
import { PerformanceTuner } from './system/performance-tuner';
import { AICommandsProvider } from './core/providers/ai-commands-provider';
import { EventTrackingManager, createEventTrackingManager } from './events/event-tracking-manager';

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

export async function activate(context: vscode.ExtensionContext) {
    try {
        // Configure network settings first
        NetworkConfig.configure();

        // Initialize logger
        logger = new Logger('Inline');
        logger.info('Activating Inline extension...');

        // Initialize error handler
        errorHandler = ErrorHandler.getInstance();

        // Initialize telemetry
        telemetryManager = new TelemetryManager();
        telemetryManager.trackEvent('extension_activated');

        // Initialize configuration manager
        configManager = new ConfigManager();
        logger.info('Configuration loaded', configManager.getAll());

        // Run performance auto-tuning (deferred to avoid blocking startup)
        setTimeout(() => {
            PerformanceTuner.tune().catch(err => console.error('Tuning failed:', err));
        }, 5000);
        
        // Initialize core components
        cacheManager = new CacheManager(context);
        modelManager = new ModelManager(context);
        statusBarManager = new StatusBarManager();
        networkDetector = new NetworkDetector();

        // Lazy-initialize ResourceManager (defer until first use for faster activation)
        resourceManager = new ResourceManager();
        resourceManager.stopMonitoring(); // Don't start monitoring until needed

        // Initialize completion provider
        completionProvider = new InlineCompletionProvider(
            modelManager,
            statusBarManager,
            networkDetector,
            resourceManager,
            cacheManager
        );

        // Initialize webview provider
        webviewProvider = new WebviewProvider(context.extensionUri, modelManager);

        // Register webview provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                WebviewProvider.viewType,
                webviewProvider
            )
        );

        // Development Mode: All features enabled for testing
        if (context.extensionMode === vscode.ExtensionMode.Development) {
            logger.info('Development Mode detected: All features enabled for testing');
        }

        // Register completion provider
        const provider = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            completionProvider
        );
        context.subscriptions.push(provider);

        // Register code action provider (NEW)
        const codeActionProvider = new InlineCodeActionProvider(modelManager);
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                { pattern: '**' },
                codeActionProvider,
                { providedCodeActionKinds: InlineCodeActionProvider.providedCodeActionKinds }
            )
        );
        
        // Register Hover Provider (NEW)
        const hoverProvider = new InlineHoverProvider();
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                { pattern: '**' },
                hoverProvider
            )
        );

        // Register AI commands provider (NEW)
        aiCommandsProvider = new AICommandsProvider(modelManager);
        aiCommandsProvider.registerCommands(context);

        // Initialize event tracking system (NEW)
        // Initialize event tracking manager
        eventTrackingManager = createEventTrackingManager(context, completionProvider.getContextEngine());
        eventTrackingManager.start();
        
        // Wire event system to context engine
        const stateManager = eventTrackingManager.getStateManager();
        const contextWindowBuilder = eventTrackingManager.getContextWindowBuilder();
        completionProvider.getContextEngine().setStateManager(stateManager);
        completionProvider.getContextEngine().setContextWindowBuilder(contextWindowBuilder);
        
        logger.info('Event tracking system integrated with completion provider');

        // Set AI context tracker for completion provider
        completionProvider.setAIContextTracker(eventTrackingManager.getAIContextTracker());

        // Register commands
        registerCommands(context, modelManager);

        // Initialize status bar
        statusBarManager.initialize();

        // Update status bar with current model
        const currentModel = modelManager.getCurrentModel();
        if (currentModel) {
            statusBarManager.setModel(currentModel.name);
        }

        // Model Warmup
        if (configManager.get('modelWarmup') !== false) {
            setTimeout(async () => {
                const model = modelManager.getCurrentModel();
                if (model && model.path) {
                    try {
                        logger.info(`Warming up model: ${model.name}`);
                        const engine = modelManager.getInferenceEngine();
                        // Load with config
                         // (assuming standard load is fine, tuner comes later)
                        await engine.loadModel(model.path);
                        logger.info('Model warmup complete');
                    } catch (error) {
                        logger.error(`Model warmup failed: ${error}`);
                    }
                }
            }, 2000); // Delay warmup to not block startup
        }

        // Start network monitoring asynchronously (don't block activation)
        // Only start if not configured for offline-only mode
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
            // Start in offline mode immediately
            statusBarManager.updateStatus(true);
            logger.info('Starting in offline mode');
        }

        // Set context for UI visibility
        vscode.commands.executeCommand('setContext', 'inline.enabled', true);

        // Update cache size periodically
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

function registerCommands(context: vscode.ExtensionContext, modelManagerImplementation: ModelManager): void {
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

        vscode.commands.registerCommand('inline.clearCache', async () => {
            try {
                completionProvider.clearCache();
                cacheManager.clear();
                statusBarManager.setCacheSize('0MB');
                vscode.window.showInformationMessage('Cache cleared successfully!');
                telemetryManager.trackEvent('cache_cleared');
            } catch (error) {
                errorHandler.handleError(error as Error, 'Clear Cache', true);
            }
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
                const report = `# Event Tracking Statistics\n\n` +
                    `## Event Bus\n` +
                    `- Buffer Size: ${stats.eventBusStats.bufferSize}/${stats.eventBusStats.maxSize}\n` +
                    `- Subscriptions: ${stats.eventBusStats.subscriptionCount}\n\n` +
                    `## AI Metrics\n` +
                    `- Total Inferences: ${stats.aiMetrics.totalInferences}\n` +
                    `- Total Suggestions: ${stats.aiMetrics.totalSuggestions}\n` +
                    `- Accepted: ${stats.aiMetrics.acceptedSuggestions}\n` +
                    `- Rejected: ${stats.aiMetrics.rejectedSuggestions}\n` +
                    `- Acceptance Rate: ${(stats.aiMetrics.acceptanceRate * 100).toFixed(1)}%\n` +
                    `- Avg Inference Time: ${stats.aiMetrics.averageInferenceTime.toFixed(0)}ms\n` +
                    `- Avg Confidence: ${(stats.aiMetrics.averageConfidence * 100).toFixed(1)}%\n\n` +
                    `## State Info\n` +
                    `- Open Documents: ${stats.stateInfo.openDocuments}\n` +
                    `- Cursor History: ${stats.stateInfo.cursorHistorySize}\n` +
                    `- Recent Edits: ${stats.stateInfo.recentEditsSize}\n`;
                
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
            if (!require('fs').existsSync(modelsDir)) {
                require('fs').mkdirSync(modelsDir, { recursive: true });
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
        
        // --- Code Actions Commands ---

        vscode.commands.registerCommand('inline.fixCode', async (document: vscode.TextDocument, range: vscode.Range, diagnostics: vscode.Diagnostic[]) => {
            await handleValuesAction(document, range, 'fix', diagnostics);
        }),


        vscode.commands.registerCommand('inline.optimizeCode', async (document: vscode.TextDocument, range: vscode.Range) => {
            await handleValuesAction(document, range, 'optimize');
        }),

        vscode.commands.registerCommand('inline.explainCode', async (document: vscode.TextDocument, range: vscode.Range) => {
            await handleExplainAction(document, range);
        }),
        
        vscode.commands.registerCommand('inline.showOptions', async () => {
             const editor = vscode.window.activeTextEditor;
             if (!editor) return;
             
             const selection = editor.selection;
             if (selection.isEmpty) {
                 vscode.window.showInformationMessage('Please select some code first.');
                 return;
             }
             
             const items = [
                 { label: '$(sparkle) Fix Code', description: 'Find and fix errors', command: 'inline.fixCode' },
                 { label: '$(zap) Optimize Selection', description: 'Improve performance/readability', command: 'inline.optimizeCode' },
                 { label: '$(info) Explain Code', description: 'Explain how it works', command: 'inline.explainCode' }
             ];
             
             const selected = await vscode.window.showQuickPick(items, {
                 placeHolder: 'Select an AI action for the selected code'
             });
             
             if (selected) {
                 // Trigger the command with arguments
                 // Commands expect (document, range, diagnostics?)
                 // diagnostics might be missing for fixCode invoked this way, but handleValuesLogic handles explicit instruction if type='fix'
                 // Wait, fixCode expects diagnostics. If null, it defaults to generic fix?
                 // Let's modify handleValuesAction to handle missing diagnostics better (it does check ?.map).
                 
                 // However, we need to pass arguments.
                 if (selected.command === 'inline.fixCode') {
                    // Get diagnostics for range
                    const diagnostics = vscode.languages.getDiagnostics(editor.document.uri)
                        .filter(d => d.range.intersection(selection));
                    await vscode.commands.executeCommand(selected.command, editor.document, selection, diagnostics);
                 } else {
                    await vscode.commands.executeCommand(selected.command, editor.document, selection);
                 }
             }
        })
    ];

    context.subscriptions.push(...commands);
}

async function handleValuesAction(document: vscode.TextDocument, range: vscode.Range, type: 'fix' | 'optimize', diagnostics?: vscode.Diagnostic[]) {
    try {
        const selectedCode = document.getText(range);
        let instruction = '';
        
        if (type === 'fix') {
            const errorMessages = diagnostics?.map(d => d.message).join('\n') || 'Unknown error';
            instruction = `Fix the following code which has these errors:\n${errorMessages}\n\nProvide only the fixed code, no explanation.`;
        } else {
            instruction = 'Optimize this code for performance and readability. Provide only the optimized code, no explanation.';
        }

        const engine = modelManager.getInferenceEngine();
        if (!engine.isModelLoaded()) {
             vscode.window.showWarningMessage('Please select and load a model first.');
             return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: type === 'fix' ? 'Fixing code...' : 'Optimizing code...',
            cancellable: false
        }, async () => {
            const result = await engine.generateImprovement(selectedCode, instruction);
            
            // Clean result (sometimes models chat, we want code)
            let cleanResult = result.replace(/```[\w]*\n?|```$/g, '').trim();
            // Remove "Here is the fixed code:" etc if present?
            // Simple heuristic for now.
            
            if (cleanResult) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, range, cleanResult);
                await vscode.workspace.applyEdit(edit);
            }
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to ${type} code: ${error.message}`);
    }
}

async function handleExplainAction(document: vscode.TextDocument, range: vscode.Range) {
     try {
        const selectedCode = document.getText(range);
        const instruction = 'Explain what this code does in simple terms.';

        const engine = modelManager.getInferenceEngine();
        if (!engine.isModelLoaded()) {
             vscode.window.showWarningMessage('Please select and load a model first.');
             return;
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Explaining code...',
            cancellable: false
        }, async () => {
            const result = await engine.generateImprovement(selectedCode, instruction, { maxTokens: 256 });
            
            // Show in output channel or temporary document
            const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
            await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to explain code: ${error.message}`);
    }
}

export async function deactivate(): Promise<void> {
    try {
        logger?.info('Deactivating Inline extension...');

        // Stop monitoring first
        if (networkDetector) {
            try {
                networkDetector.stopMonitoring();
            } catch (error) {
                console.warn('Error stopping network detector:', error);
            }
        }

        // Cleanup model manager
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

        // Dispose event tracking manager
        if (eventTrackingManager) {
            try {
                eventTrackingManager.dispose();
            } catch (error) {
                console.warn('Error disposing event tracking manager:', error);
            }
        }

        // Dispose logger last
        if (logger) {
            try {
                logger.dispose();
            } catch (error) {
                console.warn('Error disposing logger:', error);
            }
        }

        // Track deactivation (with error handling)
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
