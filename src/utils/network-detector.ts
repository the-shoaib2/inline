import * as vscode from 'vscode';
import * as https from 'https';

export class NetworkDetector {
    private isOfflineMode: boolean = false;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private statusCallback?: (isOffline: boolean) => void;
    private checkInterval: number = 30000; // 30 seconds

    constructor() {
        this.checkNetworkStatus();
    }

    startMonitoring(callback?: (isOffline: boolean) => void): void {
        this.statusCallback = callback;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.checkNetworkStatus();
        }, this.checkInterval);
    }

    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        // Clear callback to prevent updates after stopping
        this.statusCallback = undefined;
    }

    async checkNetworkStatus(): Promise<boolean> {
        try {
            // Try to reach a reliable endpoint
            await this.makeRequest('https://www.google.com', 3000);
            const wasOffline = this.isOfflineMode;
            this.isOfflineMode = false;
            
            if (wasOffline && this.statusCallback) {
                this.statusCallback(false);
            }
            
            return false;
        } catch (error) {
            // Check if monitoring was stopped during request
            if (!this.statusCallback) {
                return true;
            }

            const wasOnline = !this.isOfflineMode;
            this.isOfflineMode = true;
            
            if (wasOnline) {
                this.statusCallback(true);
            }
            
            return true;
        }
    }

    private makeRequest(url: string, timeout: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout }, (response) => {
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });

            request.end();
        });
    }

    isOffline(): boolean {
        return this.isOfflineMode;
    }

    toggleOfflineMode(): void {
        this.isOfflineMode = !this.isOfflineMode;
        if (this.statusCallback) {
            this.statusCallback(this.isOfflineMode);
        }
        
        const message = this.isOfflineMode ? 'Offline mode activated' : 'Online mode activated';
        vscode.window.showInformationMessage(`Inline: ${message}`);
    }

    setCheckInterval(interval: number): void {
        this.checkInterval = interval;
        if (this.monitoringInterval) {
            this.stopMonitoring();
            this.startMonitoring(this.statusCallback);
        }
    }
}
