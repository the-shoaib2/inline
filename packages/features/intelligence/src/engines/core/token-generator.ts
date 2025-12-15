import type { LlamaModel } from 'node-llama-cpp';
import { Logger } from '@inline/shared';
import { InferenceConfig, DEFAULT_ENGINE_CONFIG } from './engine-config';
import * as vscode from 'vscode';

export type TokenCallback = (token: string, totalTokens: number) => void;

/**
 * Handles token generation with streaming support
 */
export class TokenGenerator {
    private logger: Logger;

    constructor() {
        this.logger = new Logger('TokenGenerator');
    }

    /**
     * Generate tokens from a sequence
     */
    async* generateTokens(
        sequence: any,
        tokens: number[],
        model: LlamaModel,
        config: InferenceConfig,
        cancellationToken?: vscode.CancellationToken
    ): AsyncGenerator<string, void, unknown> {
        const temperature = config.temperature || DEFAULT_ENGINE_CONFIG.TEMPERATURE;
        const topP = config.topP || DEFAULT_ENGINE_CONFIG.TOP_P;
        const topK = config.topK || DEFAULT_ENGINE_CONFIG.TOP_K;
        const repeatPenalty = config.repeatPenalty || DEFAULT_ENGINE_CONFIG.REPEAT_PENALTY;
        const maxTokens = config.maxTokens || DEFAULT_ENGINE_CONFIG.MAX_TOKENS;

        this.logger.info('Starting token generation...');

        // Evaluate tokens and stream the response
        const stream = await sequence.evaluate(tokens, {
            temperature,
            topP,
            topK,
            repeatPenalty,
            yieldEogToken: false
        });

        let tokensGenerated = 0;
        let loopIterations = 0;

        for await (const token of stream) {
            loopIterations++;

            if (loopIterations === 1) {
                this.logger.info('First token received from stream');
            }

            // Check for cancellation
            if (cancellationToken?.isCancellationRequested) {
                this.logger.info('Generation cancelled by user');
                break;
            }

            // Check token limit
            if (tokensGenerated >= maxTokens) {
                this.logger.info(`Max tokens reached: ${maxTokens}`);
                break;
            }

            // Detokenize and yield
            const text = model.detokenize([token]);
            tokensGenerated++;
            
            yield text;
        }

        this.logger.info(`Token generation completed. Iterations: ${loopIterations}, Tokens: ${tokensGenerated}`);

        if (tokensGenerated === 0) {
            this.logger.warn('Stream produced NO tokens! Model declined to generate or failed immediately.');
        }
    }

    /**
     * Generate completion with streaming callback
     */
    async generateCompletion(
        sequence: any,
        tokens: number[],
        model: LlamaModel,
        config: InferenceConfig,
        onToken?: TokenCallback,
        cancellationToken?: vscode.CancellationToken
    ): Promise<string> {
        let completion = '';
        let tokensGenerated = 0;

        for await (const text of this.generateTokens(sequence, tokens, model, config, cancellationToken)) {
            completion += text;
            tokensGenerated++;

            // Call streaming callback if provided
            if (onToken) {
                onToken(text, tokensGenerated);
            }
        }

        return completion;
    }
}
