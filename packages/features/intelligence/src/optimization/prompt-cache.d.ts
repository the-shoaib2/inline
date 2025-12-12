/**
 * Prompt cache for faster inference
 * Caches tokenized prompts to avoid re-tokenization
 */
export declare class PromptCache {
    private logger;
    private cache;
    private maxSize;
    private maxAge;
    constructor(maxSize?: number, maxAge?: number);
    /**
     * Generate cache key from prompt
     */
    private generateHash;
    /**
     * Get cached tokens for a prompt
     */
    get(prompt: string): number[] | null;
    /**
     * Cache tokenized prompt
     */
    set(prompt: string, tokens: number[]): void;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
    };
    /**
     * Clean expired entries
     */
    cleanExpired(): void;
}
//# sourceMappingURL=prompt-cache.d.ts.map