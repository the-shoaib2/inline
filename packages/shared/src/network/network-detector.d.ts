/**
 * Monitors network connectivity and manages offline/online mode.
 *
 * Periodically checks connectivity to a reliable endpoint (Google).
 * Notifies subscribers of state changes and supports manual override.
 * Defaults to offline mode for safety.
 */
export declare class NetworkDetector {
    private isOfflineMode;
    private monitoringInterval;
    private statusCallback?;
    private checkInterval;
    private hasCheckedNetwork;
    constructor();
    /**
     * Start periodic network status checks.
     * @param callback Invoked when connectivity state changes
     */
    startMonitoring(callback?: (isOffline: boolean) => void): void;
    /**
     * Stop network monitoring and clear callbacks.
     */
    stopMonitoring(): void;
    /**
     * Check current network connectivity status.
     * First check establishes baseline; subsequent checks only run if monitoring is active.
     * @returns true if offline, false if online
     */
    checkNetworkStatus(): Promise<boolean>;
    /**
     * Make HTTPS request with timeout.
     * @throws Error on network failure or timeout
     */
    private makeRequest;
    /**
     * Get current offline mode state.
     */
    isOffline(): boolean;
    /**
     * Toggle offline mode and notify subscribers.
     */
    toggleOfflineMode(): void;
    /**
     * Update the interval between network checks.
     */
    setCheckInterval(interval: number): void;
    /**
     * Force offline mode and optionally stop monitoring.
     * @param enabled true to force offline, false to allow auto-detection
     */
    setForcedOffline(enabled: boolean): void;
}
//# sourceMappingURL=network-detector.d.ts.map