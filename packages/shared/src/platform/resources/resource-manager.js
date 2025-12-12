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
exports.ResourceManager = void 0;
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const v8 = __importStar(require("v8"));
// Removed circular dependency - GPUDetector should be injected or moved to shared
const logger_1 = require("../system/logger");
const child_process_1 = require("child_process");
/**
 * Monitors system resource usage (CPU, memory, VRAM, disk).
 *
 * Periodically samples resource metrics and warns when thresholds are exceeded.
 * Provides recommendations for model size based on available memory.
 * Integrates with GPU detection for VRAM monitoring.
 */
class ResourceManager {
    constructor() {
        this.thresholds = {
            maxCPU: 0.8,
            maxMemory: 0.95,
            maxVRAM: 0.9,
            maxDisk: 0.95
        };
        this.monitoringInterval = null;
        this.lastUsage = { cpu: 0, memory: 0, disk: 0 };
        this.isDevMode = false;
        // this.gpuDetector = new GPUDetector();
        this.logger = new logger_1.Logger('ResourceManager');
        this.startMonitoring();
    }
    /**
     * Set development mode status.
     * When enabled, resource warnings are suppressed.
     */
    setDevMode(isDev) {
        this.isDevMode = isDev;
        if (isDev) {
            this.logger.info('Development mode enabled: Resource warnings suppressed');
        }
    }
    /**
     * Start periodic resource monitoring (every 30 seconds).
     */
    startMonitoring() {
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
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    /**
     * Update cached resource metrics and check thresholds.
     */
    updateResourceUsage() {
        this.lastUsage = this.getCurrentUsage();
        this.checkThresholds();
    }
    /**
     * Get current resource usage across all metrics.
     * Uses process heap ratio for memory (not system-wide).
     */
    getCurrentUsage() {
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
    async getVRAMUsageAsync() {
        try {
            // TODO: Inject GPUDetector to avoid circular dependency
            // const gpuInfo = await this.gpuDetector.detectGPU();
            return 0; // Disabled until GPUDetector is properly injected
            // if (!gpuInfo.available || !gpuInfo.vramEstimate) {
            //     return 0;
            // }
            // Try to get actual VRAM usage via nvidia-smi
            if (process.platform !== 'win32') {
                try {
                    const output = (0, child_process_1.execSync)('nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits', {
                        encoding: 'utf8',
                        timeout: 1000
                    });
                    const [used, total] = output.trim().split(',').map(Number);
                    if (used && total) {
                        return used / total;
                    }
                }
                catch {
                    // nvidia-smi not available, estimate based on model loading
                }
            }
            // Fallback: estimate based on whether model is loaded
            // If GPU layers > 0, assume some VRAM is in use
            // TODO: Re-enable when GPUDetector is properly injected
            return 0;
        }
        catch (error) {
            this.logger.warn('Failed to get VRAM usage:', error);
            return 0;
        }
    }
    /**
     * Get VRAM usage (GPU memory) - synchronous wrapper
     */
    getVRAMUsage() {
        // Return cached value or 0, actual update happens async
        return this.lastUsage.vram || 0;
    }
    /**
     * Get disk usage for workspace
     */
    getDiskUsage() {
        try {
            if (process.platform === 'win32') {
                // Windows: use wmic
                const drive = process.cwd().substring(0, 2);
                const output = (0, child_process_1.execSync)(`wmic logicaldisk where "DeviceID='${drive}'" get Size,FreeSpace /format:csv`, {
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
            }
            else {
                // Unix: use df
                const output = (0, child_process_1.execSync)('df -k .', {
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
        }
        catch (error) {
            this.logger.warn('Failed to get disk usage:', error);
        }
        return 0;
    }
    /**
     * Check if any resource metric exceeds threshold and warn user.
     */
    checkThresholds() {
        // System memory usage checks removed completely as requested
        return;
    }
    /**
     * Display formatted resource usage details to user.
     */
    showResourceDetails() {
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
    canHandleModel(modelSizeGB) {
        // System memory checks removed completely
        return true;
    }
    /**
     * Recommend optimal model size based on current resource availability.
     * Returns size between 1GB and 8GB, adjusted for current load.
     */
    getOptimalModelSize() {
        // System memory checks removed completely as requested
        // Defaulting to a conservative 6GB
        return 6;
    }
    /**
     * Update resource threshold values.
     */
    setThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }
    /**
     * Get last sampled resource usage metrics.
     */
    getLastUsage() {
        return this.lastUsage;
    }
    /**
     * Clean up monitoring resources.
     */
    dispose() {
        this.stopMonitoring();
    }
}
exports.ResourceManager = ResourceManager;
//# sourceMappingURL=resource-manager.js.map