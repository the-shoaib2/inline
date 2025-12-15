import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheManager } from '../../../src/optimization/cache-manager';

describe('CacheManager', () => {
    let cache: CacheManager<string>;

    beforeEach(() => {
        cache = new CacheManager('test', 3, 1000, 'lru');
    });

    describe('basic operations', () => {
        it('should set and get values', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return null for missing keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        it('should check if key exists', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
        });

        it('should delete keys', () => {
            cache.set('key1', 'value1');
            expect(cache.delete('key1')).toBe(true);
            expect(cache.get('key1')).toBeNull();
        });

        it('should clear cache', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();
            expect(cache.size()).toBe(0);
        });
    });

    describe('eviction strategies', () => {
        it('should evict LRU entry when full', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            
            // Access key1 to make it recently used
            cache.get('key1');
            
            // Add key4, should evict key2 (least recently used)
            cache.set('key4', 'value4');
            
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('key2')).toBe(false);
            expect(cache.has('key3')).toBe(true);
            expect(cache.has('key4')).toBe(true);
        });

        it('should evict LFU entry when using LFU strategy', () => {
            const lfuCache = new CacheManager<string>('test-lfu', 3, 10000, 'lfu');
            
            lfuCache.set('key1', 'value1');
            lfuCache.set('key2', 'value2');
            lfuCache.set('key3', 'value3');
            
            // Access key1 multiple times
            lfuCache.get('key1');
            lfuCache.get('key1');
            lfuCache.get('key2');
            
            // Add key4, should evict key3 (least frequently used)
            lfuCache.set('key4', 'value4');
            
            expect(lfuCache.has('key1')).toBe(true);
            expect(lfuCache.has('key2')).toBe(true);
            expect(lfuCache.has('key3')).toBe(false);
            expect(lfuCache.has('key4')).toBe(true);
        });

        it('should evict FIFO entry when using FIFO strategy', () => {
            const fifoCache = new CacheManager<string>('test-fifo', 3, 10000, 'fifo');
            
            fifoCache.set('key1', 'value1');
            fifoCache.set('key2', 'value2');
            fifoCache.set('key3', 'value3');
            
            // Add key4, should evict key1 (first in)
            fifoCache.set('key4', 'value4');
            
            expect(fifoCache.has('key1')).toBe(false);
            expect(fifoCache.has('key2')).toBe(true);
            expect(fifoCache.has('key3')).toBe(true);
            expect(fifoCache.has('key4')).toBe(true);
        });
    });

    describe('expiration', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should expire old entries', () => {
            const shortCache = new CacheManager<string>('test-expire', 10, 100);
            shortCache.set('key1', 'value1');
            
            // Advance time to trigger expiration
            vi.advanceTimersByTime(150);
            
            expect(shortCache.get('key1')).toBeNull();
        });

        it('should clean expired entries', () => {
            const shortCache = new CacheManager<string>('test-clean', 10, 100);
            shortCache.set('key1', 'value1');
            shortCache.set('key2', 'value2');
            
            vi.advanceTimersByTime(150);
            
            const cleaned = shortCache.cleanExpired();
            expect(cleaned).toBe(2);
            expect(shortCache.size()).toBe(0);
        });
    });

    describe('statistics', () => {
        it('should track hits and misses', () => {
            cache.set('key1', 'value1');
            
            cache.get('key1'); // hit
            cache.get('key2'); // miss
            cache.get('key1'); // hit
            
            const stats = cache.getStats();
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
            expect(stats.hitRate).toBeCloseTo(0.67, 2);
        });

        it('should track evictions', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            cache.set('key4', 'value4'); // triggers eviction
            
            const stats = cache.getStats();
            expect(stats.evictions).toBe(1);
        });

        it('should report cache size', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            const stats = cache.getStats();
            expect(stats.size).toBe(2);
            expect(stats.maxSize).toBe(3);
        });
    });

    describe('keys and size', () => {
        it('should return all keys', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            
            const keys = cache.keys();
            expect(keys).toHaveLength(2);
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
        });

        it('should return correct size', () => {
            expect(cache.size()).toBe(0);
            cache.set('key1', 'value1');
            expect(cache.size()).toBe(1);
            cache.set('key2', 'value2');
            expect(cache.size()).toBe(2);
        });
    });
});
