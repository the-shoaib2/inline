import * as vscode from 'vscode';
import * as https from 'https';

/**
 * Monitors network connectivity and manages offline/online mode.
 *
 * Periodically checks connectivity to a reliable endpoint (Google).
 * Notifies subscribers of state changes and supports manual override.
 * Defaults to offline mode for safety.
 */
export class NetworkDetector {
    private isOfflineMode: boolean = true;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private statusCallback?: (isOffline: boolean) => void;
    private checkInterval: number = 30000;
    private hasCheckedNetwork: boolean = false;

    constructor() {
        // Defer network check to avoid blocking extension activation
    }

    /**
     * Start periodic network status checks.
     * @param callback Invoked when connectivity state changes
     */
    startMonitoring(callback?: (isOffline: boolean) => void): void {
        this.statusCallback = callback;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.checkNetworkStatus();
        }, this.checkInterval);
    }

    /**
     * Stop network monitoring and clear callbacks.
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        this.statusCallback = undefined;
    }

    /**
     * Check current network connectivity status.
     * First check establishes baseline; subsequent checks only run if monitoring is active.
     * @returns true if offline, false if online
     */
    async checkNetworkStatus(): Promise<boolean> {
        // Initial check with shorter timeout to establish baseline
        if (!this.hasCheckedNetwork) {
            this.hasCheckedNetwork = true;
            try {
                await this.makeRequest('https://www.google.com', 2000);
                const wasOffline = this.isOfflineMode;
                this.isOfflineMode = false;

                if (wasOffline && this.statusCallback) {
                    this.statusCallback(false);
                }

                return false;
            } catch (error) {
                if (this.statusCallback) {
                    this.statusCallback(true);
                }
                return true;
            }
        }

        // Only continue monitoring if active
        if (!this.monitoringInterval) {
            return this.isOfflineMode;
        }

        try {
            await this.makeRequest('https://www.google.com', 3000);
            const wasOffline = this.isOfflineMode;
            this.isOfflineMode = false;

            if (wasOffline && this.statusCallback) {
                this.statusCallback(false);
            }

            return false;
        } catch (error) {
            // Handle case where monitoring was stopped during request
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

    /**
     * Make HTTPS request with timeout.
     * @throws Error on network failure or timeout
     */
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

    /**
     * Get current offline mode state.
     */
    isOffline(): boolean {
        return this.isOfflineMode;
    }

    /**
     * Toggle offline mode and notify subscribers.
     */
    toggleOfflineMode(): void {
        this.isOfflineMode = !this.isOfflineMode;
        if (this.statusCallback) {
            this.statusCallback(this.isOfflineMode);
        }

        const message = this.isOfflineMode ? 'Offline mode activated' : 'Online mode activated';
        vscode.window.showInformationMessage(`Inline: ${message}`);
    }

    /**
     * Update the interval between network checks.
     */
    setCheckInterval(interval: number): void {
        this.checkInterval = interval;
        if (this.monitoringInterval) {
            this.stopMonitoring();
            this.startMonitoring(this.statusCallback);
        }
    }

    /**
     * Force offline mode and optionally stop monitoring.
     * @param enabled true to force offline, false to allow auto-detection
     */
    setForcedOffline(enabled: boolean): void {
        this.isOfflineMode = enabled;
        if (enabled) {
            // Stop monitoring to prevent auto-reconnection
            this.stopMonitoring();
        } else {
            // Resume monitoring if forced offline is disabled
            this.startMonitoring(this.statusCallback);
        }

        if (this.statusCallback) {
            this.statusCallback(this.isOfflineMode);
        }
    }
}
