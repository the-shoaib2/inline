import * as vscode from 'vscode';
import { InlineCompletionProvider } from './core/completion-provider';
import { ModelManager } from './core/model-manager';
import { CacheManager } from './core/cache-manager';
import { StatusBarManager } from './ui/status-bar-manager';
import { WebviewProvider } from './ui/webview-provider';
import { NetworkDetector } from './utils/network-detector';
import { ResourceManager } from './utils/resource-manager';
import { Logger, LogLevel } from './utils/logger';
import { ConfigManager } from './utils/config-manager';
import { ErrorHandler } from './utils/error-handler';
import { TelemetryManager } from './utils/telemetry-manager';

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

export async function activate(context: vscode.ExtensionContext) {
    try {
        // Initialize logger first
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

        // Initialize core components
        cacheManager = new CacheManager(context);
        modelManager = new ModelManager(context);
        statusBarManager = new StatusBarManager();
        networkDetector = new NetworkDetector();
        resourceManager = new ResourceManager();
        
        // Initialize completion provider
        completionProvider = new InlineCompletionProvider(
            modelManager,
            statusBarManager,
            networkDetector,
            resourceManager
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

        // Register completion provider
        const provider = vscode.languages.registerInlineCompletionItemProvider(
            { pattern: '**' },
            completionProvider
        );
        context.subscriptions.push(provider);

        // Register commands
        registerCommands(context);

        // Initialize status bar
        statusBarManager.initialize();
        
        // Update status bar with current model
        const currentModel = modelManager.getCurrentModel();
        if (currentModel) {
            statusBarManager.setModel(currentModel.name);
        }
        
        // Start network monitoring
        networkDetector.startMonitoring((isOffline) => {
            statusBarManager.updateStatus(isOffline);
            if (isOffline) {
                vscode.window.showInformationMessage('Inline: Offline mode activated');
                telemetryManager.trackEvent('offline_mode_activated');
            }
        });

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
        vscode.window.showInformationMessage('Inline AI is ready!');

    } catch (error) {
        const err = error as Error;
        errorHandler.handleError(err, 'Extension Activation', true);
        logger.error('Failed to activate extension', err);
        telemetryManager.trackError(err, 'activation');
        throw error;
    }
}

function registerCommands(context: vscode.ExtensionContext): void {
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
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:inline-ai.inline');
            telemetryManager.trackEvent('settings_opened');
        }),

        vscode.commands.registerCommand('inline.showLogs', () => {
            logger.show();
        }),

        vscode.commands.registerCommand('inline.showErrorLog', () => {
            errorHandler.showErrorLog();
        })
    ];

    context.subscriptions.push(...commands);
}

export function deactivate() {
    try {
        logger?.info('Deactivating Inline extension...');
        
        if (networkDetector) {
            networkDetector.stopMonitoring();
        }
        if (modelManager) {
            modelManager.cleanup();
        }
        if (statusBarManager) {
            statusBarManager.dispose();
        }
        if (logger) {
            logger.dispose();
        }

        telemetryManager?.trackEvent('extension_deactivated');
        logger?.info('Inline extension deactivated');
    } catch (error) {
        console.error('Error during deactivation:', error);
    }
}
