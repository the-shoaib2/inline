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

    public async loadModel(modelPath: string): Promise<void> {
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
            });

            this.context = await this.model!.createContext({
                contextSize: 4096,
                threads: 4,
                batchSize: 512, // Optimize for batch processing
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

    public async generateCompletion(prompt: string, options: InferenceOptions = {}): Promise<string> {
        if (!this.isLoaded || !this.sequence || !this.model) {
            throw new Error('Model not loaded');
        }

        try {
            const maxTokens = options.maxTokens || 128;
            const temperature = options.temperature || 0.1;
            const stop = options.stop || ['<|endoftext|>', '\n\n'];

            const tokens = this.model.tokenize(prompt);
            let completion = '';
            let tokensGenerated = 0;

            const stream = await this.sequence.evaluate(tokens, {
                temperature,
                topP: options.topP || 0.95,
                topK: options.topK || 40,
                yieldEogToken: false
            });

            for await (const token of stream) {
                if (tokensGenerated >= maxTokens) {
                    break;
                }

                const text = this.model.detokenize([token]);
                completion += text;
                tokensGenerated++;

                if (stop.some(s => completion.includes(s))) {
                    break;
                }
            }

            return completion;
        } catch (error) {
            this.logger.error(`Inference error: ${error}`);
            throw error;
        }
    }

    public isModelLoaded(): boolean {
        return this.isLoaded;
    }

    public getModelPath(): string | null {
        return this.currentModelPath;
    }
}
