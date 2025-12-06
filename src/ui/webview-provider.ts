import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ModelManager } from '../inference/model-manager';
import { ModelDownloader } from '../models/model-downloader';
import { DownloadManager } from '../models/download-manager';
import { ModelRegistry } from '../models/model-registry';
import { ConfigManager } from '../system/config-manager';

interface InlineConfigWithRules extends ReturnType<ConfigManager['getAll']> {
    codingRules?: Array<{
        name: string;
        pattern: string;
        description: string;
        enabled: boolean;
    }>;
}
export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'inline.modelManagerView';

    private _view?: vscode.WebviewView;
    private _configManager: ConfigManager;
    private _modelDownloader: ModelDownloader;
    private _downloadManager: DownloadManager;
    private _modelRegistry: ModelRegistry;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly modelManager: ModelManager
    ) {
        this._configManager = new ConfigManager();
        this._modelDownloader = new ModelDownloader(
            path.join(os.homedir(), '.inline', 'models')
        );
        this._downloadManager = new DownloadManager(2);
        this._modelRegistry = new ModelRegistry();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'resources'),
                vscode.Uri.joinPath(this._extensionUri, 'out', 'webview')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);


        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'getData':
                    this.sendData();
                    break;
                case 'downloadModel':
                    await this.downloadModel(data.modelId);
                    break;
                case 'downloadFromUrl':
                    await this.downloadFromUrl(data.url);
                    break;
                case 'cancelDownload':
                    await this.cancelDownload(data.modelId);
                    break;
                case 'selectModel':
                    await this.selectModel(data.modelId);
                    break;
                case 'deleteModel':
                    await this.deleteModel(data.modelId);
                    break;
                case 'importModel':
                    await this.importModel(data.filePath);
                    break;
                case 'pickAndImportModel':
                    await this.pickAndImportModel();
                    break;
                case 'updateSetting':
                    await this.updateSetting(data.setting, data.value);
                    break;
                case 'addRule':
                    await this.addRule();
                    break;
                case 'updateRule':
                    await this.updateRule(data.index, data.field, data.value);
                    break;
                case 'removeRule':
                    await this.removeRule(data.index);
                    break;
                case 'unloadModel':
                    await this.unloadModel();
                    break;
            }
        });

        // Send initial data
        this.sendData();
    }

    private sendData() {
        if (this._view) {
            const models = this.getAllModels();
            const settings = this._configManager.getAll();
            const rules = (this._configManager.getAll() as InlineConfigWithRules).codingRules || [];
            const currentModel = this.modelManager.getCurrentModel();

            const logoUri = this._view.webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'resources', 'icon.png')
            ).toString();

            this._view.webview.postMessage({
                command: 'updateData',
                data: {
                    models,
                    settings,
                    rules,
                    currentModel: currentModel?.id,
                    isOffline: true, // TODO: Get from network detector
                    logoUri
                }
            });
        }
    }

    private getAllModels() {
        const availableModels = this._modelDownloader.getAvailableModels();
        const downloadedModels = this.modelManager.getDownloadedModels();

        // Recommended models
        const recommendedModels = [
            {
                id: 'deepseek-coder-6.7b-instruct',
                name: 'DeepSeek Coder 6.7B',
                description: 'State-of-the-art coding model with excellent reasoning capabilities.',
                size: 4200000000,
                url: 'https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-GGUF/resolve/main/deepseek-coder-6.7b-instruct.Q4_K_M.gguf',
                requirements: { ram: 8, vram: 6 },
                contextWindow: 16384,
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust']
            },
            {
                id: 'codellama-7b-instruct',
                name: 'CodeLlama 7B',
                description: 'Meta\'s powerful code generation model, fine-tuned for instruction following.',
                size: 4000000000,
                url: 'https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q4_K_M.gguf',
                requirements: { ram: 8, vram: 6 },
                contextWindow: 16384,
                languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go']
            },
            {
                id: 'phi-3-mini-4k-instruct',
                name: 'Phi-3 Mini',
                description: 'Microsoft\'s lightweight yet capable model, perfect for lower-end hardware.',
                size: 2400000000,
                url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
                requirements: { ram: 4, vram: 2 },
                contextWindow: 4096,
                languages: ['python', 'javascript', 'typescript']
            }
        ];

        // Merge recommended models with available models, avoiding duplicates
        const allModels = [...availableModels];
        for (const rec of recommendedModels) {
            if (!allModels.some(m => m.id === rec.id)) {
                allModels.push(rec as any);
            }
        }

        // Scan for imported models in the models directory
        const modelsDir = this._modelRegistry.getModelsDirectory();
        try {
            if (fs.existsSync(modelsDir)) {
                const files = fs.readdirSync(modelsDir);
                const importedFiles = files.filter(f => f.startsWith('imported_') && f.endsWith('.gguf'));

                for (const file of importedFiles) {
                    const modelId = path.basename(file, '.gguf');
                    const filePath = path.join(modelsDir, file);

                    // Check if this model is already in the list
                    if (!allModels.some(m => m.id === modelId)) {
                        const stats = fs.statSync(filePath);
                        const modelName = modelId.replace('imported_', '').replace(/_/g, ' ');

                        // Parse metadata from filename
                        let architecture = 'Unknown';
                        let quantization = 'Unknown';
                        let parameterCount = 'Unknown';

                        const archMatch = modelId.match(/(llama|codellama|mistral|gemma|starcoder|phi|qwen|deepseek)/i);
                        if (archMatch) architecture = archMatch[0];

                        const quantMatch = modelId.match(/(Q\d+_[K|0-9]+_[S|M|L]|Q\d+_[0-9]|f16|f32)/i);
                        if (quantMatch) quantization = quantMatch[0].toUpperCase();

                        const paramMatch = modelId.match(/(\d+(?:\.\d+)?)[bB]/);
                        if (paramMatch) parameterCount = paramMatch[0].toUpperCase();

                        allModels.push({
                            id: modelId,
                            name: `Imported: ${modelName}`,
                            description: `Imported model (${this.formatFileSize(stats.size)})`,
                            size: stats.size,
                            requirements: { ram: Math.ceil(stats.size / (1024 * 1024 * 1024)) + 2, vram: 4 },
                            contextWindow: 4096,
                            languages: ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust'],
                            path: filePath,
                            isImported: true,
                            architecture,
                            quantization,
                            parameterCount
                        } as any);
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning for imported models:', error);
        }

        // Add models found by ModelManager (e.g. Workspace models)
        // These might not be in our hardcoded lists or global registry
        const managerModels = this.modelManager.getAllModels();
        for (const model of managerModels) {
             if (!allModels.some(m => m.id === model.id)) {
                 allModels.push(model as any);
             }
        }

        return allModels.map(model => ({
            ...model,
            isDownloaded: downloadedModels.some(dm => dm.id === model.id) || !!(model.path && fs.existsSync(model.path)),
            isImported: (model as any).isImported || model.id.startsWith('imported_')
        })).filter(m => m.size > 1024 * 1024); // Filter out models smaller than 1MB (dummy/corrupted)
    }

    private formatFileSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    private async downloadModel(modelId: string) {
        try {
            const models = this.getAllModels();
            const model = models.find(m => m.id === modelId);

            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }

            // Send download start notification
            this._view?.webview.postMessage({
                command: 'downloadProgress',
                modelId,
                progress: { progress: 0, speed: 0 }
            });

            await this._modelDownloader.downloadModel(model, (progressPercent) => {
                // Get detailed progress including speed
                const progressData = this._modelDownloader.getDownloadProgress(modelId);

                this._view?.webview.postMessage({
                    command: 'downloadProgress',
                    modelId,
                    progress: {
                        progress: progressPercent,
                        speed: progressData?.speed || 0
                    }
                });
            });

            // Update model manager
            await this.modelManager.downloadModel(modelId);

            // Send completion notification
            this._view?.webview.postMessage({
                command: 'downloadComplete',
                modelId
            });

            this.sendData();
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to download model: ${error}`,
                type: 'error'
            });
        }
    }

    private async downloadFromUrl(url: string) {
        try {
            // Validate URL
            if (!url || !url.startsWith('http')) {
                throw new Error('Invalid URL');
            }

            // Extract model name from URL
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1] || 'model.gguf';
            const modelId = `downloaded_${Date.now()}`;

            const destPath = path.join(this._modelRegistry.getModelsDirectory(), fileName);

            // Start download
            this._view?.webview.postMessage({
                command: 'notification',
                message: 'Starting download...',
                type: 'info'
            });

            await this._downloadManager.download({
                url,
                destPath,
                onProgress: (progress) => {
                    this._view?.webview.postMessage({
                        command: 'downloadProgress',
                        modelId,
                        progress
                    });
                },
                onComplete: async (filePath) => {
                    // Import the downloaded model
                    try {
                        const importedModel = await this._modelDownloader.importModel(filePath);
                        
                        // Refresh to recognize the new model
                        await this.modelManager.refreshModels();
                        
                        await this.modelManager.downloadModel(importedModel.id);

                        this._view?.webview.postMessage({
                            command: 'downloadComplete',
                            modelId: importedModel.id
                        });

                        // Force UI refresh
                        this.sendData();
                    } catch (error) {
                        // Refresh UI even on error
                        this.sendData();
                        
                        this._view?.webview.postMessage({
                            command: 'notification',
                            message: `Failed to import downloaded model: ${error}`,
                            type: 'error'
                        });
                    }
                },
                onError: (error) => {
                    this._view?.webview.postMessage({
                        command: 'notification',
                        message: `Download failed: ${error.message}`,
                        type: 'error'
                    });
                }
            });

        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to start download: ${error}`,
                type: 'error'
            });
        }
    }

    private async selectModel(modelId: string) {
        try {
            const currentModel = this.modelManager.getCurrentModel();
            const modelName = this.getAllModels().find(m => m.id === modelId)?.name || modelId;

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Loading Model: ${modelName}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: 'Initializing...' });

                // Show switching message if changing from another model
                if (currentModel && currentModel.id !== modelId) {
                    progress.report({ message: `Switching from ${currentModel.name || currentModel.id}...` });
                }

                await this.modelManager.setCurrentModel(modelId);

                progress.report({ increment: 100, message: 'Model activated!' });

                // Short delay to let user see the success message
                await new Promise(resolve => setTimeout(resolve, 500));
            });

            this.sendData();

            // Optional: still send a success notification to webview if needed for UI update,
            // but the native alert covers the "alert" requirement.
            // keeping it for sync.
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Model activated successfully`,
                type: 'success'
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to select model: ${error}`);
            // Also notify webview to reset state if needed
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to select model: ${error}`,
                type: 'error'
            });
        }
    }

    private async deleteModel(modelId: string) {
        try {
            // Native confirmation dialog
            const answer = await vscode.window.showWarningMessage(
                `Are you sure you want to delete model '${modelId}'?`,
                { modal: true },
                'Delete'
            );

            if (answer !== 'Delete') {
                return;
            }

            // Delete file first
            await this._modelDownloader.deleteModel(modelId);
            // Then update manager state
            await this.modelManager.removeModel(modelId);
            this.sendData();

            this._view?.webview.postMessage({
                command: 'notification',
                message: `Model ${modelId} deleted successfully`,
                type: 'success'
            });
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to delete model: ${error}`,
                type: 'error'
            });
        }
    }

    private async unloadModel() {
        try {
            await this.modelManager.unloadModel();
            this.sendData();

            this._view?.webview.postMessage({
                command: 'notification',
                message: 'Model unloaded',
                type: 'info'
            });
        } catch (error) {
             this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to unload model: ${error}`,
                type: 'error'
            });
        }
    }

    private async cancelDownload(modelId: string) {
        try {
            // Cancel the download by sending a downloadComplete message
            // This will clear the progress state in the UI
            this._view?.webview.postMessage({
                command: 'downloadComplete',
                modelId
            });

            this._view?.webview.postMessage({
                command: 'notification',
                message: `Download cancelled for ${modelId}`,
                type: 'info'
            });
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to cancel download: ${error}`,
                type: 'error'
            });
        }
    }

    private async pickAndImportModel() {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                canSelectMany: true,  // Allow multiple files
                openLabel: 'Import Model(s)',
                filters: {
                    'Model Files': ['gguf', 'tar.gz', 'tgz'],
                    'All Files': ['*']
                },
                title: 'Select model file(s) to import'
            });

            if (fileUri && fileUri.length > 0) {
                if (fileUri.length === 1) {
                    // Single import
                    await this.importModel(fileUri[0].fsPath);
                } else {
                    // Batch import
                    await this.importMultipleModels(fileUri.map(uri => uri.fsPath));
                }
            }
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to open file picker: ${error}`,
                type: 'error'
            });
        }
    }

    /**
     * Import multiple models with progress tracking
     */
    private async importMultipleModels(filePaths: string[]) {
        const total = filePaths.length;
        let succeeded = 0;
        let failed = 0;

        this._view?.webview.postMessage({
            command: 'notification',
            message: `Importing ${total} model(s)...`,
            type: 'info'
        });

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            const fileName = filePath.split('/').pop() || filePath;
            
            try {
                this._view?.webview.postMessage({
                    command: 'notification',
                    message: `[${i + 1}/${total}] Importing ${fileName}...`,
                    type: 'info'
                });

                const importedModel = await this._modelDownloader.importModel(filePath);
                await this.modelManager.refreshModels();
                await this.modelManager.downloadModel(importedModel.id);
                
                // Update UI after each import
                this.sendData();
                succeeded++;

            } catch (error) {
                failed++;
                console.error(`Failed to import ${fileName}:`, error);
            }
        }

        // Final refresh
        await this.modelManager.refreshModels();
        this.sendData();

        // Summary notification
        const message = `Import complete: ${succeeded} succeeded, ${failed} failed`;
        this._view?.webview.postMessage({
            command: 'notification',
            message: failed > 0 ? `⚠️ ${message}` : `✅ ${message}`,
            type: failed > 0 ? 'warning' : 'success'
        });
    }

    private async importModel(filePath: string) {
        const startTime = Date.now();
        const fileName = filePath.split('/').pop() || filePath;
        
        try {
            // Immediate feedback
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Importing ${fileName}...`,
                type: 'info'
            });

            const importedModel = await this._modelDownloader.importModel(filePath);

            // Refresh and show immediately
            await this.modelManager.refreshModels();
            this.sendData();  // Show model in UI right away

            // Progress update
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Activating ${importedModel.name || importedModel.id}...`,
                type: 'info'
            });

            // Add to model manager
            await this.modelManager.downloadModel(importedModel.id);

            // Auto-activate
            await this.modelManager.setCurrentModel(importedModel.id);

            // Final UI refresh
            this.sendData();

            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Imported and activated in ${duration}s: ${importedModel.name || importedModel.id}`,
                type: 'success'
            });
        } catch (error) {
            // Refresh UI even on error
            await this.modelManager.refreshModels();
            this.sendData();
            
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to import ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
                type: 'error'
            });
        }
    }

    private async updateSetting(setting: string, value: string | number | boolean) {
        try {
            // Update configuration based on setting
            switch (setting) {
                case 'autoOffline':
                    await this._configManager.setAutoOffline(Boolean(value));
                    break;
                case 'defaultModel':
                    await this._configManager.setDefaultModel(String(value));
                    break;
                case 'maxTokens':
                    await this._configManager.setMaxTokens(Number(value));
                    break;
                case 'temperature':
                    await this._configManager.setTemperature(Number(value));
                    break;
                case 'cacheSize':
                    await this._configManager.setCacheSize(Number(value));
                    break;
                case 'contextWindow':
                    // Update context window setting
                    break;
                case 'suggestionDelay':
                    // Update suggestion delay setting
                    break;
                case 'resourceMonitoring':
                    await this._configManager.setResourceMonitoring(Boolean(value));
                    break;
                case 'modelPath':
                    // Update model path setting
                    break;
                case 'autoDownload':
                    // Update auto download setting
                    break;
            }

            this.sendData();
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to update setting: ${error}`,
                type: 'error'
            });
        }
    }

    private async addRule() {
        try {
            const currentRules = (this._configManager.getAll() as InlineConfigWithRules).codingRules || [];
            const newRule = {
                name: 'New Rule',
                pattern: '',
                description: '',
                enabled: true
            };

            currentRules.push(newRule);
            // TODO: Update config manager with new rules
            this.sendData();
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to add rule: ${error}`,
                type: 'error'
            });
        }
    }

    private async updateRule(index: number, field: string, value: string | boolean) {
        try {
            const currentRules = (this._configManager.getAll() as InlineConfigWithRules).codingRules || [];
            if (currentRules[index]) {
                const rule = currentRules[index];
                if (field === 'name' || field === 'pattern' || field === 'description') {
                    rule[field] = String(value);
                } else if (field === 'enabled') {
                    rule[field] = Boolean(value);
                }
                // TODO: Update config manager with modified rules
                this.sendData();
            }
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to update rule: ${error}`,
                type: 'error'
            });
        }
    }

    private async removeRule(index: number) {
        try {
            const currentRules = (this._configManager.getAll() as InlineConfigWithRules).codingRules || [];
            if (currentRules[index]) {
                currentRules.splice(index, 1);
                // TODO: Update config manager with modified rules
                this.sendData();
            }
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to remove rule: ${error}`,
                type: 'error'
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const extensionUri = this._extensionUri;
        const webviewUri = vscode.Uri.joinPath(extensionUri, 'out', 'webview');
        const indexPath = vscode.Uri.joinPath(webviewUri, 'index.html');

        try {
            let html = fs.readFileSync(indexPath.fsPath, 'utf8');

            // Generate nonce for CSP
            const nonce = getNonce();

            // Replace asset paths with webview URIs
            const assetsUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewUri, 'assets'));

            // Replace /assets/ paths and add nonce to script tags
            html = html.replace(
                /<script\s+([^>]*?)src="\/assets\/([^"]+)"/g,
                `<script $1src="${assetsUri}/$2" nonce="${nonce}"`
            );

            // Replace /assets/ paths in link tags (CSS)
            html = html.replace(
                /href="\/assets\//g,
                `href="${assetsUri}/`
            );

            // Replace any other /assets/ references
            html = html.replace(
                /src="\/assets\//g,
                `src="${assetsUri}/`
            );

            // Add CSP that allows scripts with nonce and from webview source
            const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource};">`;
            html = html.replace('<head>', `<head>${csp}`);

            return html;
        } catch (error) {
            console.error('Error loading webview html:', error);
            return this._getFallbackHtml(webview);
        }
    }

    private _getFallbackHtml(_webview: vscode.Webview) {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Inline Model Manager</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
        }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: var(--vscode-foreground); }
        .model-card {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Inline Model Manager</h1>
        <div id="models">
            <div class="model-card">
                <h3>Loading models...</h3>
            </div>
        </div>
    </div>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        vscode.postMessage({ command: 'getData' });
    </script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
