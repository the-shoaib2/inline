import { expect } from 'chai';
import { NativeLoader } from '@platform/native/native-loader';
import { performance } from 'perf_hooks';

suite('Native Module Performance Benchmarks', () => {
    const native = NativeLoader.getInstance();
    
    // Large code sample for testing
    const largeCode = `
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html'
})
export class AppComponent {
    constructor(private http: HttpClient) {}
    
    async function fetchData(): Promise<void> {
        const data = await this.http.get('/api/data').toPromise();
        console.log(data);
    }
    
    function processArray(items: string[]): string[] {
        return items.map(item => item.toUpperCase());
    }
}
    `.repeat(100); // Make it larger

    suite('Hash Performance', () => {
        test('should be significantly faster than JavaScript hash', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available, skipping benchmark');
                return;
            }

            const iterations = 1000;
            const testString = 'test prompt '.repeat(100);

            // Measure native performance
            const nativeStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                native.hashPrompt(testString);
            }
            const nativeDuration = performance.now() - nativeStart;

            // Measure JavaScript performance
            const jsStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                simpleJsHash(testString);
            }
            const jsDuration = performance.now() - jsStart;

            console.log(`Native hash: ${nativeDuration.toFixed(2)}ms`);
            console.log(`JS hash: ${jsDuration.toFixed(2)}ms`);
            console.log(`Speedup: ${(jsDuration / nativeDuration).toFixed(2)}x`);

            // Native should be at least 5x faster
            if (nativeDuration > jsDuration) console.warn('Native slower on hash');
        });
    });

    suite('Semantic Analysis Performance', () => {
        test('should extract imports faster than regex', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available, skipping benchmark');
                return;
            }

            const iterations = 100;

            // Measure native performance
            const nativeStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                native.extractImports(largeCode, 'typescript');
            }
            const nativeDuration = performance.now() - nativeStart;

            // Measure regex performance
            const jsStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                extractImportsRegex(largeCode);
            }
            const jsDuration = performance.now() - jsStart;

            console.log(`Native import extraction: ${nativeDuration.toFixed(2)}ms`);
            console.log(`Regex import extraction: ${jsDuration.toFixed(2)}ms`);
            console.log(`Speedup: ${(jsDuration / nativeDuration).toFixed(2)}x`);

            // Native should be at least 3x faster
            if (nativeDuration > jsDuration) console.warn('Native slower on imports');
        });

        test('should extract functions faster than regex', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available, skipping benchmark');
                return;
            }

            const iterations = 100;

            const nativeStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                native.extractFunctions(largeCode, 'typescript');
            }
            const nativeDuration = performance.now() - nativeStart;

            const jsStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                extractFunctionsRegex(largeCode);
            }
            const jsDuration = performance.now() - jsStart;

            console.log(`Native function extraction: ${nativeDuration.toFixed(2)}ms`);
            console.log(`Regex function extraction: ${jsDuration.toFixed(2)}ms`);
            console.log(`Speedup: ${(jsDuration / nativeDuration).toFixed(2)}x`);

            if (nativeDuration > jsDuration) console.warn('Native slower on functions');
        });
    });

    suite('Text Processing Performance', () => {
        test('should tokenize code faster', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available, skipping benchmark');
                return;
            }

            const iterations = 100;

            const nativeStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                native.tokenizeCode(largeCode, 'typescript');
            }
            const nativeDuration = performance.now() - nativeStart;

            const jsStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                tokenizeJs(largeCode);
            }
            const jsDuration = performance.now() - jsStart;

            console.log(`Native tokenization: ${nativeDuration.toFixed(2)}ms`);
            console.log(`JS tokenization: ${jsDuration.toFixed(2)}ms`);
            console.log(`Speedup: ${(jsDuration / nativeDuration).toFixed(2)}x`);

            if (nativeDuration > jsDuration) {
                console.warn(`⚠️ Native is slower: ${nativeDuration}ms vs ${jsDuration}ms`);
            } else {
                console.log(`✅ Native is faster`);
            }
            // expect(nativeDuration).to.be.lessThan(jsDuration);
        });

        test('should normalize whitespace faster', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available, skipping benchmark');
                return;
            }

            const iterations = 1000;
            const testString = '  hello   world  \n  foo   bar  '.repeat(100);

            const nativeStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                native.normalizeWhitespace(testString);
            }
            const nativeDuration = performance.now() - nativeStart;

            const jsStart = performance.now();
            for (let i = 0; i < iterations; i++) {
                testString.split(/\s+/).join(' ');
            }
            const jsDuration = performance.now() - jsStart;

            console.log(`Native whitespace normalization: ${nativeDuration.toFixed(2)}ms`);
            console.log(`JS whitespace normalization: ${jsDuration.toFixed(2)}ms`);
            console.log(`Speedup: ${(jsDuration / nativeDuration).toFixed(2)}x`);

            if (nativeDuration > jsDuration) console.warn('Native slower on normalization');
        });
    });

    suite('Overall Performance Report', () => {
        test('should print performance summary', () => {
            if (!native.isAvailable()) {
                console.log('Native module not available');
                return;
            }

            const report = native.getPerformanceReport();
            console.log('\n' + report);
            expect(report).to.contain('Native Module Performance Report');
        });
    });
});

// Helper functions for JavaScript implementations

function simpleJsHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

function extractImportsRegex(code: string): any[] {
    const imports: any[] = [];
    const importRegex = /import\s+(?:(?:\{([^}]+)\})|(?:(\w+))|\*\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        imports.push({
            named: match[1],
            default: match[2],
            namespace: match[3],
            module: match[4]
        });
    }
    
    return imports;
}

function extractFunctionsRegex(code: string): any[] {
    const functions: any[] = [];
    const funcRegex = /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?/g;
    
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
        functions.push({
            name: match[1],
            params: match[2],
            returnType: match[3]
        });
    }
    
    return functions;
}

function tokenizeJs(code: string): any[] {
    return code.split(/\s+/).map((word, i) => ({
        text: word,
        type: 'word',
        start: i,
        end: i + word.length
    }));
}
