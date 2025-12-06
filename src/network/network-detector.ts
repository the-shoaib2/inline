import * as vscode from 'vscode';
import * as https from 'https';

export class NetworkDetector {
    private isOfflineMode: boolean = true; // Start in offline mode by default
    private monitoringInterval: NodeJS.Timeout | null = null;
    private statusCallback?: (isOffline: boolean) => void;
    private checkInterval: number = 30000; // 30 seconds
    private hasCheckedNetwork: boolean = false; // Track if we've ever checked network

    constructor() {
        // Don't check network status during construction to avoid blocking
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
        // If we haven't checked network before, do it once to establish baseline
        if (!this.hasCheckedNetwork) {
            this.hasCheckedNetwork = true;
            try {
                // Try to reach a reliable endpoint with short timeout
                await this.makeRequest('https://www.google.com', 2000);
                const wasOffline = this.isOfflineMode;
                this.isOfflineMode = false;

                if (wasOffline && this.statusCallback) {
                    this.statusCallback(false);
                }

                return false;
            } catch (error) {
                // Keep offline mode if network check fails
                if (this.statusCallback) {
                    this.statusCallback(true);
                }
                return true;
            }
        }

        // Subsequent checks only happen if monitoring is active
        if (!this.monitoringInterval) {
            return this.isOfflineMode;
        }

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

    setForcedOffline(enabled: boolean): void {
        this.isOfflineMode = enabled;
        if (enabled) {
            // Stop monitoring to prevent auto-reconnection
            this.stopMonitoring();
        } else {
            // Restart monitoring if disabled
            this.startMonitoring(this.statusCallback);
        }
        
        if (this.statusCallback) {
            this.statusCallback(this.isOfflineMode);
        }
    }
}
