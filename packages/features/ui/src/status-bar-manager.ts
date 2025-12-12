import * as vscode from 'vscode';
import * as os from 'os';

/**
 * Manages VS Code status bar display for Inline extension.
 *
 * Displays:
 * - Current model name with AI icon
 * - Online/offline status with network indicators
 * - Loading state with animated spinner
 * - Cache size with storage icon
 * - Memory usage with performance indicators
 * - Error states with warning icons
 *
 * Updates every 2 seconds with system metrics.
 * Clickable to open Model Manager.
 * Features gradient colors and smooth transitions.
 */
export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private isOffline: boolean = false;
    private currentModel: string = 'No model';
    private isLoading: boolean = false;
    private loadingText: string = 'Thinking...';
    private cacheSize: string = '0MB';
    private monitorInterval: NodeJS.Timeout | null = null;
    private isDisposed: boolean = false;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        // Click to open Model Manager
        this.statusBarItem.command = 'inline.modelManager';
    }

    /**
     * Initialize status bar display and start monitoring.
     */
    public initialize(): void {
        this.updateDisplay();
        this.statusBarItem.show();
        this.startMonitoring();
    }

    /**
     * Start periodic display updates.
     * Updates every 2 seconds.
     */
    private startMonitoring(): void {
        this.monitorInterval = setInterval(() => {
            this.updateDisplay();
        }, 2000);
    }

    /**
     * Update online/offline status indicator.
     */
    public updateStatus(offline: boolean): void {
        this.isOffline = offline;
        this.updateDisplay();
    }

    /**
     * Update displayed model name.
     */
    public setModel(modelName: string): void {
        this.currentModel = modelName;
        this.updateDisplay();
    }

    /**
     * Set loading state with optional custom message.
     */
    public setLoading(loading: boolean, text?: string): void {
        this.isLoading = loading;
        if (text) {
            this.loadingText = text;
        } else {
            this.loadingText = 'Loading...';
        }
        this.updateDisplay();
    }

    /**
     * Update displayed cache size.
     */
    public setCacheSize(size: string): void {
        this.cacheSize = size;
        this.updateDisplay();
    }

    /**
     * Set arbitrary status bar text.
     */
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

        // Background color based on offline status only
        let color: vscode.ThemeColor | undefined;
        if (this.isOffline) {
            color = new vscode.ThemeColor('statusBarItem.warningBackground');
        }

        this.statusBarItem.text = `${icon} Inline: ${status}`;
        this.statusBarItem.tooltip = this.createTooltip();
        this.statusBarItem.backgroundColor = color;
    }

    private createTooltip(): string {
        const processMemory = process.memoryUsage();
        const heapUsedMB = (processMemory.heapUsed / 1024 / 1024).toFixed(1);
        const heapTotalMB = (processMemory.heapTotal / 1024 / 1024).toFixed(1);
        const rssMB = (processMemory.rss / 1024 / 1024).toFixed(1);
        const externalMB = (processMemory.external / 1024 / 1024).toFixed(1);

        const cpuCount = os.cpus().length;
        const platform = os.platform();
        const arch = os.arch();

        const lines = [
            '═════════════════',
            'INLINE',
            '═════════════════',
            '',
            'Status',
            '-----------------',
            `Status: ${this.isOffline ? 'Offline' : 'Online'}` ,
            `Model: ${this.currentModel}`                      ,
            `Cache: ${this.cacheSize}`                         ,
            '',
            'Process Memory',
            '-----------------',
            `Heap Used: ${heapUsedMB} MB`                      ,
            `Heap Total: ${heapTotalMB} MB`                   ,
            `RSS: ${rssMB} MB`                                ,
            `External: ${externalMB} MB`                      ,
            '',
            'System Information',
            '-----------------',
            `Platform: ${platform}`                            ,
            `Architecture: ${arch}`                           ,
            `CPU Cores: ${cpuCount}`                          ,
            '',
            '═════════════════',
            'Click to open Model Manager'
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
