import * as vscode from 'vscode';
import * as path from 'path';
import { ModelManager, ModelInfo } from '../core/model-manager';

export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'inline.modelManagerView';
    
    private _view?: vscode.WebviewView;
    
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly modelManager: ModelManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
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
            switch (data.type) {
                case 'getModels':
                    this.sendModels();
                    break;
                case 'downloadModel':
                    await this.downloadModel(data.modelId);
                    break;
                case 'selectModel':
                    await this.selectModel(data.modelId);
                    break;
                case 'removeModel':
                    await this.removeModel(data.modelId);
                    break;
            }
        });

        // Send initial data
        this.sendModels();
    }

    private sendModels() {
        if (this._view) {
            const models = this.modelManager.getAllModels();
            const currentModel = this.modelManager.getCurrentModel();
            
            this._view.webview.postMessage({
                type: 'updateModels',
                models: models,
                currentModel: currentModel?.id
            });
        }
    }

    private async downloadModel(modelId: string) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading model: ${modelId}`,
                cancellable: false
            }, async (progress) => {
                await this.modelManager.downloadModel(modelId, (percent) => {
                    progress.report({ increment: percent });
                });
            });
            
            vscode.window.showInformationMessage(`Model ${modelId} downloaded successfully!`);
            this.sendModels();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download model: ${error}`);
        }
    }

    private async selectModel(modelId: string) {
        try {
            await this.modelManager.setCurrentModel(modelId);
            vscode.window.showInformationMessage(`Model ${modelId} selected`);
            this.sendModels();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to select model: ${error}`);
        }
    }

    private async removeModel(modelId: string) {
        try {
            await this.modelManager.removeModel(modelId);
            vscode.window.showInformationMessage(`Model ${modelId} removed`);
            this.sendModels();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove model: ${error}`);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'resources', 'webview', 'styles.css')
        );

        const codiconsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${getNonce()}';">
    <link href="${codiconsUri}" rel="stylesheet" />
    <link href="${styleUri}" rel="stylesheet">
    <title>Model Manager</title>
</head>
<body>
    <div class="container">
        <header>
            <h1><i class="codicon codicon-cloud-download"></i> Model Manager</h1>
            <p class="subtitle">Manage your AI models for offline code completion</p>
        </header>

        <section id="current-model" class="section">
            <h2>Current Model</h2>
            <div id="current-model-info" class="model-card current">
                <div class="loading">
                    <i class="codicon codicon-loading codicon-modifier-spin"></i>
                    Loading...
                </div>
            </div>
        </section>

        <section id="available-models" class="section">
            <h2>Available Models</h2>
            <div id="models-list" class="models-grid">
                <div class="loading">
                    <i class="codicon codicon-loading codicon-modifier-spin"></i>
                    Loading models...
                </div>
            </div>
        </section>
    </div>

    <script nonce="${getNonce()}">
        const vscode = acquireVsCodeApi();

        // Request models on load
        vscode.postMessage({ type: 'getModels' });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'updateModels':
                    updateModelsDisplay(message.models, message.currentModel);
                    break;
            }
        });

        function updateModelsDisplay(models, currentModelId) {
            const currentModelDiv = document.getElementById('current-model-info');
            const modelsListDiv = document.getElementById('models-list');

            // Update current model
            const currentModel = models.find(m => m.id === currentModelId);
            if (currentModel) {
                currentModelDiv.innerHTML = createModelCard(currentModel, true);
            } else {
                currentModelDiv.innerHTML = '<p class="no-model">No model selected</p>';
            }

            // Update available models
            modelsListDiv.innerHTML = models
                .filter(m => m.id !== currentModelId)
                .map(m => createModelCard(m, false))
                .join('');
        }

        function createModelCard(model, isCurrent) {
            const sizeInMB = (model.size / 1024 / 1024).toFixed(2);
            const isDownloaded = model.isDownloaded;
            
            return \`
                <div class="model-card \${isCurrent ? 'current' : ''}">
                    <div class="model-header">
                        <h3>
                            <i class="codicon codicon-\${isDownloaded ? 'check' : 'cloud-download'}"></i>
                            \${model.name}
                        </h3>
                        <span class="model-size">\${sizeInMB} MB</span>
                    </div>
                    <p class="model-description">\${model.description}</p>
                    <div class="model-languages">
                        \${model.languages.map(lang => \`<span class="language-tag">\${lang}</span>\`).join('')}
                    </div>
                    <div class="model-requirements">
                        <span><i class="codicon codicon-server"></i> VRAM: \${model.requirements.vram || 'N/A'}GB</span>
                        <span><i class="codicon codicon-database"></i> RAM: \${model.requirements.ram || 'N/A'}GB</span>
                    </div>
                    <div class="model-actions">
                        \${!isDownloaded ? \`
                            <button class="button primary" onclick="downloadModel('\${model.id}')">
                                <i class="codicon codicon-cloud-download"></i> Download
                            </button>
                        \` : \`
                            \${!isCurrent ? \`
                                <button class="button primary" onclick="selectModel('\${model.id}')">
                                    <i class="codicon codicon-check"></i> Select
                                </button>
                            \` : \`
                                <span class="current-badge">
                                    <i class="codicon codicon-star-full"></i> Current
                                </span>
                            \`}
                            <button class="button secondary" onclick="removeModel('\${model.id}')">
                                <i class="codicon codicon-trash"></i> Remove
                            </button>
                        \`}
                    </div>
                </div>
            \`;
        }

        function downloadModel(modelId) {
            vscode.postMessage({ type: 'downloadModel', modelId });
        }

        function selectModel(modelId) {
            vscode.postMessage({ type: 'selectModel', modelId });
        }

        function removeModel(modelId) {
            if (confirm('Are you sure you want to remove this model?')) {
                vscode.postMessage({ type: 'removeModel', modelId });
            }
        }
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
