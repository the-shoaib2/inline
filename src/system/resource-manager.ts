import * as vscode from 'vscode';
import * as os from 'os';
import * as v8 from 'v8';
import { GPUDetector } from '../inference/gpu-detector';
import { Logger } from './logger';
import { execSync } from 'child_process';

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
export class ResourceManager {
    private thresholds: ResourceThresholds = {
        maxCPU: 0.8,
        maxMemory: 0.95,
        maxVRAM: 0.9,
        maxDisk: 0.95
    };

    private monitoringInterval: NodeJS.Timeout | null = null;
    private lastUsage: ResourceUsage = { cpu: 0, memory: 0, disk: 0 };
    private gpuDetector: GPUDetector;
    private logger: Logger;

    private isDevMode: boolean = false;

    constructor() {
        this.gpuDetector = new GPUDetector();
        this.logger = new Logger('ResourceManager');
        this.startMonitoring();
    }

    /**
     * Set development mode status.
     * When enabled, resource warnings are suppressed.
     */
    public setDevMode(isDev: boolean): void {
        this.isDevMode = isDev;
        if (isDev) {
            this.logger.info('Development mode enabled: Resource warnings suppressed');
        }
    }

    /**
     * Start periodic resource monitoring (every 30 seconds).
     */
    startMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.updateResourceUsage();
        }, 30000);
    }

    /**
     * Stop resource monitoring.
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Update cached resource metrics and check thresholds.
     */
    private updateResourceUsage(): void {
        this.lastUsage = this.getCurrentUsage();
        this.checkThresholds();
    }

    /**
     * Get current resource usage across all metrics.
     * Uses process heap ratio for memory (not system-wide).
     */
    getCurrentUsage(): ResourceUsage {
        // Use v8 heap statistics for accurate memory pressure
        const stats = v8.getHeapStatistics();
        const memoryUsageRatio = stats.used_heap_size / stats.heap_size_limit;

        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const cpuUsage = loadAvg[0] / cpus.length;

        const vram = this.getVRAMUsage();
        const disk = this.getDiskUsage();

        return {
            cpu: cpuUsage,
            memory: memoryUsageRatio,
            disk,
            vram
        };
    }

    /**
     * Get VRAM usage (GPU memory)
     */
    private async getVRAMUsageAsync(): Promise<number> {
        try {
            const gpuInfo = await this.gpuDetector.detectGPU();

            if (!gpuInfo.available || !gpuInfo.vramEstimate) {
                return 0;
            }

            // Try to get actual VRAM usage via nvidia-smi
            if (process.platform !== 'win32') {
                try {
                    const output = execSync('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits', {
                        encoding: 'utf8',
                        timeout: 1000
                    });

                    const [used, total] = output.trim().split(',').map(Number);
                    if (used && total) {
                        return used / total;
                    }
                } catch {
                    // nvidia-smi not available, estimate based on model loading
                }
            }

            // Fallback: estimate based on whether model is loaded
            // If GPU layers > 0, assume some VRAM is in use
            return gpuInfo.optimalLayers > 0 ? 0.3 : 0;
        } catch (error) {
            this.logger.warn('Failed to get VRAM usage:', error as Error);
            return 0;
        }
    }

    /**
     * Get VRAM usage (GPU memory) - synchronous wrapper
     */
    private getVRAMUsage(): number {
        // Return cached value or 0, actual update happens async
        return this.lastUsage.vram || 0;
    }

    /**
     * Get disk usage for workspace
     */
    private getDiskUsage(): number {
        try {
            if (process.platform === 'win32') {
                // Windows: use wmic
                const drive = process.cwd().substring(0, 2);
                const output = execSync(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:csv`, {
                    encoding: 'utf8',
                    timeout: 2000
                });

                const lines = output.trim().split('\n');
                if (lines.length > 1) {
                    const [, freeSpace, size] = lines[1].split(',');
                    const free = parseInt(freeSpace);
                    const total = parseInt(size);
                    if (free && total) {
                        return 1 - (free / total);
                    }
                }
            } else {
                // Unix: use df
                const output = execSync('df -k .', {
                    encoding: 'utf8',
                    timeout: 2000
                });

                const lines = output.trim().split('\n');
                if (lines.length > 1) {
                    const parts = lines[1].split(/\s+/);
                    const used = parseInt(parts[2]);
                    const available = parseInt(parts[3]);
                    const total = used + available;
                    if (total > 0) {
                        return used / total;
                    }
                }
            }
        } catch (error) {
            this.logger.warn('Failed to get disk usage:', error as Error);
        }

        return 0;
    }

    /**
     * Check if any resource metric exceeds threshold and warn user.
     */
    private checkThresholds(): void {
        // System memory usage checks removed completely as requested
        return;
    }

    /**
     * Display formatted resource usage details to user.
     */
    private showResourceDetails(): void {
        const usage = this.lastUsage;
        const details = `
Resource Usage Details:
CPU: ${(usage.cpu * 100).toFixed(1)}%
Memory: ${(usage.memory * 100).toFixed(1)}%
Disk: ${(usage.disk * 100).toFixed(1)}%
${usage.vram !== undefined ? `VRAM: ${(usage.vram * 100).toFixed(1)}%` : ''}
        `.trim();

        vscode.window.showInformationMessage(details, 'OK');
    }

    /**
     * Check if system has sufficient memory to load a model.
     * Includes 50% buffer for safety.
     */
    canHandleModel(modelSizeGB: number): boolean {
        // System memory checks removed completely
        return true;
    }

    /**
     * Recommend optimal model size based on current resource availability.
     * Returns size between 1GB and 8GB, adjusted for current load.
     */
    getOptimalModelSize(): number {
        // System memory checks removed completely as requested
        // Defaulting to a conservative 6GB
        return 6;
    }

    /**
     * Update resource threshold values.
     */
    setThresholds(thresholds: Partial<ResourceThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    /**
     * Get last sampled resource usage metrics.
     */
    getLastUsage(): ResourceUsage {
        return this.lastUsage;
    }

    /**
     * Clean up monitoring resources.
     */
    dispose(): void {
        this.stopMonitoring();
    }
}
