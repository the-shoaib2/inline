"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkDetector = void 0;
const vscode = __importStar(require("vscode"));
const https = __importStar(require("https"));
/**
 * Monitors network connectivity and manages offline/online mode.
 *
 * Periodically checks connectivity to a reliable endpoint (Google).
 * Notifies subscribers of state changes and supports manual override.
 * Defaults to offline mode for safety.
 */
class NetworkDetector {
    constructor() {
        this.isOfflineMode = true;
        this.monitoringInterval = null;
        this.checkInterval = 30000;
        this.hasCheckedNetwork = false;
        // Defer network check to avoid blocking extension activation
    }
    /**
     * Start periodic network status checks.
     * @param callback Invoked when connectivity state changes
     */
    startMonitoring(callback) {
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
    stopMonitoring() {
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
    async checkNetworkStatus() {
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
            }
            catch (error) {
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
        }
        catch (error) {
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
    makeRequest(url, timeout) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout }, (response) => {
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    resolve();
                }
                else {
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
    isOffline() {
        return this.isOfflineMode;
    }
    /**
     * Toggle offline mode and notify subscribers.
     */
    toggleOfflineMode() {
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
    setCheckInterval(interval) {
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
    setForcedOffline(enabled) {
        this.isOfflineMode = enabled;
        if (enabled) {
            // Stop monitoring to prevent auto-reconnection
            this.stopMonitoring();
        }
        else {
            // Resume monitoring if forced offline is disabled
            this.startMonitoring(this.statusCallback);
        }
        if (this.statusCallback) {
            this.statusCallback(this.isOfflineMode);
        }
    }
}
exports.NetworkDetector = NetworkDetector;
//# sourceMappingURL=network-detector.js.map