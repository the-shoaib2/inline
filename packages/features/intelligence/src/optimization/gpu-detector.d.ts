/**
 * GPU capability information for model layer offloading.
 * Used to determine optimal GPU layer count for inference.
 */
export interface GPUInfo {
    available: boolean;
    type: 'metal' | 'cuda' | 'none';
    optimalLayers: number;
    vramEstimate?: number;
}
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
export declare class GPUDetector {
    private logger;
    private cachedInfo;
    constructor();
    /**
     * Detect available GPU and calculate optimal layer offloading.
     * Results are cached for subsequent calls.
     *
     * @returns GPU capability information
     */
    detectGPU(): Promise<GPUInfo>;
    /**
     * Detect Metal GPU support on macOS.
     * Estimates VRAM as 25% of system RAM (conservative estimate).
     * Calculates optimal layer count for model offloading.
     */
    private detectMetal;
    /**
     * Detect CUDA support on Linux/Windows
     */
    private detectCUDA;
    /**
     * Calculate optimal number of layers to offload to GPU
     * Based on available VRAM
     */
    private calculateOptimalLayers;
    /**
     * Get optimal GPU layers based on user config and detection
     */
    getOptimalGPULayers(userConfig?: number): Promise<number>;
    /**
     * Clear cached GPU info (for testing)
     */
    clearCache(): void;
}
//# sourceMappingURL=gpu-detector.d.ts.map