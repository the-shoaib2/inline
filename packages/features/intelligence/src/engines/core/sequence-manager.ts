import type { LlamaContext } from 'node-llama-cpp';
import { Logger } from '@inline/shared';

/**
 * Manages llama.cpp sequences and KV cache for efficient inference
 */
export class SequenceManager {
    private logger: Logger;
    private activeSequence: any = null;
    private context: LlamaContext | null = null;
    private generating: boolean = false;

    constructor() {
        this.logger = new Logger('SequenceManager');
    }

    /**
     * Initialize with a context
     */
    setContext(context: LlamaContext): void {
        this.context = context;
        this.activeSequence = null;
    }

    /**
     * Get or create a sequence for inference
     * Reuses the same sequence to benefit from KV cache
     */
    async getSequence(): Promise<any> {
        if (!this.context) {
            throw new Error('Context not initialized');
        }

        // Wait if another generation is in progress
        while (this.generating) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Create sequence if it doesn't exist
        if (!this.activeSequence) {
            this.logger.info('Creating new persistent sequence...');
            this.activeSequence = this.context.getSequence();
        }

        return this.activeSequence;
    }

    /**
     * Mark generation as started
     */
    startGeneration(): void {
        this.generating = true;
    }

    /**
     * Mark generation as completed
     */
    endGeneration(): void {
        this.generating = false;
    }

    /**
     * Check if currently generating
     */
    isGenerating(): boolean {
        return this.generating;
    }

    /**
     * Dispose the active sequence (on error or explicit request)
     */
    async disposeSequence(): Promise<void> {
        if (this.activeSequence) {
            try {
                await this.activeSequence.dispose();
                this.logger.info('Sequence disposed');
            } catch (error) {
                this.logger.warn('Error disposing sequence:', error as Error);
            }
            this.activeSequence = null;
        }
    }

    /**
     * Clear context reference
     */
    clear(): void {
        this.context = null;
        this.activeSequence = null;
        this.generating = false;
    }
}
