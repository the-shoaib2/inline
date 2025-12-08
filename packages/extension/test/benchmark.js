#!/usr/bin/env node

/**
 * Benchmark runner for the Inline extension
 * Measures performance metrics and identifies optimization opportunities
 */

const { performance } = require('perf_hooks');
const path = require('path');

// Simple benchmark utilities
class Benchmark {
    constructor(name) {
        this.name = name;
        this.times = [];
    }

    async run(fn, iterations = 100) {
        console.log(`\n🔥 Running: ${this.name} (${iterations} iterations)`);

        // Warmup
        for (let i = 0; i < 5; i++) {
            await fn();
        }

        // Measure
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            this.times.push(end - start);

            if ((i + 1) % 10 === 0) {
                process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
            }
        }

        console.log(`\r  Progress: ${iterations}/${iterations} ✓`);
        this.printStats();
    }

    printStats() {
        this.times.sort((a, b) => a - b);
        const total = this.times.reduce((sum, t) => sum + t, 0);
        const avg = total / this.times.length;
        const min = this.times[0];
        const max = this.times[this.times.length - 1];
        const p50 = this.times[Math.floor(this.times.length * 0.50)];
        const p95 = this.times[Math.floor(this.times.length * 0.95)];
        const p99 = this.times[Math.floor(this.times.length * 0.99)];

        console.log(`  📊 Results:`);
        console.log(`     Average: ${avg.toFixed(2)}ms`);
        console.log(`     Median:  ${p50.toFixed(2)}ms`);
        console.log(`     Min:     ${min.toFixed(2)}ms`);
        console.log(`     Max:     ${max.toFixed(2)}ms`);
        console.log(`     P95:     ${p95.toFixed(2)}ms`);
        console.log(`     P99:     ${p99.toFixed(2)}ms`);
    }
}

// Benchmark TypeScript compilation
async function benchmarkCompilation() {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    const bench = new Benchmark('TypeScript Compilation');

    await bench.run(async () => {
        await execPromise('tsc -p . --incremental', {
            cwd: path.join(__dirname, '../..')
        });
    }, 10);
}

// Benchmark cache operations
async function benchmarkCache() {
    const bench = new Benchmark('Cache Operations');
    const cache = new Map();

    await bench.run(async () => {
        // Simulate cache operations
        for (let i = 0; i < 100; i++) {
            const key = `key-${i % 50}`;
            cache.set(key, { data: 'test', timestamp: Date.now() });
            cache.get(key);
        }
    }, 1000);
}

// Benchmark string operations
async function benchmarkStringOps() {
    const bench = new Benchmark('String Operations');
    const testString = 'function test() {\n  console.log("hello");\n}\n'.repeat(100);

    await bench.run(async () => {
        // Simulate common string operations
        const lines = testString.split('\n');
        const filtered = lines.filter(l => l.trim().length > 0);
        const joined = filtered.join('\n');
        const hash = Buffer.from(joined).toString('base64');
    }, 1000);
}

// Benchmark JSON operations
async function benchmarkJSON() {
    const bench = new Benchmark('JSON Serialization');
    const data = {
        code: 'function test() { return 42; }',
        language: 'typescript',
        context: Array(100).fill({ line: 'test', indent: 2 })
    };

    await bench.run(async () => {
        const str = JSON.stringify(data);
        JSON.parse(str);
    }, 1000);
}

// Benchmark memory usage
function benchmarkMemory() {
    console.log('\n💾 Memory Usage:');
    const used = process.memoryUsage();
    console.log(`  Heap Used:  ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  RSS:        ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External:   ${(used.external / 1024 / 1024).toFixed(2)} MB`);
}

// Main benchmark suite
async function main() {
    console.log('\n🎯 Inline Extension Performance Benchmarks\n');
    console.log('='.repeat(60));

    benchmarkMemory();
    await benchmarkCache();
    await benchmarkStringOps();
    await benchmarkJSON();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Benchmarks complete!\n');
}

main().catch(console.error);
