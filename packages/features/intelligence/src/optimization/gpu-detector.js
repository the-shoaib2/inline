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
exports.GPUDetector = void 0;
const os = __importStar(require("os"));
const shared_1 = require("@inline/shared");
/**
 * Detects GPU availability and capabilities across platforms.
 *
 * Supports:
 * - Metal (macOS)
 * - CUDA (Linux/Windows with NVIDIA)
 * - CPU fallback
 *
 * Caches detection results to avoid repeated system calls.
 */
class GPUDetector {
    constructor() {
        this.cachedInfo = null;
        this.logger = new shared_1.Logger('GPUDetector');
    }
    /**
     * Detect available GPU and calculate optimal layer offloading.
     * Results are cached for subsequent calls.
     *
     * @returns GPU capability information
     */
    async detectGPU() {
        if (this.cachedInfo) {
            return this.cachedInfo;
        }
        this.logger.info('Detecting GPU configuration...');
        const platform = os.platform();
        let gpuInfo;
        if (platform === 'darwin') {
            // macOS - Metal acceleration available on modern hardware
            gpuInfo = await this.detectMetal();
        }
        else if (platform === 'linux' || platform === 'win32') {
            // Linux/Windows - NVIDIA CUDA support
            gpuInfo = await this.detectCUDA();
        }
        else {
            // Unsupported platform - fallback to CPU
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
     * Detect Metal GPU support on macOS.
     * Estimates VRAM as 25% of system RAM (conservative estimate).
     * Calculates optimal layer count for model offloading.
     */
    async detectMetal() {
        try {
            // Metal is available on all modern macOS systems (2012+)
            const totalMemory = os.totalmem();
            // Conservative VRAM estimate: 25% of system RAM
            const vramEstimate = Math.floor(totalMemory * 0.25 / (1024 * 1024 * 1024));
            // Calculate layers based on VRAM (each layer ~50-100MB for typical models)
            const optimalLayers = this.calculateOptimalLayers(vramEstimate);
            return {
                available: true,
                type: 'metal',
                optimalLayers,
                vramEstimate
            };
        }
        catch (error) {
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
    async detectCUDA() {
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
            }
            catch {
                // nvidia-smi not found or failed
                return {
                    available: false,
                    type: 'none',
                    optimalLayers: 0
                };
            }
        }
        catch (error) {
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
    calculateOptimalLayers(vramGB) {
        // Conservative estimates for Qwen2.5-Coder-1.5B
        // Each layer ~50-100MB, model has ~24-28 layers
        if (vramGB >= 8) {
            return 28; // Full offload
        }
        else if (vramGB >= 6) {
            return 24; // Most layers
        }
        else if (vramGB >= 4) {
            return 16; // Half layers
        }
        else if (vramGB >= 2) {
            return 8; // Quarter layers
        }
        else {
            return 0; // CPU only
        }
    }
    /**
     * Get optimal GPU layers based on user config and detection
     */
    async getOptimalGPULayers(userConfig) {
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
    clearCache() {
        this.cachedInfo = null;
    }
}
exports.GPUDetector = GPUDetector;
//# sourceMappingURL=gpu-detector.js.map