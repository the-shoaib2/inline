import { Logger } from '@inline/shared';
import { NativeLoader } from '@inline/shared';

/**
 * Prompt cache entry
 */
interface PromptCacheEntry {
    prompt: string;
    tokens: number[];
    timestamp: number;
    hash: string;
}

/**
 * Prompt cache for faster inference
 * Caches tokenized prompts to avoid re-tokenization
 */
export class PromptCache {
    private logger: Logger;
    private cache: Map<string, PromptCacheEntry> = new Map();
    private maxSize: number;
    private maxAge: number; // milliseconds

    constructor(maxSize: number = 100, maxAge: number = 5 * 60 * 1000) {
        this.logger = new Logger('PromptCache');
        this.maxSize = maxSize;
        this.maxAge = maxAge;
    }

    /**
     * Generate cache key from prompt
     */
    private generateHash(prompt: string): string {
        const native = NativeLoader.getInstance();
        // if (native.isAvailable()) {
        //     return native.hashPrompt(prompt);
        // }

        // Simple hash function (could use crypto for production)
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Get cached tokens for a prompt
     */
    public get(prompt: string): number[] | null {
        const hash = this.generateHash(prompt);
        const entry = this.cache.get(hash);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() - entry.timestamp > this.maxAge) {
            this.cache.delete(hash);
            return null;
        }

        // Verify prompt matches (hash collision check)
        if (entry.prompt !== prompt) {
            return null;
        }

        this.logger.info(`Cache hit for prompt (${prompt.length} chars)`);
        return entry.tokens;
    }

    /**
     * Cache tokenized prompt
     */
    public set(prompt: string, tokens: number[]): void {
        const hash = this.generateHash(prompt);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(hash, {
            prompt,
            tokens,
            timestamp: Date.now(),
            hash
        });

        this.logger.info(`Cached prompt (${prompt.length} chars, ${tokens.length} tokens)`);
    }

    /**
     * Clear cache
     */
    public clear(): void {
        this.cache.clear();
        this.logger.info('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getStats(): {
        size: number;
        maxSize: number;
        hitRate?: number;
    } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }

    /**
     * Clean expired entries
     */
    public cleanExpired(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [hash, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.maxAge) {
                this.cache.delete(hash);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.logger.info(`Cleaned ${cleaned} expired entries`);
        }
    }
}
