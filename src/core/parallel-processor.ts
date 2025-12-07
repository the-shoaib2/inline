/**
 * Parallel processing system for CPU-intensive tasks.
 *
 * Features:
 * - Concurrent processing with configurable concurrency limits
 * - Context gathering from multiple files in parallel
 * - AST parsing with parallel execution
 * - Cache checking with race conditions
 * - Batch processing for large datasets
 */

import * as vscode from 'vscode';
import * as os from 'os';
import { Logger } from '../system/logger';

/**
 * High-performance parallel processor for CPU-intensive operations.
 * Optimizes context gathering, AST parsing, and cache lookups through
 * concurrent execution while respecting system resources.
 */
export class ParallelProcessor {
    private logger: Logger;
    private maxConcurrency: number;

    constructor() {
        this.logger = new Logger('ParallelProcessor');
        // Use CPU count - 1 to leave one core for main thread responsiveness
        this.maxConcurrency = Math.max(2, os.cpus().length - 1);
    }

    /**
     * Execute multiple tasks concurrently with controlled concurrency.
     * Uses a sliding window approach to limit concurrent executions.
     *
     * @param tasks - Array of async task functions
     * @param maxConcurrency - Optional override for concurrency limit
     * @returns Array of results in completion order
     */
    public async processInParallel<T>(
        tasks: Array<() => Promise<T>>,
        maxConcurrency?: number
    ): Promise<T[]> {
        const limit = maxConcurrency || this.maxConcurrency;
        const results: T[] = [];
        const executing: Promise<void>[] = [];

        for (const task of tasks) {
            const promise = task().then(result => {
                results.push(result);
            });

            executing.push(promise);

            // Wait for one task to complete before starting another
            if (executing.length >= limit) {
                await Promise.race(executing);
                executing.splice(executing.findIndex(p => p === promise), 1);
            }
        }

        await Promise.all(executing);
        return results;
    }

    /**
     * Gather context from multiple files concurrently.
     * Optimizes file processing for large-scale context analysis.
     *
     * @param files - Array of file URIs to process
     * @param processor - Function to extract context from each file
     * @returns Map of file paths to their context content
     */
    public async gatherContextParallel(
        files: vscode.Uri[],
        processor: (uri: vscode.Uri) => Promise<string>
    ): Promise<Map<string, string>> {
        const startTime = Date.now();
        const contextMap = new Map<string, string>();

        // Create async tasks for each file
        const tasks = files.map(uri => async () => {
            try {
                const content = await processor(uri);
                return { uri: uri.fsPath, content };
            } catch (error) {
                this.logger.warn(`Failed to process ${uri.fsPath}:`, error as Error);
                return { uri: uri.fsPath, content: '' };
            }
        });

        const results = await this.processInParallel(tasks);

        // Filter out empty results and build context map
        results.forEach(({ uri, content }) => {
            if (content) {
                contextMap.set(uri, content);
            }
        });

        const duration = Date.now() - startTime;
        this.logger.info(`Gathered context from ${files.length} files in ${duration}ms (parallel)`);

        return contextMap;
    }

    /**
     * Parse multiple files concurrently using AST parser.
     * Optimizes syntax analysis for large codebases.
     *
     * @param files - Array of file paths to parse
     * @param parser - AST parsing function
     * @returns Map of file paths to parsed AST results
     */
    public async parseFilesParallel<T>(
        files: string[],
        parser: (content: string) => Promise<T>
    ): Promise<Map<string, T>> {
        const resultMap = new Map<string, T>();

        const tasks = files.map(file => async () => {
            try {
                const parsed = await parser(file);
                return { file, parsed };
            } catch (error) {
                this.logger.warn(`Failed to parse ${file}:`, error as Error);
                return { file, parsed: null };
            }
        });

        const results = await this.processInParallel(tasks);

        // Only include successful parses
        results.forEach(({ file, parsed }) => {
            if (parsed !== null) {
                resultMap.set(file, parsed);
            }
        });

        return resultMap;
    }

    /**
     * Check multiple caches concurrently and return first hit.
     * Uses Promise.all for parallel execution with error handling.
     *
     * @param cacheChecks - Array of cache check functions
     * @returns First non-null cache result or null if all miss
     */
    public async checkCachesParallel<T>(
        cacheChecks: Array<() => Promise<T | null>>
    ): Promise<T | null> {
        // Execute all cache checks in parallel
        const results = await Promise.all(
            cacheChecks.map(check =>
                check().catch(() => null) // Handle individual cache failures
            )
        );

        // Return first successful cache hit
        return results.find(r => r !== null) || null;
    }

    /**
     * Process items in batches with parallel execution.
     * Balances memory usage with processing efficiency.
     *
     * @param items - Array of items to process
     * @param processor - Async processing function
     * @param batchSize - Size of each processing batch (default: 10)
     * @returns Array of processed results
     */
    public async batchProcess<TInput, TOutput>(
        items: TInput[],
        processor: (item: TInput) => Promise<TOutput>,
        batchSize: number = 10
    ): Promise<TOutput[]> {
        const results: TOutput[] = [];

        // Process items in batches to control memory usage
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(item => processor(item))
            );
            results.push(...batchResults);
        }

        return results;
    }
}
