import * as vscode from 'vscode';
import { ModelManager } from '../inference/model-manager';

export class ModelManagerView {
    private modelManager: ModelManager;
    private panel: vscode.WebviewPanel | null = null;

    constructor(modelManager: ModelManager) {
        this.modelManager = modelManager;
    }

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'inlineModelManager',
            'Inline Model Manager',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this._getHtmlForWebview(this.panel.webview);
        this.panel.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            []
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        this.updateModelsList();
    }

    private _getHtmlForWebview(_webview: vscode.Webview): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inline Model Manager</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
        .model-card {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            background: var(--vscode-editor-background);
        }
        .model-card.downloaded {
            border-color: var(--vscode-testing-iconPassed);
        }
        .model-name {
            font-weight: bold;
            font-size: 1.1em;
            margin-bottom: 5px;
        }
        .model-description {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 10px;
        }
        .model-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 0.9em;
        }
        .model-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 5px 10px;
            border: 1px solid var(--vscode-button-background);
            border-radius: 3px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-size: 0.9em;
        }
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .btn.danger {
            background: var(--vscode-errorBackground);
            color: var(--vscode-errorForeground);
            border-color: var(--vscode-errorBorder);
        }
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status-indicator.downloaded {
            background: var(--vscode-testing-iconPassed);
        }
        .status-indicator.not-downloaded {
            background: var(--vscode-testing-iconFailed);
        }
        .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--vscode-progressBar-background);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }
        .current-model {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-button-background);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Inline Model Manager</h1>
        <button class="btn" onclick="refreshModels()">Refresh</button>
    </div>

    <div id="models-container">
        <!-- Models will be populated here -->
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function downloadModel(modelId) {
            vscode.postMessage({
                command: 'downloadModel',
                modelId: modelId
            });
        }

        function removeModel(modelId) {
            vscode.postMessage({
                command: 'removeModel',
                modelId: modelId
            });
        }

        function setCurrentModel(modelId) {
            vscode.postMessage({
                command: 'setCurrentModel',
                modelId: modelId
            });
        }

        function refreshModels() {
            vscode.postMessage({ command: 'refreshModels' });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateModels':
                    renderModels(message.models);
                    break;
                case 'downloadProgress':
                    updateDownloadProgress(message.modelId, message.progress);
                    break;
            }
        });

        function renderModels(models) {
            const container = document.getElementById('models-container');
            container.innerHTML = '';

            models.forEach(model => {
                const isCurrentModel = model.isCurrent;
                const card = document.createElement('div');
                card.className = \`model-card \${model.isDownloaded ? 'downloaded' : ''} \${isCurrentModel ? 'current-model' : ''}\`;
                
                card.innerHTML = \`
                    <div class="model-name">
                        <span class="status-indicator \${model.isDownloaded ? 'downloaded' : 'not-downloaded'}"></span>
                        \${model.name}
                        \${isCurrentModel ? '(Current)' : ''}
                    </div>
                    <div class="model-description">\${model.description}</div>
                    <div class="model-stats">
                        <span>Size: \${formatFileSize(model.size)}</span>
                        <span>Languages: \${model.languages.join(', ')}</span>
                        <span>VRAM: \${model.requirements.vram || 'N/A'}GB</span>
                    </div>
                    <div class="model-actions">
                        \${model.isDownloaded ? 
                            \`<button class="btn" onclick="setCurrentModel('\${model.id}')" \${isCurrentModel ? 'disabled' : ''}>Use Model</button>\` +
                            \`<button class="btn danger" onclick="removeModel('\${model.id}')">\${isCurrentModel ? 'Remove (Switch to Default)' : 'Remove'}</button>\`
                            :
                            \`<button class="btn" onclick="downloadModel('\${model.id}')">Download</button>\`
                        }
                    </div>
                    <div id="progress-\${model.id}" class="progress-bar" style="display: none;">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                \`;
                
                container.appendChild(card);
            });
        }

        function updateDownloadProgress(modelId, progress) {
            const progressBar = document.getElementById(\`progress-\${modelId}\`);
            const progressFill = progressBar?.querySelector('.progress-fill');
            
            if (progressBar && progressFill) {
                progressBar.style.display = 'block';
                progressFill.style.width = \`\${progress}%\`;
                
                if (progress >= 100) {
                    setTimeout(() => {
                        progressBar.style.display = 'none';
                    }, 1000);
                }
            }
        }

        function formatFileSize(bytes) {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        }

        // Initial load
        refreshModels();
    </script>
</body>
</html>
        `;
    }

    private async handleMessage(message: { command: string;[key: string]: unknown }): Promise<void> {
        switch (message.command) {
            case 'downloadModel':
                this.downloadModel(message.modelId as string);
                break;
            case 'removeModel':
                this.removeModel(message.modelId as string);
                break;
            case 'setCurrentModel':
                await this.setCurrentModel(message.modelId as string);
                break;
            case 'refreshModels':
                this.updateModelsList();
                break;
        }
    }

    private async downloadModel(modelId: string): Promise<void> {
        try {
            await this.modelManager.downloadModel(modelId, (progress) => {
                this.panel?.webview.postMessage({
                    command: 'downloadProgress',
                    modelId,
                    progress
                });
            });
            this.updateModelsList();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to download model: ${error}`);
        }
    }

    private async removeModel(modelId: string): Promise<void> {
        try {
            await this.modelManager.removeModel(modelId);
            this.updateModelsList();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to remove model: ${error}`);
        }
    }

    private async setCurrentModel(modelId: string): Promise<void> {
        try {
            await this.modelManager.setCurrentModel(modelId);
            this.updateModelsList();
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to set current model: ${error}`);
        }
    }

    private updateModelsList(): void {
        const models = this.modelManager.getAllModels().map(model => ({
            ...model,
            isCurrent: this.modelManager.getCurrentModel()?.id === model.id
        }));

        this.panel?.webview.postMessage({
            command: 'updateModels',
            models
        });
    }

    dispose(): void {
        this.panel?.dispose();
    }
}
