import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private isOffline: boolean = false;
    private currentModel: string = 'No model';
    private isLoading: boolean = false;
    private cacheSize: string = '0MB';

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.command = 'inline.modelManager';
    }

    public initialize(): void {
        this.updateDisplay();
        this.statusBarItem.show();
    }

    public updateStatus(offline: boolean): void {
        this.isOffline = offline;
        this.updateDisplay();
    }

    public setModel(modelName: string): void {
        this.currentModel = modelName;
        this.updateDisplay();
    }

    public setLoading(loading: boolean): void {
        this.isLoading = loading;
        this.updateDisplay();
    }

    public setCacheSize(size: string): void {
        this.cacheSize = size;
        this.updateDisplay();
    }

    private updateDisplay(): void {
        if (this.isLoading) {
            this.statusBarItem.text = `$(sync~spin) Inline: Loading...`;
            this.statusBarItem.tooltip = 'Inline is loading model...';
            this.statusBarItem.backgroundColor = undefined;
            return;
        }

        const icon = this.isOffline ? '$(plug)' : '$(cloud)';
        const status = this.isOffline ? 'Offline' : 'Online';
        const color = this.isOffline ? 
            new vscode.ThemeColor('statusBarItem.warningBackground') : 
            undefined;

        this.statusBarItem.text = `${icon} Inline: ${status}`;
        this.statusBarItem.tooltip = this.createTooltip();
        this.statusBarItem.backgroundColor = color;
    }

    private createTooltip(): string {
        const lines = [
            `Inline AI Code Completion`,
            ``,
            `Status: ${this.isOffline ? 'Offline Mode' : 'Online'}`,
            `Model: ${this.currentModel}`,
            `Cache: ${this.cacheSize}`,
            ``,
            `Click to open Model Manager`
        ];
        return lines.join('\n');
    }

    public showError(message: string): void {
        this.statusBarItem.text = `$(error) Inline: Error`;
        this.statusBarItem.tooltip = message;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
