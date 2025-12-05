import * as path from 'path';
import * as fs from 'fs';
import type { LlamaModel, LlamaContext } from 'node-llama-cpp';
import { Logger } from '../utils/logger';

export interface InferenceOptions {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    stop?: string[];
}

export class LlamaInference {
    private model: LlamaModel | null = null;
    private context: LlamaContext | null = null;
    private sequence: any = null;
    private logger: Logger;
    private isLoaded: boolean = false;
    private currentModelPath: string | null = null;

    constructor() {
        this.logger = new Logger('LlamaInference');
    }

    private static _llamaInstance: any = null;

    private async getLlamaInstance(): Promise<any> {
        if (!LlamaInference._llamaInstance) {
             // Dynamic import to avoid ESM/CommonJS conflict and prevent TS from converting to require()
            const dynamicImport = new Function('specifier', 'return import(specifier)');
            const { getLlama } = await dynamicImport('node-llama-cpp');
            LlamaInference._llamaInstance = await getLlama();
        }
        return LlamaInference._llamaInstance;
    }

    public async loadModel(modelPath: string, options: { 
        threads?: number; 
        gpuLayers?: number; 
        contextSize?: number; 
    } = {}): Promise<void> {
        try {
            if (this.currentModelPath === modelPath && this.isLoaded) {
                return;
            }

            if (this.isLoaded) {
                await this.unloadModel();
            }

            this.logger.info(`Loading model from ${modelPath}...`);

            if (!fs.existsSync(modelPath)) {
                throw new Error(`Model file not found: ${modelPath}`);
            }

            const llama = await this.getLlamaInstance();

            this.model = await llama.loadModel({
                modelPath: modelPath,
                useMlock: true, // Keep model in memory to prevent swapping
                gpuLayers: options.gpuLayers, // Enable GPU acceleration if configured
            });

            this.context = await this.model!.createContext({
                contextSize: options.contextSize || 4096,
                threads: options.threads || 4, // Default to 4 threads
                batchSize: 512, // Optimize for batch processing
                sequences: 2, // Allocate 2 sequences to prevent exhaustion
            });

            this.sequence = this.context.getSequence();

            this.isLoaded = true;
            this.currentModelPath = modelPath;
            this.logger.info('Model loaded successfully');
        } catch (error) {
            this.logger.error(`Failed to load model: ${error}`);
            // Detailed error logging
            if (error instanceof Error) {
                 this.logger.error(`Stack trace: ${error.stack}`);
            }
            this.isLoaded = false;
            this.currentModelPath = null;
            throw error;
        }
    }

    public async unloadModel(): Promise<void> {
        if (this.context) {
            await this.context.dispose();
            this.context = null;
        }
        if (this.model) {
            await this.model.dispose();
            this.model = null;
        }
        this.sequence = null;
        this.isLoaded = false;
        this.currentModelPath = null;
        this.logger.info('Model unloaded');
    }

    async generateCompletion(prompt: string, options: InferenceOptions = {}): Promise<string> {
        if (!this.isLoaded || !this.model || !this.context) {
            throw new Error('Model not loaded. Please load a model first.');
        }

        // Simple mutex to prevent concurrent sequence usage
        while ((this as any)._generating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        (this as any)._generating = true;

        let sequence: any = null;

        try {
            const maxTokens = options.maxTokens || 512;
            const temperature = options.temperature || 0.7;
            const stop = options.stop || [];

            this.logger.info('Starting completion generation...');

            // Tokenize the prompt
            const tokens = this.model.tokenize(prompt);
            this.logger.info(`Tokenized prompt: ${tokens.length} tokens`);

            // Always get a fresh sequence for each completion
            // This prevents sequence exhaustion issues
            try {
                this.logger.info('Getting new sequence...');
                sequence = this.context.getSequence();
                this.logger.info('Sequence obtained successfully');
            } catch (error) {
                this.logger.error(`Failed to get sequence: ${error}`);
                throw new Error(`Failed to get sequence. The context may be exhausted. Try reloading the model.`);
            }

            // Evaluate tokens and stream the response
            this.logger.info('Starting token evaluation...');
            const stream = await sequence.evaluate(tokens, {
                temperature,
                topP: options.topP || 0.95,
                topK: options.topK || 40,
                yieldEogToken: false
            });

            let completion = '';
            let tokensGenerated = 0;

            // Stream tokens and build completion
            for await (const token of stream) {
                if (tokensGenerated >= maxTokens) {
                    break;
                }

                const text = this.model.detokenize([token]);
                completion += text;
                tokensGenerated++;

                // Check for stop sequences
                if (stop.length > 0 && stop.some(s => completion.includes(s))) {
                    break;
                }
            }

            this.logger.info(`Completion generated: ${tokensGenerated} tokens`);
            
            // Dispose the sequence after use to free it back to the pool
            if (sequence && typeof sequence.dispose === 'function') {
                try {
                    await sequence.dispose();
                    this.logger.info('Sequence disposed successfully');
                } catch (error) {
                    this.logger.warn(`Failed to dispose sequence: ${error}`);
                }
            }
            
            return completion;
        } catch (error) {
            this.logger.error(`Completion generation failed: ${error}`);
            
            // Try to dispose sequence on error
            if (sequence && typeof sequence.dispose === 'function') {
                try {
                    await sequence.dispose();
                } catch (disposeError) {
                    this.logger.warn(`Failed to dispose sequence after error: ${disposeError}`);
                }
            }
            
            throw error;
        } finally {
            (this as any)._generating = false;
        }
    }

    async generateImprovement(code: string, instruction: string, options: InferenceOptions = {}): Promise<string> {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }

        const prompt = `### Instruction:\n${instruction}\n\n### Input:\n\`\`\`\n${code}\n\`\`\`\n\n### Response:\n`;

        const maxTokens = options.maxTokens || 512;

        return this.generateCompletion(prompt, { ...options, maxTokens, stop: ['### Instruction:', '```\n'] });
    }

    isModelLoaded(): boolean {
        return this.isLoaded && this.model !== null;
    }

    getModelPath(): string | null {
        return this.currentModelPath;
    }

    getModelStatus(): { loaded: boolean; modelPath: string | null } {
        return {
            loaded: this.isLoaded,
            modelPath: this.currentModelPath
        };
    }
}
