export interface GPUInfo {
    available: boolean;
    type: 'metal' | 'cuda' | 'none';
    optimalLayers: number;
    vramEstimate?: number;
}

export interface IGPUDetector {
    detectGPU(): Promise<GPUInfo>;
    getOptimalGPULayers(userConfig?: number): Promise<number>;
}
