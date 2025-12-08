import * as path from 'path';
import { Logger } from '@platform/system/logger';

export type QuantizationLevel = 'Q4_K' | 'Q5_K' | 'Q6_K' | 'Q8_0' | 'F16' | 'F32' | 'unknown';

export interface QuantizationInfo {
    level: QuantizationLevel;
    bitsPerWeight: number;
    qualityScore: number; // 0-100
    speedScore: number; // 0-100
    memoryMultiplier: number; // Relative to Q4_K
    recommended: boolean;
}

export interface ModelMetrics {
    tokensPerSecond: number;
    memoryUsageMB: number;
    qualityScore: number;
}

export class QuantizationManager {
    private logger: Logger;
    private static readonly QUANTIZATION_PATTERNS: Record<string, QuantizationLevel> = {
        'q4_k': 'Q4_K',
        'q4-k': 'Q4_K',
        'q4k': 'Q4_K',
        'q5_k': 'Q5_K',
        'q5-k': 'Q5_K',
        'q5k': 'Q5_K',
        'q6_k': 'Q6_K',
        'q6-k': 'Q6_K',
        'q6k': 'Q6_K',
        'q8_0': 'Q8_0',
        'q8-0': 'Q8_0',
        'q8': 'Q8_0',
        'f16': 'F16',
        'fp16': 'F16',
        'f32': 'F32',
        'fp32': 'F32'
    };

    private static readonly QUANTIZATION_INFO: Record<QuantizationLevel, Omit<QuantizationInfo, 'level' | 'recommended'>> = {
        'Q4_K': {
            bitsPerWeight: 4.5,
            qualityScore: 75,
            speedScore: 95,
            memoryMultiplier: 1.0
        },
        'Q5_K': {
            bitsPerWeight: 5.5,
            qualityScore: 85,
            speedScore: 85,
            memoryMultiplier: 1.22
        },
        'Q6_K': {
            bitsPerWeight: 6.5,
            qualityScore: 92,
            speedScore: 75,
            memoryMultiplier: 1.44
        },
        'Q8_0': {
            bitsPerWeight: 8.5,
            qualityScore: 97,
            speedScore: 60,
            memoryMultiplier: 1.89
        },
        'F16': {
            bitsPerWeight: 16,
            qualityScore: 99,
            speedScore: 40,
            memoryMultiplier: 3.56
        },
        'F32': {
            bitsPerWeight: 32,
            qualityScore: 100,
            speedScore: 20,
            memoryMultiplier: 7.11
        },
        'unknown': {
            bitsPerWeight: 0,
            qualityScore: 0,
            speedScore: 0,
            memoryMultiplier: 1.0
        }
    };

    constructor() {
        this.logger = new Logger('QuantizationManager');
    }

    /**
     * Detect quantization level from model filename
     */
    public detectQuantization(filename: string): QuantizationLevel {
        const lowerName = filename.toLowerCase();

        for (const [pattern, level] of Object.entries(QuantizationManager.QUANTIZATION_PATTERNS)) {
            if (lowerName.includes(pattern)) {
                this.logger.info(`Detected quantization: ${level} from filename: ${filename}`);
                return level;
            }
        }

        this.logger.warn(`Could not detect quantization level from filename: ${filename}`);
        return 'unknown';
    }

    /**
     * Get detailed information about a quantization level
     */
    public getQuantizationInfo(level: QuantizationLevel, systemRAM?: number): QuantizationInfo {
        const baseInfo = QuantizationManager.QUANTIZATION_INFO[level];
        
        // Determine if this quantization is recommended based on system resources
        let recommended = false;
        if (systemRAM) {
            const ramGB = systemRAM / 1024;
            if (ramGB >= 16) {
                recommended = level === 'Q6_K' || level === 'Q5_K';
            } else if (ramGB >= 8) {
                recommended = level === 'Q5_K' || level === 'Q4_K';
            } else {
                recommended = level === 'Q4_K';
            }
        }

        return {
            level,
            ...baseInfo,
            recommended
        };
    }

    /**
     * Recommend optimal quantization level based on system resources
     */
    public recommendQuantization(options: {
        availableRAM: number; // MB
        availableVRAM?: number; // MB
        priority: 'speed' | 'quality' | 'balanced';
    }): QuantizationLevel {
        const ramGB = options.availableRAM / 1024;
        const vramGB = options.availableVRAM ? options.availableVRAM / 1024 : 0;

        // If GPU available with sufficient VRAM
        if (vramGB >= 6) {
            switch (options.priority) {
                case 'speed':
                    return 'Q4_K';
                case 'quality':
                    return ramGB >= 16 ? 'Q6_K' : 'Q5_K';
                case 'balanced':
                    return 'Q5_K';
            }
        }

        // CPU-only recommendations
        if (ramGB >= 16) {
            switch (options.priority) {
                case 'speed':
                    return 'Q4_K';
                case 'quality':
                    return 'Q6_K';
                case 'balanced':
                    return 'Q5_K';
            }
        } else if (ramGB >= 8) {
            switch (options.priority) {
                case 'speed':
                    return 'Q4_K';
                case 'quality':
                    return 'Q5_K';
                case 'balanced':
                    return 'Q5_K';
            }
        } else {
            // Low RAM systems
            return 'Q4_K';
        }

        return 'Q4_K'; // Safe default
    }

    /**
     * Estimate model size based on parameters and quantization
     */
    public estimateModelSize(parameters: number, quantization: QuantizationLevel): number {
        const baseInfo = QuantizationManager.QUANTIZATION_INFO[quantization];
        
        // Base calculation: parameters * bits per weight / 8 (to get bytes)
        const bytesPerParameter = baseInfo.bitsPerWeight / 8;
        const sizeBytes = parameters * bytesPerParameter;
        
        // Add overhead for metadata, embeddings, etc. (approximately 10%)
        const totalBytes = sizeBytes * 1.1;
        
        return Math.round(totalBytes / (1024 * 1024)); // Convert to MB
    }

    /**
     * Parse parameter count from model name
     */
    public parseParameterCount(modelName: string): number | null {
        const patterns = [
            /(\d+\.?\d*)b/i,  // 7b, 13b, 6.7b
            /(\d+)m/i,        // 350m, 1.3b
            /(\d+)k/i         // 125k (rare)
        ];

        for (const pattern of patterns) {
            const match = modelName.match(pattern);
            if (match) {
                const value = parseFloat(match[1]);
                
                if (modelName.toLowerCase().includes('b')) {
                    return value * 1_000_000_000; // Billions
                } else if (modelName.toLowerCase().includes('m')) {
                    return value * 1_000_000; // Millions
                } else if (modelName.toLowerCase().includes('k')) {
                    return value * 1_000; // Thousands
                }
            }
        }

        return null;
    }

    /**
     * Get optimization settings for a specific quantization level
     */
    public getOptimizationSettings(level: QuantizationLevel): {
        contextSize: number;
        batchSize: number;
        threads: number;
        useMlock: boolean;
    } {
        switch (level) {
            case 'Q4_K':
                return {
                    contextSize: 4096,
                    batchSize: 512,
                    threads: 4,
                    useMlock: false
                };
            case 'Q5_K':
                return {
                    contextSize: 4096,
                    batchSize: 512,
                    threads: 4,
                    useMlock: false
                };
            case 'Q6_K':
                return {
                    contextSize: 4096,
                    batchSize: 256,
                    threads: 6,
                    useMlock: false
                };
            case 'Q8_0':
            case 'F16':
            case 'F32':
                return {
                    contextSize: 2048,
                    batchSize: 128,
                    threads: 8,
                    useMlock: false // Too large for mlock
                };
            default:
                return {
                    contextSize: 2048,
                    batchSize: 256,
                    threads: 4,
                    useMlock: false
                };
        }
    }

    /**
     * Compare two quantization levels
     */
    public compare(level1: QuantizationLevel, level2: QuantizationLevel): {
        qualityDiff: number;
        speedDiff: number;
        memoryDiff: number;
        recommendation: string;
    } {
        const info1 = QuantizationManager.QUANTIZATION_INFO[level1];
        const info2 = QuantizationManager.QUANTIZATION_INFO[level2];

        const qualityDiff = info1.qualityScore - info2.qualityScore;
        const speedDiff = info1.speedScore - info2.speedScore;
        const memoryDiff = info1.memoryMultiplier - info2.memoryMultiplier;

        let recommendation = '';
        if (qualityDiff > 10 && speedDiff < -10) {
            recommendation = `${level1} offers better quality but is slower`;
        } else if (speedDiff > 10 && qualityDiff < -10) {
            recommendation = `${level1} is faster but lower quality`;
        } else if (Math.abs(qualityDiff) < 5 && Math.abs(speedDiff) < 5) {
            recommendation = 'Both levels are similar in performance';
        } else {
            recommendation = `${level1} is recommended for balanced performance`;
        }

        return {
            qualityDiff,
            speedDiff,
            memoryDiff,
            recommendation
        };
    }

    /**
     * Benchmark and suggest optimal settings
     */
    public async benchmarkQuantization(
        modelPath: string,
        availableRAM: number
    ): Promise<{
        detected: QuantizationLevel;
        recommended: QuantizationLevel;
        settings: {
            contextSize: number;
            batchSize: number;
            threads: number;
            useMlock: boolean;
        };
    }> {
        const filename = path.basename(modelPath);
        const detected = this.detectQuantization(filename);
        const recommended = this.recommendQuantization({
            availableRAM,
            priority: 'balanced'
        });

        const settings = this.getOptimizationSettings(detected !== 'unknown' ? detected : recommended);

        this.logger.info(`Benchmark results - Detected: ${detected}, Recommended: ${recommended}`);

        return {
            detected,
            recommended,
            settings
        };
    }
}
