import * as os from 'os';
import { Logger } from './logger';

export interface GPUInfo {
    available: boolean;
    type: 'metal' | 'cuda' | 'none';
    optimalLayers: number;
    vramEstimate?: number;
}

export class GPUDetector {
    private logger: Logger;
    private cachedInfo: GPUInfo | null = null;

    constructor() {
        this.logger = new Logger('GPUDetector');
    }

    /**
     * Detect available GPU and optimal configuration
     */
    public async detectGPU(): Promise<GPUInfo> {
        if (this.cachedInfo) {
            return this.cachedInfo;
        }

        this.logger.info('Detecting GPU configuration...');

        const platform = os.platform();
        let gpuInfo: GPUInfo;

        if (platform === 'darwin') {
            // macOS - check for Metal support
            gpuInfo = await this.detectMetal();
        } else if (platform === 'linux' || platform === 'win32') {
            // Linux/Windows - check for CUDA
            gpuInfo = await this.detectCUDA();
        } else {
            // Unsupported platform
            gpuInfo = {
                available: false,
                type: 'none',
                optimalLayers: 0
            };
        }

        this.cachedInfo = gpuInfo;
        this.logger.info(`GPU Detection: ${JSON.stringify(gpuInfo)}`);

        return gpuInfo;
    }

    /**
     * Detect Metal support on macOS
     */
    private async detectMetal(): Promise<GPUInfo> {
        try {
            // On macOS, Metal is available on all modern Macs (2012+)
            // We can safely assume Metal is available
            const totalMemory = os.totalmem();
            const vramEstimate = Math.floor(totalMemory * 0.25 / (1024 * 1024 * 1024)); // 25% of RAM as VRAM estimate

            // Optimal layers based on available memory
            // For Qwen2.5-Coder-1.5B, each layer is ~50-100MB
            const optimalLayers = this.calculateOptimalLayers(vramEstimate);

            return {
                available: true,
                type: 'metal',
                optimalLayers,
                vramEstimate
            };
        } catch (error) {
            this.logger.warn(`Metal detection failed: ${error}`);
            return {
                available: false,
                type: 'none',
                optimalLayers: 0
            };
        }
    }

    /**
     * Detect CUDA support on Linux/Windows
     */
    private async detectCUDA(): Promise<GPUInfo> {
        try {
            // Try to detect NVIDIA GPU
            // This is a simple heuristic - in production, you'd use nvidia-smi or similar
            const { execSync } = require('child_process');
            
            try {
                // Try nvidia-smi command
                const output = execSync('nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits', {
                    encoding: 'utf-8',
                    timeout: 2000
                });

                const vramMB = parseInt(output.trim(), 10);
                const vramGB = Math.floor(vramMB / 1024);
                const optimalLayers = this.calculateOptimalLayers(vramGB);

                return {
                    available: true,
                    type: 'cuda',
                    optimalLayers,
                    vramEstimate: vramGB
                };
            } catch {
                // nvidia-smi not found or failed
                return {
                    available: false,
                    type: 'none',
                    optimalLayers: 0
                };
            }
        } catch (error) {
            this.logger.warn(`CUDA detection failed: ${error}`);
            return {
                available: false,
                type: 'none',
                optimalLayers: 0
            };
        }
    }

    /**
     * Calculate optimal number of layers to offload to GPU
     * Based on available VRAM
     */
    private calculateOptimalLayers(vramGB: number): number {
        // Conservative estimates for Qwen2.5-Coder-1.5B
        // Each layer ~50-100MB, model has ~24-28 layers
        
        if (vramGB >= 8) {
            return 28; // Full offload
        } else if (vramGB >= 6) {
            return 24; // Most layers
        } else if (vramGB >= 4) {
            return 16; // Half layers
        } else if (vramGB >= 2) {
            return 8; // Quarter layers
        } else {
            return 0; // CPU only
        }
    }

    /**
     * Get optimal GPU layers based on user config and detection
     */
    public async getOptimalGPULayers(userConfig?: number): Promise<number> {
        // If user explicitly set GPU layers, use that
        if (userConfig !== undefined && userConfig !== null) {
            this.logger.info(`Using user-configured GPU layers: ${userConfig}`);
            return userConfig;
        }

        // Otherwise, auto-detect
        const gpuInfo = await this.detectGPU();
        return gpuInfo.optimalLayers;
    }

    /**
     * Clear cached GPU info (for testing)
     */
    public clearCache(): void {
        this.cachedInfo = null;
    }
}
