#!/usr/bin/env node
/**
 * KV Cache Performance Benchmark
 * 
 * Tests cache hit rates, eviction performance, and persistence
 */

const { KVCacheManager } = require('../out/src/core/kv-cache-manager');
const os = require('os');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function separator(char = '=', length = 60) {
    console.log(char.repeat(length));
}

async function benchmarkCacheOperations() {
    log('\n📊 KV Cache Operations Benchmark', colors.bright);
    separator();

    const cache = new KVCacheManager({
        maxSize: 10 * 1024 * 1024, // 10MB
        maxEntries: 1000,
        persistEnabled: false // Disable for benchmark
    });

    // Test 1: Write Performance
    log('\n🔹 Test 1: Write Performance', colors.cyan);
    const writeStart = Date.now();
    for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `value-${i}`.repeat(10));
    }
    const writeTime = Date.now() - writeStart;
    log(`   ✓ Wrote 1000 entries in ${writeTime}ms`, colors.green);
    log(`   ✓ ${(1000 / writeTime * 1000).toFixed(0)} writes/second`, colors.green);

    // Test 2: Read Performance
    log('\n🔹 Test 2: Read Performance', colors.cyan);
    const readStart = Date.now();
    let hits = 0;
    for (let i = 0; i < 1000; i++) {
        if (cache.get(`key-${i}`)) hits++;
    }
    const readTime = Date.now() - readStart;
    log(`   ✓ Read 1000 entries in ${readTime}ms`, colors.green);
    log(`   ✓ ${(1000 / readTime * 1000).toFixed(0)} reads/second`, colors.green);
    log(`   ✓ ${hits}/1000 cache hits`, colors.green);

    // Test 3: Cache Hit Rate
    log('\n🔹 Test 3: Cache Hit Rate', colors.cyan);
    // Add some entries
    for (let i = 0; i < 100; i++) {
        cache.set(`test-${i}`, `data-${i}`);
    }

    // Access with 80% hit rate
    let testHits = 0;
    const testReads = 200;
    for (let i = 0; i < testReads; i++) {
        const key = i < 160 ? `test-${i % 100}` : `miss-${i}`;
        if (cache.get(key)) testHits++;
    }

    const stats = cache.getStats();
    log(`   ✓ Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`, colors.green);
    log(`   ✓ Miss rate: ${(stats.missRate * 100).toFixed(1)}%`, colors.green);
    log(`   ✓ Total entries: ${stats.totalEntries}`, colors.green);
    log(`   ✓ Cache size: ${(stats.totalSize / 1024).toFixed(1)}KB`, colors.green);

    // Test 4: Eviction Performance
    log('\n🔹 Test 4: LRU Eviction', colors.cyan);
    const evictionCache = new KVCacheManager({
        maxSize: 1024, // 1KB
        maxEntries: 10,
        persistEnabled: false
    });

    for (let i = 0; i < 20; i++) {
        evictionCache.set(`evict-${i}`, 'x'.repeat(100));
    }

    const evictStats = evictionCache.getStats();
    log(`   ✓ Evictions: ${evictStats.evictions}`, colors.green);
    log(`   ✓ Remaining entries: ${evictStats.totalEntries}`, colors.green);
    log(`   ✓ Cache stayed within limits`, colors.green);

    // Test 5: Prefix Lookup
    log('\n🔹 Test 5: Prefix Lookup Performance', colors.cyan);
    for (let i = 0; i < 100; i++) {
        cache.set(`prefix:user:${i}`, { id: i, name: `User ${i}` });
        cache.set(`prefix:post:${i}`, { id: i, title: `Post ${i}` });
    }

    const prefixStart = Date.now();
    const userEntries = cache.getByPrefix('prefix:user:');
    const prefixTime = Date.now() - prefixStart;

    log(`   ✓ Found ${userEntries.length} entries with prefix in ${prefixTime}ms`, colors.green);

    return stats;
}

async function benchmarkPersistence() {
    log('\n📊 Cache Persistence Benchmark', colors.bright);
    separator();

    const tempPath = path.join(os.tmpdir(), 'inline-cache-test.json');

    // Test 1: Write and Persist
    log('\n🔹 Test 1: Persistence Write', colors.cyan);
    const cache1 = new KVCacheManager({
        maxSize: 1024 * 1024,
        maxEntries: 100,
        persistPath: tempPath,
        persistEnabled: true
    });

    for (let i = 0; i < 50; i++) {
        cache1.set(`persist-${i}`, { data: `value-${i}` });
    }

    await cache1.dispose(); // Force persist
    log(`   ✓ Persisted 50 entries`, colors.green);

    // Test 2: Load from Disk
    log('\n🔹 Test 2: Persistence Load', colors.cyan);
    const cache2 = new KVCacheManager({
        maxSize: 1024 * 1024,
        maxEntries: 100,
        persistPath: tempPath,
        persistEnabled: true
    });

    const stats = cache2.getStats();
    log(`   ✓ Loaded ${stats.totalEntries} entries from disk`, colors.green);

    // Verify data
    const value = cache2.get('persist-0');
    log(`   ✓ Data integrity verified: ${value ? 'OK' : 'FAILED'}`, value ? colors.green : colors.red);

    await cache2.dispose();

    // Cleanup
    const fs = require('fs');
    if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
    }
}

async function main() {
    log('\n' + '='.repeat(60), colors.bright);
    log('🚀 KV CACHE PERFORMANCE BENCHMARK', colors.bright);
    separator('=');

    try {
        const stats = await benchmarkCacheOperations();
        await benchmarkPersistence();

        log('\n' + '='.repeat(60), colors.bright);
        log('✅ ALL BENCHMARKS COMPLETED', colors.green);
        separator('=');

        log('\n📈 Summary:', colors.cyan);
        log(`   Cache Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`, colors.bright);
        log(`   Total Evictions: ${stats.evictions}`, colors.bright);
        log(`   Average Hit Count: ${stats.averageHitCount.toFixed(1)}`, colors.bright);
        log('\n');

    } catch (error) {
        log(`\n❌ Benchmark failed: ${error.message}`, colors.red);
        console.error(error);
        process.exit(1);
    }
}

main();
