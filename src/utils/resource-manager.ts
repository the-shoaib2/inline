import * as vscode from 'vscode';
import * as os from 'os';

export interface ResourceUsage {
    cpu: number;
    memory: number;
    vram?: number;
    disk: number;
}

export interface ResourceThresholds {
    maxCPU: number;
    maxMemory: number;
    maxVRAM?: number;
    maxDisk: number;
}

export class ResourceManager {
    private thresholds: ResourceThresholds = {
        maxCPU: 0.8,
        maxMemory: 0.9,
        maxVRAM: 0.9,
        maxDisk: 0.95
    };

    private monitoringInterval: NodeJS.Timeout | null = null;
    private lastUsage: ResourceUsage = { cpu: 0, memory: 0, disk: 0 };

    constructor() {
        this.startMonitoring();
    }

    startMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        this.monitoringInterval = setInterval(() => {
            this.updateResourceUsage();
        }, 30000); // Check every 30 seconds (reduced from 5s for better performance)
    }

    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    private updateResourceUsage(): void {
        this.lastUsage = this.getCurrentUsage();
        
        // Check thresholds and emit warnings
        this.checkThresholds();
    }

    getCurrentUsage(): ResourceUsage {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        const cpuUsage = loadAvg[0] / cpus.length;

        return {
            cpu: cpuUsage,
            memory: usedMemory / totalMemory,
            disk: 0, // TODO: Implement disk usage monitoring
            vram: 0  // TODO: Implement VRAM monitoring
        };
    }

    private checkThresholds(): void {
        if (this.lastUsage.cpu > this.thresholds.maxCPU) {
            vscode.window.showWarningMessage(
                `High CPU usage detected: ${(this.lastUsage.cpu * 100).toFixed(1)}%`,
                'Details'
            ).then(selection => {
                if (selection === 'Details') {
                    this.showResourceDetails();
                }
            });
        }

        if (this.lastUsage.memory > this.thresholds.maxMemory) {
            vscode.window.showWarningMessage(
                `High memory usage detected: ${(this.lastUsage.memory * 100).toFixed(1)}%`,
                'Details'
            ).then(selection => {
                if (selection === 'Details') {
                    this.showResourceDetails();
                }
            });
        }
    }

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

    canHandleModel(modelSizeGB: number): boolean {
        const availableMemory = os.freemem() / (1024 * 1024 * 1024); // Convert to GB
        const requiredMemory = modelSizeGB * 1.5; // Add 50% buffer
        
        return availableMemory >= requiredMemory && 
               this.lastUsage.memory < this.thresholds.maxMemory;
    }

    getOptimalModelSize(): number {
        const availableMemory = os.freemem() / (1024 * 1024 * 1024); // Convert to GB
        const currentLoad = this.lastUsage.memory;
        
        // Adjust based on current memory usage
        let usableMemory = availableMemory * (1 - currentLoad);
        
        // Leave some buffer for system
        usableMemory *= 0.7;
        
        return Math.max(1, Math.min(usableMemory, 8)); // Between 1GB and 8GB
    }

    setThresholds(thresholds: Partial<ResourceThresholds>): void {
        this.thresholds = { ...this.thresholds, ...thresholds };
    }

    getLastUsage(): ResourceUsage {
        return this.lastUsage;
    }

    dispose(): void {
        this.stopMonitoring();
    }
}
