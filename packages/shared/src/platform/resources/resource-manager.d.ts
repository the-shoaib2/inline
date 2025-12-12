/**
 * Current resource utilization metrics.
 * All values are normalized to 0-1 range (percentage).
 */
export interface ResourceUsage {
    cpu: number;
    memory: number;
    vram?: number;
    disk: number;
}
/**
 * Thresholds for warning on resource exhaustion.
 * Values are normalized to 0-1 range.
 */
export interface ResourceThresholds {
    maxCPU: number;
    maxMemory: number;
    maxVRAM?: number;
    maxDisk: number;
}
/**
 * Monitors system resource usage (CPU, memory, VRAM, disk).
 *
 * Periodically samples resource metrics and warns when thresholds are exceeded.
 * Provides recommendations for model size based on available memory.
 * Integrates with GPU detection for VRAM monitoring.
 */
export declare class ResourceManager {
    private thresholds;
    private monitoringInterval;
    private lastUsage;
    private logger;
    private isDevMode;
    constructor();
    /**
     * Set development mode status.
     * When enabled, resource warnings are suppressed.
     */
    setDevMode(isDev: boolean): void;
    /**
     * Start periodic resource monitoring (every 30 seconds).
     */
    startMonitoring(): void;
    /**
     * Stop resource monitoring.
     */
    stopMonitoring(): void;
    /**
     * Update cached resource metrics and check thresholds.
     */
    private updateResourceUsage;
    /**
     * Get current resource usage across all metrics.
     * Uses process heap ratio for memory (not system-wide).
     */
    getCurrentUsage(): ResourceUsage;
    /**
     * Get VRAM usage (GPU memory)
     */
    private getVRAMUsageAsync;
    /**
     * Get VRAM usage (GPU memory) - synchronous wrapper
     */
    private getVRAMUsage;
    /**
     * Get disk usage for workspace
     */
    private getDiskUsage;
    /**
     * Check if any resource metric exceeds threshold and warn user.
     */
    private checkThresholds;
    /**
     * Display formatted resource usage details to user.
     */
    private showResourceDetails;
    /**
     * Check if system has sufficient memory to load a model.
     * Includes 50% buffer for safety.
     */
    canHandleModel(modelSizeGB: number): boolean;
    /**
     * Recommend optimal model size based on current resource availability.
     * Returns size between 1GB and 8GB, adjusted for current load.
     */
    getOptimalModelSize(): number;
    /**
     * Update resource threshold values.
     */
    setThresholds(thresholds: Partial<ResourceThresholds>): void;
    /**
     * Get last sampled resource usage metrics.
     */
    getLastUsage(): ResourceUsage;
    /**
     * Clean up monitoring resources.
     */
    dispose(): void;
}
//# sourceMappingURL=resource-manager.d.ts.map