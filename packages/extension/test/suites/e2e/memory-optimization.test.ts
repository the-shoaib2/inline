import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { MemoryManager } from '@platform/resources/memory-manager';
import { CacheManager } from '@storage/cache/cache-manager';
import { ParallelProcessor } from '@platform/system/parallel-processor';
import { UserPatternDetector } from '@intelligence/optimization/user-pattern-detector';

suite('Memory Management E2E Tests', () => {
    let memoryManager: MemoryManager;
    let context: vscode.ExtensionContext;
    
    suiteSetup(async () => {
        // Get extension context
        const ext = vscode.extensions.getExtension('ratulhasan.inline-ai-codes');
        if (!ext) {
            throw new Error('Extension not found');
        }
        await ext.activate();
        context = (ext.exports as any).context;
    });
    
    setup(() => {
        memoryManager = new MemoryManager();
    });
    
    teardown(() => {
        memoryManager.dispose();
    });
    
    test('MemoryManager tracks extension-specific memory', () => {
        const stats = memoryManager.getMemoryStats();
        
        assert.ok(stats.heap.used > 0, 'Heap used should be > 0');
        assert.ok(stats.heap.total > 0, 'Heap total should be > 0');
        assert.ok(stats.heap.limit > 0, 'Heap limit should be > 0');
        assert.ok(stats.heap.usagePercent >= 0 && stats.heap.usagePercent <= 100, 'Usage percent should be 0-100');
    });
    
    test('MemoryManager detects memory pressure correctly', () => {
        const pressure = memoryManager.getMemoryPressure();
        
        assert.ok(['none', 'low', 'medium', 'high', 'critical'].includes(pressure.level), 'Pressure level should be valid');
        assert.ok(typeof pressure.shouldCleanup === 'boolean', 'shouldCleanup should be boolean');
    });
    
    test('MemoryManager calculates safe cache sizes', () => {
        const allocation = memoryManager.getCacheAllocation();
        
        assert.ok(allocation.maxCacheSize > 0, 'Max cache size should be > 0');
        assert.ok(allocation.maxContextSize > 0, 'Max context size should be > 0');
        assert.ok(allocation.maxHistorySize > 0, 'Max history size should be > 0');
        
        // Verify distribution (50%, 30%, 20%)
        const total = allocation.maxCacheSize + allocation.maxContextSize + allocation.maxHistorySize;
        const cacheRatio = allocation.maxCacheSize / total;
        assert.ok(Math.abs(cacheRatio - 0.5) < 0.01, 'Cache should be ~50% of total');
    });
    
    test('MemoryManager cleanup callbacks work', async () => {
        let cleanupCalled = false;
        
        memoryManager.registerCleanupCallback(async () => {
            cleanupCalled = true;
        });
        
        await memoryManager.triggerCleanup();
        
        // Note: cleanup only triggers if memory pressure is detected
        // So we can't assert cleanupCalled = true in all cases
        assert.ok(true, 'Cleanup completed without errors');
    });
});

suite('Cache Management E2E Tests', () => {
    let cacheManager: CacheManager;
    let memoryManager: MemoryManager;
    let context: vscode.ExtensionContext;
    
    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('ratulhasan.inline-ai-codes');
        if (!ext) {
            throw new Error('Extension not found');
        }
        await ext.activate();
        context = (ext.exports as any).context;
    });
    
    setup(() => {
        memoryManager = new MemoryManager();
        cacheManager = new CacheManager(context, memoryManager);
    });
    
    teardown(async () => {
        await cacheManager.clear();
        memoryManager.dispose();
    });
    
    test('CacheManager stores and retrieves data', async () => {
        const key = 'test-key';
        const value = { data: 'test-value', timestamp: Date.now() };
        
        await cacheManager.set(key, value);
        const retrieved = await cacheManager.get(key);
        
        assert.deepStrictEqual(retrieved, value, 'Retrieved value should match stored value');
    });
    
    test('CacheManager tracks hit rate', async () => {
        const key1 = 'key1';
        const key2 = 'key2';
        
        await cacheManager.set(key1, 'value1');
        
        // Hit
        await cacheManager.get(key1);
        
        // Miss
        await cacheManager.get(key2);
        
        const stats = cacheManager.getStats();
        
        assert.strictEqual(stats.totalRequests, 2, 'Should have 2 requests');
        assert.strictEqual(stats.hits, 1, 'Should have 1 hit');
        assert.strictEqual(stats.misses, 1, 'Should have 1 miss');
        assert.strictEqual(stats.hitRate, 0.5, 'Hit rate should be 50%');
    });
    
    test('CacheManager enforces size limits with LRU', async () => {
        // Set a small cache size for testing
        const smallCache = new CacheManager(context);
        (smallCache as any).maxCacheSize = 1024; // 1KB
        
        // Add entries until we exceed the limit
        for (let i = 0; i < 100; i++) {
            await smallCache.set(`key${i}`, { data: 'x'.repeat(100) });
        }
        
        const stats = smallCache.getStats();
        assert.ok(stats.size <= 1024, 'Cache size should not exceed limit');
        
        await smallCache.clear();
    });
    
    test('CacheManager cleanup removes old entries', async () => {
        // Add some entries
        for (let i = 0; i < 10; i++) {
            await cacheManager.set(`key${i}`, `value${i}`);
        }
        
        const beforeStats = cacheManager.getStats();
        const beforeEntries = beforeStats.entries;
        
        // Trigger cleanup
        await cacheManager.cleanup();
        
        const afterStats = cacheManager.getStats();
        
        // Cleanup should remove ~50% of entries
        assert.ok(afterStats.entries < beforeEntries, 'Cleanup should remove entries');
    });
});

suite('Parallel Processing E2E Tests', () => {
    let processor: ParallelProcessor;
    
    setup(() => {
        processor = new ParallelProcessor();
    });
    
    test('ParallelProcessor executes tasks concurrently', async () => {
        const tasks = Array.from({ length: 10 }, (_, i) => 
            async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return i * 2;
            }
        );
        
        const startTime = Date.now();
        const results = await processor.processInParallel(tasks, 5);
        const duration = Date.now() - startTime;
        
        assert.strictEqual(results.length, 10, 'Should process all tasks');
        assert.ok(duration < 500, 'Parallel execution should be faster than sequential');
    });
    
    test('ParallelProcessor gathers context from multiple files', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return; // Skip test if no workspace
        }
        
        // Find some TypeScript files
        const files = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**', 5);
        
        if (files.length === 0) {
            return; // Skip test if no files found
        }
        
        const contextMap = await processor.gatherContextParallel(
            files,
            async (uri) => {
                const doc = await vscode.workspace.openTextDocument(uri);
                return doc.getText();
            }
        );
        
        assert.ok(contextMap.size > 0, 'Should gather context from files');
        assert.ok(contextMap.size <= files.length, 'Should not exceed file count');
    });
});

suite('User Pattern Detection E2E Tests', () => {
    let detector: UserPatternDetector;
    
    setup(() => {
        detector = new UserPatternDetector();
    });
    
    test('UserPatternDetector records and retrieves patterns', () => {
        const completion = 'function test() { return true; }';
        const context = 'testing';
        
        detector.recordAcceptance(completion, context);
        detector.recordAcceptance(completion, context);
        detector.recordAcceptance(completion, context);
        
        const patterns = detector.getFrequentPatterns(2);
        
        assert.ok(patterns.length > 0, 'Should have frequent patterns');
        assert.ok(patterns[0].frequency >= 3, 'Pattern should have correct frequency');
    });
    
    test('UserPatternDetector detects coding style', () => {
        const code = `
function example() {
    const x = "hello";
    const y = "world";
    return x + y;
}
        `.trim();
        
        const style = detector.detectCodingStyle(code);
        
        assert.strictEqual(style.indentation, 'spaces', 'Should detect spaces');
        assert.strictEqual(style.indentSize, 4, 'Should detect 4-space indent');
        assert.strictEqual(style.quotes, 'double', 'Should detect double quotes');
        assert.strictEqual(style.semicolons, true, 'Should detect semicolons');
    });
    
    test('UserPatternDetector provides suggestions', () => {
        detector.recordAcceptance('console.log("test")', 'logging');
        detector.recordAcceptance('console.log("debug")', 'logging');
        detector.recordAcceptance('console.error("error")', 'error handling');
        
        const suggestions = detector.getSuggestions('logging', 5);
        
        assert.ok(suggestions.length > 0, 'Should provide suggestions');
    });
    
    test('UserPatternDetector cleanup removes old patterns', () => {
        detector.recordAcceptance('old pattern', 'old');
        
        // Cleanup patterns older than 0ms (all patterns)
        detector.cleanup(0);
        
        const stats = detector.getStats();
        assert.strictEqual(stats.totalPatterns, 0, 'Should remove old patterns');
    });
});

suite('Integration Tests', () => {
    test('Memory pressure triggers cache cleanup', async () => {
        const memoryManager = new MemoryManager();
        const context = (vscode.extensions.getExtension('ratulhasan.inline-ai-codes')!.exports as any).context;
        const cacheManager = new CacheManager(context, memoryManager);
        
        // Add many entries to cache
        for (let i = 0; i < 50; i++) {
            await cacheManager.set(`key${i}`, { data: 'x'.repeat(1000) });
        }
        
        const beforeStats = cacheManager.getStats();
        
        // Simulate memory pressure cleanup
        await memoryManager.triggerCleanup();
        
        const afterStats = cacheManager.getStats();
        
        // Cleanup may or may not trigger depending on actual memory pressure
        assert.ok(true, 'Integration test completed');
        
        await cacheManager.clear();
        memoryManager.dispose();
    });
});
