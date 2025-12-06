import * as vscode from 'vscode';
import * as os from 'os';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private isOffline: boolean = false;
    private currentModel: string = 'No model';
    private isLoading: boolean = false;
    private loadingText: string = 'Loading...';
    private cacheSize: string = '0MB';
    private memoryUsage: number = 0;
    private cpuUsage: number = 0;
    private monitorInterval: NodeJS.Timeout | null = null;
    private isDisposed: boolean = false;

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
        this.startMonitoring();
    }

    private startMonitoring(): void {
        // Update memory usage every 2 seconds
        this.monitorInterval = setInterval(() => {
            this.updateMemoryUsage();
            this.updateDisplay();
        }, 2000);
    }

    private updateMemoryUsage(): void {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        this.memoryUsage = (usedMemory / totalMemory) * 100;

        // Get process memory
        const processMemory = process.memoryUsage();
        const heapUsedMB = processMemory.heapUsed / 1024 / 1024;
        const heapTotalMB = processMemory.heapTotal / 1024 / 1024;
        this.cpuUsage = (heapUsedMB / heapTotalMB) * 100;
    }

    public updateStatus(offline: boolean): void {
        this.isOffline = offline;
        this.updateDisplay();
    }

    public setModel(modelName: string): void {
        this.currentModel = modelName;
        this.updateDisplay();
    }

    public setLoading(loading: boolean, text?: string): void {
        this.isLoading = loading;
        if (text) {
            this.loadingText = text;
        } else {
            this.loadingText = 'Loading...';
        }
        this.updateDisplay();
    }

    public setCacheSize(size: string): void {
        this.cacheSize = size;
        this.updateDisplay();
    }
    
    public setText(text: string) {
        if (this.statusBarItem) {
            this.statusBarItem.text = text;
        }
    }
    
    public setTooltip(tooltip: string) {
        if (this.statusBarItem) {
            this.statusBarItem.tooltip = tooltip;
        }
    }

    private updateDisplay(): void {
        if (this.isDisposed) {
            return;
        }

        if (this.isLoading) {
            this.statusBarItem.text = `$(sync~spin) Inline: ${this.loadingText}`;
            this.statusBarItem.tooltip = 'Inline is generating response...';
            this.statusBarItem.backgroundColor = undefined;
            return;
        }

        const icon = this.isOffline ? '$(plug)' : '$(cloud)';
        const status = this.isOffline ? 'Offline' : 'Online';
        
        // Determine background color based on memory usage
        let color: vscode.ThemeColor | undefined;
        if (this.memoryUsage >= 95) {
            color = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else if (this.memoryUsage >= 80) {
            color = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else if (this.isOffline) {
            color = new vscode.ThemeColor('statusBarItem.warningBackground');
        }

        // Show memory usage in status bar
        const memoryIcon = this.memoryUsage >= 95 ? '$(alert)' : this.memoryUsage >= 80 ? '$(warning)' : '';
        const memoryText = this.memoryUsage > 0 ? ` ${memoryIcon} ${this.memoryUsage.toFixed(1)}%` : '';
        
        this.statusBarItem.text = `${icon} Inline: ${status}${memoryText}`;
        this.statusBarItem.tooltip = this.createTooltip();
        this.statusBarItem.backgroundColor = color;
    }

    private createTooltip(): string {
        const processMemory = process.memoryUsage();
        const heapUsedMB = (processMemory.heapUsed / 1024 / 1024).toFixed(1);
        const heapTotalMB = (processMemory.heapTotal / 1024 / 1024).toFixed(1);
        const rssMB = (processMemory.rss / 1024 / 1024).toFixed(1);
        const externalMB = (processMemory.external / 1024 / 1024).toFixed(1);
        
        const totalMemoryGB = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
        const freeMemoryGB = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
        const usedMemoryGB = (parseFloat(totalMemoryGB) - parseFloat(freeMemoryGB)).toFixed(1);
        
        const cpuCount = os.cpus().length;
        const platform = os.platform();
        const arch = os.arch();
        
        const lines = [
            '🤖 Inline AI Code Completion',
            '',
            '📊 Status Information',
            `├─ Status: ${this.isOffline ? '📴 Offline Mode' : '🌐 Online'}`,
            `├─ Model: ${this.currentModel}`,
            `└─ Cache: ${this.cacheSize}`,
            '',
            '💾 System Memory',
            `├─ Total: ${totalMemoryGB} GB`,
            `├─ Used: ${usedMemoryGB} GB (${this.memoryUsage.toFixed(1)}%)`,
            `└─ Free: ${freeMemoryGB} GB`,
            '',
            '⚡ Process Memory (Node.js)',
            `├─ Heap Used: ${heapUsedMB} MB`,
            `├─ Heap Total: ${heapTotalMB} MB`,
            `├─ RSS: ${rssMB} MB`,
            `└─ External: ${externalMB} MB`,
            '',
            '🖥️  System Information',
            `├─ Platform: ${platform}`,
            `├─ Architecture: ${arch}`,
            `├─ CPU Cores: ${cpuCount}`,
            `└─ Node Version: ${process.version}`,
            '',
            '💡 Click to open Model Manager'
        ];
        return lines.join('\n');
    }

    public showError(message: string): void {
        this.statusBarItem.text = '$(error) Inline: Error';
        this.statusBarItem.tooltip = message;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    public dispose(): void {
        this.isDisposed = true;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.statusBarItem.dispose();
    }
}
