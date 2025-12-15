import { Logger } from '@inline/shared';

/**
 * Detects stop conditions during generation
 */
export class StopDetector {
    private logger: Logger;
    private stopSequences: string[];
    private maxTokens: number;
    private maxLines: number;
    private tokensGenerated: number = 0;
    private linesGenerated: number = 0;

    constructor(stopSequences: string[], maxTokens: number, maxLines: number) {
        this.logger = new Logger('StopDetector');
        this.stopSequences = stopSequences;
        this.maxTokens = maxTokens;
        this.maxLines = maxLines;
    }

    /**
     * Reset counters for new generation
     */
    reset(): void {
        this.tokensGenerated = 0;
        this.linesGenerated = 0;
    }

    /**
     * Track a new token
     */
    trackToken(text: string): void {
        this.tokensGenerated++;
        
        // Count newlines
        const newlines = (text.match(/\n/g) || []).length;
        this.linesGenerated += newlines;
    }

    /**
     * Check if max tokens reached
     */
    isMaxTokensReached(): boolean {
        if (this.tokensGenerated >= this.maxTokens) {
            this.logger.info(`Max tokens reached: ${this.maxTokens}`);
            return true;
        }
        return false;
    }

    /**
     * Check if max lines reached
     */
    isMaxLinesReached(): boolean {
        if (this.linesGenerated >= this.maxLines) {
            this.logger.info(`Max lines reached: ${this.maxLines}`);
            return true;
        }
        return false;
    }

    /**
     * Check if stop sequence found
     */
    hasStopSequence(completion: string): boolean {
        for (const seq of this.stopSequences) {
            if (completion.includes(seq)) {
                this.logger.info(`Stop sequence found: ${seq}`);
                return true;
            }
        }
        return false;
    }

    /**
     * Check if metadata is repeating
     */
    isMetadataRepeating(completion: string): boolean {
        if (completion.includes('File:') && completion.split('File:').length > 3) {
            this.logger.warn('Metadata repetition detected');
            return true;
        }
        return false;
    }

    /**
     * Check all stop conditions
     */
    shouldStop(completion: string): boolean {
        return (
            this.isMaxTokensReached() ||
            this.isMaxLinesReached() ||
            this.hasStopSequence(completion) ||
            this.isMetadataRepeating(completion)
        );
    }

    /**
     * Get current statistics
     */
    getStats(): { tokens: number; lines: number } {
        return {
            tokens: this.tokensGenerated,
            lines: this.linesGenerated
        };
    }
}
