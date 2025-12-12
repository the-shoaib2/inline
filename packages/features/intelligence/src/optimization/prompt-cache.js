"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptCache = void 0;
const shared_1 = require("@inline/shared");
const shared_2 = require("@inline/shared");
/**
 * Prompt cache for faster inference
 * Caches tokenized prompts to avoid re-tokenization
 */
class PromptCache {
    constructor(maxSize = 100, maxAge = 5 * 60 * 1000) {
        this.cache = new Map();
        this.logger = new shared_1.Logger('PromptCache');
        this.maxSize = maxSize;
        this.maxAge = maxAge;
    }
    /**
     * Generate cache key from prompt
     */
    generateHash(prompt) {
        const native = shared_2.NativeLoader.getInstance();
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
    get(prompt) {
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
    set(prompt, tokens) {
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
    clear() {
        this.cache.clear();
        this.logger.info('Cache cleared');
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
    /**
     * Clean expired entries
     */
    cleanExpired() {
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
exports.PromptCache = PromptCache;
//# sourceMappingURL=prompt-cache.js.map