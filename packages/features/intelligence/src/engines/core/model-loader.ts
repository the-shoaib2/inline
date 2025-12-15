import * as fs from 'fs';
import type { LlamaModel, LlamaContext } from 'node-llama-cpp';
import { Logger } from '@inline/shared';
import { GPUDetector } from '../../optimization/gpu-detector';
import { EngineConfig, ConfigValidator, DEFAULT_ENGINE_CONFIG } from './engine-config';
import * as os from 'os';

/**
 * Handles loading and initialization of GGUF models
 */
export class ModelLoader {
    private logger: Logger;
    private gpuDetector: GPUDetector;
    private static llamaInstance: any = null;

    constructor() {
        this.logger = new Logger('ModelLoader');
        this.gpuDetector = new GPUDetector();
    }

    /**
     * Get or initialize the llama.cpp instance
     */
    private async getLlamaInstance(): Promise<any> {
        if (!ModelLoader.llamaInstance) {
            try {
                this.logger.info('Initializing node-llama-cpp...');
                const dynamicImport = new Function('specifier', 'return import(specifier)');
                const { getLlama } = await dynamicImport('node-llama-cpp');
                this.logger.info('node-llama-cpp imported successfully');
                ModelLoader.llamaInstance = await getLlama();
                this.logger.info('Llama instance created successfully');
            } catch (error) {
                this.logger.error('Failed to initialize node-llama-cpp:', error as Error);
                throw new Error(`Failed to initialize node-llama-cpp: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return ModelLoader.llamaInstance;
    }

    /**
     * Validate model file exists and is readable
     */
    private validateModelFile(modelPath: string): void {
        if (!fs.existsSync(modelPath)) {
            throw new Error(`Model file not found: ${modelPath}`);
        }

        try {
            const stats = fs.statSync(modelPath);
            this.logger.info(`Model file size: ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
            
            if (stats.size < 1024 * 1024) {
                throw new Error(`Model file too small (${stats.size} bytes), possibly corrupted`);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('too small')) {
                throw error;
            }
            throw new Error(`Cannot read model file: ${error}`);
        }
    }

    /**
     * Load a GGUF model with the specified configuration
     */
    async loadModel(config: EngineConfig): Promise<{ model: LlamaModel; context: LlamaContext }> {
        try {
            // Validate configuration
            ConfigValidator.validateEngineConfig(config);
            
            this.logger.info(`Loading model from ${config.modelPath}...`);

            // Validate model file
            this.validateModelFile(config.modelPath);

            // Auto-detect optimal GPU layers if not specified
            const gpuLayers = await this.gpuDetector.getOptimalGPULayers(config.gpuLayers);
            this.logger.info(`Using GPU layers: ${gpuLayers}`);

            // Get llama instance
            const llama = await this.getLlamaInstance();

            // Load model
            this.logger.info('Loading model into memory...');
            const model = await llama.loadModel({
                modelPath: config.modelPath,
                useMlock: false,
                useMmap: true,
                gpuLayers: gpuLayers
            });
            this.logger.info('Model loaded into memory');

            // Create context
            this.logger.info('Creating inference context...');
            
            // Dynamic thread optimization
            const systemThreads = Math.max(4, os.cpus().length - 2);
            const optimizedThreads = config.threads || systemThreads;

            const context = await model.createContext({
                contextSize: config.contextSize || DEFAULT_ENGINE_CONFIG.CONTEXT_SIZE,
                threads: optimizedThreads,
                batchSize: config.batchSize || DEFAULT_ENGINE_CONFIG.BATCH_SIZE,
                sequences: config.sequences || DEFAULT_ENGINE_CONFIG.SEQUENCES
            });
            this.logger.info('Context created successfully');

            this.logger.info(`✅ Model loaded successfully: ${config.modelPath}`);
            
            return { model, context };
        } catch (error) {
            this.logger.error('❌ Failed to load model:', error as Error);

            // Provide helpful error messages
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;

                // Check for common issues
                if (errorMessage.includes('Cannot find module')) {
                    errorMessage = 'node-llama-cpp not installed. Run: pnpm install';
                } else if (errorMessage.includes('not found')) {
                    errorMessage = `Model file not found at: ${config.modelPath}`;
                } else if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
                    errorMessage = `Permission denied reading model file: ${config.modelPath}`;
                } else if (errorMessage.includes('corrupted') || errorMessage.includes('invalid')) {
                    errorMessage = 'Model file appears to be corrupted. Try re-downloading.';
                }
            }

            throw new Error(errorMessage);
        }
    }

    /**
     * Unload model and context
     */
    async unloadModel(model: LlamaModel | null, context: LlamaContext | null): Promise<void> {
        if (context) {
            await context.dispose();
        }
        if (model) {
            await model.dispose();
        }
        this.logger.info('Model unloaded');
    }
}
