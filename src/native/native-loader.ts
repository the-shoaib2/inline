import { Logger } from '../system/logger';
import type * as NativeBindings from '@inline/native';

/**
 * Native module loader with graceful fallback to TypeScript implementations.
 * 
 * Features:
 * - Automatic platform detection
 * - Lazy loading of native modules
 * - Graceful fallback if native module fails
 * - Performance monitoring
 * - Error handling and logging
 */
export class NativeLoader {
    private static instance: NativeLoader;
    private logger: Logger;
    private native: typeof NativeBindings | null = null;
    private nativeCpp: any | null = null;
    private available: boolean = false;
    private availableCpp: boolean = false;
    private loadAttempted: boolean = false;
    private performanceMetrics: Map<string, number[]> = new Map();

    private constructor() {
        this.logger = new Logger('NativeLoader');
    }

    public static getInstance(): NativeLoader {
        if (!NativeLoader.instance) {
            NativeLoader.instance = new NativeLoader();
        }
        return NativeLoader.instance;
    }

    /**
     * Check if native module is available
     */
    public isAvailable(): boolean {
        if (!this.loadAttempted) {
            this.loadNativeModule();
        }
        return this.available;
    }

    /**
     * Load native module
     */
    private loadNativeModule(): void {
        this.loadAttempted = true;

        try {
            // Try to load the Rust native module
            // @ts-ignore
            this.native = require('@inline/native');
            
            if (this.native && this.native.isAvailable()) {
                this.available = true;
                const version = this.native.getVersion();
                this.logger.info(`Native Rust module loaded successfully (v${version})`);
                this.logger.info(this.native.init());
            } else {
                throw new Error('Native Rust module loaded but not available');
            }
        } catch (error) {
            this.logger.warn('Failed to load native Rust module, using TypeScript fallback', error as Error);
            this.available = false;
            this.native = null;
        }

        // Try to load the C++ native module (optional)
        try {
            // @ts-ignore
            this.nativeCpp = require('@inline/native-cpp');
            this.availableCpp = true;
            this.logger.info('Native C++ module loaded successfully');
        } catch (error) {
            this.logger.info('Native C++ module not available (optional)');
            this.availableCpp = false;
            this.nativeCpp = null;
        }
    }

    /**
     * Get native module (throws if not available)
     */
    private getNative(): typeof NativeBindings {
        if (!this.isAvailable() || !this.native) {
            throw new Error('Native module not available');
        }
        return this.native;
    }

    /**
     * Track performance of native vs fallback implementations
     */
    private trackPerformance(operation: string, duration: number): void {
        if (!this.performanceMetrics.has(operation)) {
            this.performanceMetrics.set(operation, []);
        }
        const metrics = this.performanceMetrics.get(operation)!;
        metrics.push(duration);
        
        // Keep only last 100 measurements
        if (metrics.length > 100) {
            metrics.shift();
        }
    }

    /**
     * Get average performance for an operation
     */
    public getAveragePerformance(operation: string): number | null {
        const metrics = this.performanceMetrics.get(operation);
        if (!metrics || metrics.length === 0) {
            return null;
        }
        return metrics.reduce((a, b) => a + b, 0) / metrics.length;
    }

    // ==================== AST Parsing ====================

    public async parseAst(code: string, languageId: string): Promise<any | null> {
        const start = performance.now();
        try {
            const result = this.getNative().parseAst(code, languageId);
            this.trackPerformance('parseAst', performance.now() - start);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            this.logger.debug('Native parseAst failed', error as Error);
            throw error;
        }
    }

    public async queryAst(code: string, languageId: string, query: string): Promise<any[]> {
        const start = performance.now();
        try {
            const result = this.getNative().queryAst(code, languageId, query);
            this.trackPerformance('queryAst', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native queryAst failed', error as Error);
            throw error;
        }
    }

    public async parseFilesParallel(files: Array<[string, string]>): Promise<Array<any | null>> {
        const start = performance.now();
        try {
            const results = this.getNative().parseFilesParallel(files);
            this.trackPerformance('parseFilesParallel', performance.now() - start);
            return results.map(r => r ? JSON.parse(r) : null);
        } catch (error) {
            this.logger.debug('Native parseFilesParallel failed', error as Error);
            throw error;
        }
    }

    public clearParserCache(): void {
        try {
            this.getNative().clearParserCache();
        } catch (error) {
            this.logger.debug('Native clearParserCache failed', error as Error);
        }
    }

    // ==================== Semantic Analysis ====================

    public extractImports(code: string, languageId: string): any[] {
        const start = performance.now();
        try {
            const result = this.getNative().extractImports(code, languageId);
            this.trackPerformance('extractImports', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native extractImports failed', error as Error);
            throw error;
        }
    }

    public extractFunctions(code: string, languageId: string): any[] {
        const start = performance.now();
        try {
            const result = this.getNative().extractFunctions(code, languageId);
            this.trackPerformance('extractFunctions', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native extractFunctions failed', error as Error);
            throw error;
        }
    }

    public extractDecorators(code: string, languageId: string): any[] {
        const start = performance.now();
        try {
            const result = this.getNative().extractDecorators(code, languageId);
            this.trackPerformance('extractDecorators', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native extractDecorators failed', error as Error);
            throw error;
        }
    }

    public analyzeSemantics(code: string, languageId: string): any {
        const start = performance.now();
        try {
            const result = this.getNative().analyzeSemantics(code, languageId);
            this.trackPerformance('analyzeSemantics', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native analyzeSemantics failed', error as Error);
            throw error;
        }
    }

    // ==================== Hashing ====================

    public hashPrompt(prompt: string): string {
        const start = performance.now();
        try {
            const result = this.getNative().hashPrompt(prompt);
            this.trackPerformance('hashPrompt', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native hashPrompt failed', error as Error);
            throw error;
        }
    }

    public hashComposite(parts: string[]): string {
        const start = performance.now();
        try {
            const result = this.getNative().hashComposite(parts);
            this.trackPerformance('hashComposite', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native hashComposite failed', error as Error);
            throw error;
        }
    }

    // ==================== Duplication Detection ====================

    public detectDuplicates(code: string, context: string, minLength?: number): any[] {
        const start = performance.now();
        try {
            const result = this.getNative().detectDuplicates(code, context, minLength);
            this.trackPerformance('detectDuplicates', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native detectDuplicates failed', error as Error);
            throw error;
        }
    }

    public findSubstring(haystack: string, needle: string): number | null {
        try {
            return this.getNative().findSubstring(haystack, needle);
        } catch (error) {
            this.logger.debug('Native findSubstring failed', error as Error);
            throw error;
        }
    }

    // ==================== Text Processing ====================

    public tokenizeCode(code: string, languageId: string): any {
        const start = performance.now();
        try {
            const result = this.getNative().tokenizeCode(code, languageId);
            this.trackPerformance('tokenizeCode', performance.now() - start);
            return result;
        } catch (error) {
            this.logger.debug('Native tokenizeCode failed', error as Error);
            throw error;
        }
    }

    public normalizeWhitespace(code: string): string {
        try {
            return this.getNative().normalizeWhitespace(code);
        } catch (error) {
            this.logger.debug('Native normalizeWhitespace failed', error as Error);
            throw error;
        }
    }

    public removeComments(code: string, languageId: string): string {
        try {
            return this.getNative().removeComments(code, languageId);
        } catch (error) {
            this.logger.debug('Native removeComments failed', error as Error);
            throw error;
        }
    }

    public estimateTokens(text: string): number {
        try {
            return this.getNative().estimateTokens(text);
        } catch (error) {
            this.logger.debug('Native estimateTokens failed', error as Error);
            throw error;
        }
    }

    // ==================== C++ Native Extensions ====================

    public simdSearch(text: string, pattern: string): number {
        if (this.availableCpp && this.nativeCpp) {
            return this.nativeCpp.simdSearch(text, pattern);
        }
        return text.indexOf(pattern); // Fallback
    }

    public mmapRead(filePath: string): string | null {
        if (this.availableCpp && this.nativeCpp) {
            try {
                return this.nativeCpp.mmapRead(filePath);
            } catch (error) {
                this.logger.error('mmapRead failed', error as Error);
            }
        }
        return null;
    }

    // ==================== Performance Metrics ====================

    public getPerformanceReport(): string {
        const operations = Array.from(this.performanceMetrics.keys());
        const report: string[] = [
            '=== Native Module Performance Report ===',
            `Status: ${this.available ? 'Available' : 'Not Available'}`,
            '',
        ];

        if (this.available) {
            report.push('Average execution times:');
            for (const op of operations) {
                const avg = this.getAveragePerformance(op);
                if (avg !== null) {
                    report.push(`  ${op}: ${avg.toFixed(2)}ms`);
                }
            }
        }

        return report.join('\n');
    }
}
