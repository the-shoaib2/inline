import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ModelManager } from '../core/model-manager';
import { ModelDownloader } from '../models/model-downloader';
import { ConfigManager } from '../utils/config-manager';

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

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly modelManager: ModelManager
    ) {
        this._configManager = new ConfigManager();
        this._modelDownloader = new ModelDownloader(
            path.join(_extensionUri.fsPath, 'models')
        );
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
                vscode.Uri.joinPath(this._extensionUri, 'resources')
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
                case 'selectModel':
                    await this.selectModel(data.modelId);
                    break;
                case 'deleteModel':
                    await this.deleteModel(data.modelId);
                    break;
                case 'importModel':
                    await this.importModel(data.filePath);
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

            this._view.webview.postMessage({
                command: 'updateData',
                data: {
                    models,
                    settings,
                    rules,
                    currentModel: currentModel?.id,
                    isOffline: true // TODO: Get from network detector
                }
            });
        }
    }

    private getAllModels() {
        const availableModels = this._modelDownloader.getAvailableModels();
        const downloadedModels = this.modelManager.getDownloadedModels();

        // Merge available and downloaded models
        return availableModels.map(model => ({
            ...model,
            isDownloaded: downloadedModels.some(dm => dm.id === model.id)
        }));
    }

    private async downloadModel(modelId: string) {
        try {
            const models = this._modelDownloader.getAvailableModels();
            const model = models.find(m => m.id === modelId);

            if (!model) {
                throw new Error(`Model ${modelId} not found`);
            }

            // Send download start notification
            this._view?.webview.postMessage({
                command: 'downloadProgress',
                modelId,
                progress: 0
            });

            await this._modelDownloader.downloadModel(model, (progress) => {
                this._view?.webview.postMessage({
                    command: 'downloadProgress',
                    modelId,
                    progress
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

    private async selectModel(modelId: string) {
        try {
            await this.modelManager.setCurrentModel(modelId);
            this.sendData();

            this._view?.webview.postMessage({
                command: 'notification',
                message: `Model ${modelId} selected successfully`,
                type: 'success'
            });
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to select model: ${error}`,
                type: 'error'
            });
        }
    }

    private async deleteModel(modelId: string) {
        try {
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

    private async importModel(filePath: string) {
        try {
            const importedModel = await this._modelDownloader.importModel(filePath);

            // Add to model manager
            await this.modelManager.downloadModel(importedModel.id);

            this.sendData();

            this._view?.webview.postMessage({
                command: 'notification',
                message: 'Model imported successfully',
                type: 'success'
            });
        } catch (error) {
            this._view?.webview.postMessage({
                command: 'notification',
                message: `Failed to import model: ${error}`,
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
        const htmlPath = vscode.Uri.joinPath(
            this._extensionUri,
            'resources',
            'webview',
            'model-manager.html'
        );

        try {
            let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

            // Replace CSP and resource URIs
            const nonce = getNonce();
            html = html.replace(/nonce=""/g, `nonce="${nonce}"`);

            return html;
        } catch (error) {
            // Fallback to basic HTML if file not found
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
